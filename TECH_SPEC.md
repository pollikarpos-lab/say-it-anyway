# Say It Anyway — технічне ТЗ

**Версія:** 1.1 · **Дата:** 18 вересня 2026
**Зміни проти 1.0:** джерело правди для всіх даних — PostgreSQL.
`localStorage` більше не зберігає стан користувача.

---

## 1. Що є зараз

PWA без залежностей: нативні ES-модулі, власний рендер на `h()`,
hash-роутер, `MediaRecorder`, `SpeechSynthesis`. Вручну написані manifest
і service worker. 47 модульних тестів, 150 наскрізних.

**Чому так:** середовище збірки не має доступу ні до npm-реєстру, ні до
CDN — 403 на все. `npm install` неможливий. Тимчасове рішення,
архітектура одразу розділена під міграцію.

```
src/
  content/     уроки 1–5, звірені тексти, маршрут   → переноситься як є
  lib/safety   кризовий детектор, фільтр виходу     → переноситься як є
  lib/audio    запис і відтворення                  → переноситься як є
  lib/storage  localStorage                         → ЗАМІНЮЄТЬСЯ на API
  lib/analytics подіїWhitelist                      → переписується під сервер
  providers/   інтерфейси STT/LLM/TTS               → переноситься як є
  app/, screens/                                    → переписується на React
  styles.css                                        → у tailwind.config
```

**150 наскрізних сценаріїв — це специфікація поведінки.** Під React їх
переписати на Playwright, але перелік перевірок зберегти: він описує, що
саме застосунок має робити на кожному кроці.

---

## 2. Цільова архітектура

```
                    Cloudflare (DNS, WAF, кеш)
                              │
                      Caddy (HTTPS, reverse proxy)
                              │
        ┌─────────────────────┼─────────────────────┐
        │                     │                     │
   apps/web              apps/api              apps/cms
   React+Vite            Fastify               Payload 3
   статика               /api/v1               (Next.js)
                              │                     │
                              └────────┬────────────┘
                                  PostgreSQL 16
                              ЄДИНЕ джерело правди
```

**Монорепозиторій:**

```
say-it-anyway/
├── apps/
│   ├── web/          React + Vite + Tailwind (PWA)
│   ├── api/          Fastify, /api/v1
│   └── cms/          Payload 3 (Next.js), admin.*
├── packages/
│   ├── content/      уроки й тексти — спільні для web, api, cms
│   ├── shared/       типи, контракти, safety-фільтри
│   └── db/           схема, міграції, запити
├── infra/
│   ├── docker-compose.yml
│   └── Caddyfile
└── .github/workflows/
```

`packages/shared` містить кризовий детектор і фільтр заборонених
формулювань — вони мають працювати **і** на клієнті, **і** на сервері.

---

## 3. Ідентифікація без реєстрації

Щоб зберігати прогрес у базі, сервер має розуміти, **чий** це прогрес.
Реєстрація перед першим уроком уб'є воронку саме там, де ми її
вимірюємо. Тому — анонімна ідентичність пристрою.

**Як працює:**

1. Перший візит → `POST /api/v1/devices` → сервер створює запис і
   повертає `deviceId` (UUID) + підписаний токен.
2. Токен лежить у **httpOnly Secure SameSite=Lax cookie**, час життя рік.
3. Кожен наступний запит несе цей токен. Усі дані в базі прив'язані до
   `device_id`.
4. Реєстрації немає. Користувач нічого не вводить.

> **Чесно про межу можливого.** «Усі дані в базі» не означає «нуль байтів
> на клієнті»: один ідентифікатор на клієнті лишитися **мусить**, інакше
> сервер фізично не зможе відрізнити двох користувачів. Це один cookie з
> UUID — не стан застосунку, не прогрес, не відповіді. Усе інше живе
> тільки в Postgres.

**Пізніше, коли з'являться акаунти:** таблиця `users` і поле
`devices.user_id`. Прив'язка пристрою до акаунта — без втрати вже
накопиченого прогресу. Схема нижче це передбачає з першого дня.

---

## 4. Схема бази

```sql
-- ── Ідентичність ──────────────────────────────────────────
CREATE TABLE devices (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       uuid REFERENCES users(id) ON DELETE CASCADE,  -- NULL поки немає акаунтів
  created_at    timestamptz NOT NULL DEFAULT now(),
  last_seen_at  timestamptz NOT NULL DEFAULT now(),
  platform      text,          -- 'ios' | 'android' | 'desktop'
  region        text           -- 'us' | 'ca' | 'eu' | 'ua' | 'other'
);

CREATE TABLE users (                    -- заготовка, поки не використовується
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email         citext UNIQUE,
  created_at    timestamptz NOT NULL DEFAULT now()
);

-- ── Профіль (відповіді онбордингу) ────────────────────────
CREATE TABLE profiles (
  device_id     uuid PRIMARY KEY REFERENCES devices(id) ON DELETE CASCADE,
  name          text,
  region        text,
  comfort       text,          -- silent | few | errors | fluent
  mode          text,          -- christian | open
  reminder      text,
  unlock_all    boolean NOT NULL DEFAULT false,
  updated_at    timestamptz NOT NULL DEFAULT now()
);

-- ── Прогрес по днях ───────────────────────────────────────
CREATE TABLE lesson_progress (
  id            bigserial PRIMARY KEY,
  device_id     uuid NOT NULL REFERENCES devices(id) ON DELETE CASCADE,
  day           smallint NOT NULL,
  status        text NOT NULL,        -- started | completed
  kind          text NOT NULL,        -- shadowing | template | open
  started_at    timestamptz NOT NULL DEFAULT now(),
  completed_at  timestamptz,
  speech_ms     integer NOT NULL DEFAULT 0,
  retakes       smallint NOT NULL DEFAULT 0,
  used_targets  jsonb   NOT NULL DEFAULT '[]',
  phrases_said  smallint NOT NULL DEFAULT 0,
  via_text      boolean NOT NULL DEFAULT false,
  UNIQUE (device_id, day)
);

-- ── Відповіді користувача ─── ЧУТЛИВІ ДАНІ ────────────────
CREATE TABLE answers (
  id            bigserial PRIMARY KEY,
  device_id     uuid NOT NULL REFERENCES devices(id) ON DELETE CASCADE,
  day           smallint NOT NULL,
  transcript    text NOT NULL,        -- те, що сказала людина
  improved      text,                 -- природніша версія
  corrections   jsonb NOT NULL DEFAULT '[]',
  provider      text NOT NULL,        -- openai | rule-based | text-input
  is_demo       boolean NOT NULL DEFAULT false,
  created_at    timestamptz NOT NULL DEFAULT now(),
  delete_after  timestamptz NOT NULL  -- created_at + 90 днів
);

-- ── Збережені фрази ───────────────────────────────────────
CREATE TABLE saved_phrases (
  id            bigserial PRIMARY KEY,
  device_id     uuid NOT NULL REFERENCES devices(id) ON DELETE CASCADE,
  day           smallint NOT NULL,
  text          text NOT NULL,
  created_at    timestamptz NOT NULL DEFAULT now()
);

-- ── Згоди ─────────────────────────────────────────────────
CREATE TABLE consents (
  device_id       uuid PRIMARY KEY REFERENCES devices(id) ON DELETE CASCADE,
  voice_at        timestamptz,
  store_answers_at timestamptz,       -- окрема згода на зберігання тексту
  analytics_at    timestamptz,
  terms_version   text
);

-- ── Аналітика (без вільного тексту) ───────────────────────
CREATE TABLE events (
  id            bigserial PRIMARY KEY,
  device_id     uuid REFERENCES devices(id) ON DELETE CASCADE,
  name          text NOT NULL,
  day           smallint,
  props         jsonb NOT NULL DEFAULT '{}',   -- тільки білий список полів
  created_at    timestamptz NOT NULL DEFAULT now()
);

-- ── Ліміти й бюджет ───────────────────────────────────────
CREATE TABLE usage_counters (
  device_id     uuid NOT NULL REFERENCES devices(id) ON DELETE CASCADE,
  day_bucket    date NOT NULL,
  sessions      integer NOT NULL DEFAULT 0,
  cost_cents    integer NOT NULL DEFAULT 0,
  PRIMARY KEY (device_id, day_bucket)
);

CREATE INDEX ON lesson_progress (device_id, day);
CREATE INDEX ON answers (device_id, day);
CREATE INDEX ON answers (delete_after);
CREATE INDEX ON events (name, created_at);
```

Контент (`lessons`, `passages`, `translations`) — окремі таблиці, якими
керує Payload. Див. розділ 8.

---

## 5. Зберігання відповідей — рішення, яке треба ухвалити свідомо

`answers.transcript` — це **найчутливіші дані в системі**. Люди
розповідають туди про страх втратити роботу, про родину, що лишилася в
Україні, про самотність. Це не «дані користувача», це особисті історії.

Зберігати їх можна і корисно: без них не буде ні порівняння дня 3 з днем
7, ні прогресу в застосунку, ні можливості показати людині її власний
шлях. Але це піднімає планку.

**Правила, які я закладаю в схему й код:**

| Правило | Як реалізовано |
|---|---|
| Окрема згода саме на зберігання тексту | `consents.store_answers_at`; відмова → урок проходиться, відповідь не пишеться |
| Термін зберігання 90 днів | `answers.delete_after`, нічний `DELETE` за індексом |
| Кризові відповіді **не зберігаються взагалі** | спрацював `detectCrisis()` → запис не створюється, `/analyze` не викликається |
| Аудіо не зберігається ніколи | у пам'яті, видаляється після транскрипції |
| Текст не потрапляє в логи | логер із фільтром полів |
| Видалення всіх даних однією кнопкою | `DELETE /api/v1/me` → `ON DELETE CASCADE` вичищає все |
| Шифрування диска на сервері | Hetzner LUKS при створенні сервера |

> **Не заявляти про шифрування даних у базі, поки його немає.**
> Шифрування диска ≠ шифрування полів. Якщо хочемо друге —
> `pgcrypto` для `answers.transcript`, але тоді Payload не зможе їх
> показувати. Моя рекомендація: поки що шифрування диска достатньо,
> але сказати про це в політиці конфіденційності чесно.

**Альтернатива, якщо не хочете зберігати текст зовсім:** зберігати лише
похідні метрики — `speech_ms`, `used_targets`, кількість корекцій, і
**не** зберігати `transcript`/`improved`. Прогрес працюватиме, порівняння
дня 3 з днем 7 — ні. Це ваше рішення; схема підтримує обидва варіанти
(поле `transcript` робиться nullable).

---

## 6. Офлайн і втрата зв'язку

`localStorage` давав те, про що зазвичай не думають: застосунок працював
без мережі й нічого не губив. З базою як джерелом правди це зникає.

**Що ламається без запобіжника:**
метро, ліфт, слабкий Wi-Fi у церкві — людина записала відповідь, зв'язок
пропав, відповідь втрачена разом із бажанням повторювати.

**Рекомендація: черга записів в IndexedDB.**

- IndexedDB використовується **не як сховище стану**, а як **черга
  незапісаних змін**. Джерело правди — Postgres.
- Запис у чергу → спроба відправити → успіх → видалення з черги.
- При старті застосунку — синхронізація: спершу відправити чергу, потім
  прочитати стан із сервера.
- Читання завжди з сервера. Кеш для читання не тримаємо — так простіше
  й не буває розсинхрону.

Це не суперечить вимозі «всі дані в базі»: у черзі лежать лише ті
записи, які ще не доїхали, і живуть вони секунди.

**Якщо черги не робити** — треба явно показувати стан «немає зв'язку» і
блокувати запис. Гірший досвід, але чесний. Вирішуйте; я б робив чергу.

---

## 7. API

Версіонування з першого дня: `/api/v1`. Мобільний застосунок з'явиться
пізніше й не має ламатися від змін вебу.

Автентифікація: підписаний cookie з `deviceId` (див. розділ 3).
Для мобільного — той самий токен у заголовку `Authorization: Bearer`.

### Ідентичність і профіль

```
POST   /api/v1/devices              → { deviceId }  + Set-Cookie
GET    /api/v1/me                   → { profile, progress[], savedPhrases[], consents }
PATCH  /api/v1/me/profile           { name, region, comfort, mode, reminder }
POST   /api/v1/me/consents          { voice?, storeAnswers?, analytics? }
DELETE /api/v1/me                   → видаляє все, 204
GET    /api/v1/me/export            → JSON з усіма даними (GDPR)
```

### Прогрес

```
POST   /api/v1/progress/:day/start     → { progressId }
PATCH  /api/v1/progress/:day           { speechMs, retakes, usedTargets, phrasesSaid, viaText }
POST   /api/v1/progress/:day/complete  → { unlockedDay }
GET    /api/v1/progress                → [{ day, status, speechMs, … }]
```

### Фрази

```
POST   /api/v1/phrases              { day, text }
GET    /api/v1/phrases              → [{ id, day, text, createdAt }]
DELETE /api/v1/phrases/:id
```

### Мовний цикл

```
POST   /api/v1/stt                  multipart: audio, lang, day
                                    → { text, confidence, durationMs }

POST   /api/v1/analyze              { transcript, level, day, targets[] }
                                    → { corrections[≤3], improved, usedTargets, totalFound }

POST   /api/v1/tts                  { text, voice } → { url }

POST   /api/v1/answers              { day, transcript, improved, corrections, provider, isDemo }
                                    → { answerId }   (лише якщо є згода)
GET    /api/v1/answers?day=3        → історія відповідей
DELETE /api/v1/answers/:id
```

### Аналітика

```
POST   /api/v1/events               { name, day?, props }   — білий список полів
```

Сервер **відкидає** будь-яке поле поза білим списком і будь-який рядок
довший за 40 символів. Вільний текст фізично не може потрапити в `events`.

### Вимоги до промпта `/analyze`

1. `improved` — **та сама думка користувача**, змінена лише форма.
   Заборонено додавати факти, поради, духовні коментарі.
2. У мовному розборі не згадувати Бога, віру, молитву взагалі.
3. `why` — простою українською, без граматичної термінології, де можна.
4. Сервер **не отримує** біблійного тексту й не має його переписувати.

Незалежно від промпта, `improved` проганяється через `filterAiOutput()`
на клієнті **і** на сервері. Не пройшов — не показується і не зберігається.

### Запобіжники

| Що | Значення |
|---|---|
| Rate limit | 30 сесій на пристрій на добу — `usage_counters` |
| Розмір аудіо | ≤ 5 МБ, ≤ 70 с |
| Таймаут | 30 с |
| **Денний бюджет** | ліміт у доларах; перевищення → режим демо, не помилка |
| Аудіо на диску | **ніколи** |
| Логи | без тексту відповідей |
| CORS | тільки свої домени |

> **Бюджетний стоп — не «на потім».** Без нього один бот за ніч з'їсть
> кількасот доларів. Найдорожча помилка, якої легко уникнути.

### Кризовий сценарій

`detectCrisis()` працює **на клієнті, до будь-якого запиту**. При
спрацюванні `/analyze` і `/answers` не викликаються взагалі — ні розбору,
ні запису в базу. Дублюється на сервері як друга лінія: якщо текст
все-таки прийшов, він відхиляється з кодом 422 і не зберігається.

---

## 8. Payload CMS

**Payload 3 побудований на Next.js** — це окремий застосунок, а не
бібліотека всередині React-фронта. `apps/cms`, домен
`admin.sayitanyway.app`, спільна база.

**Колекції контенту:**

| Колекція | Поля |
|---|---|
| `passages` | `refUk`, `refEn`, `uk[]`, `en[]`, `translation`, **`verifiedAgainst[]`**, `contextBody`, `contextCaution` |
| `lessons` | `day`, `kind`, `title`, `intro{christian,open}`, `lifeQuestion`, `targets[]`, `practice{}`, `step{}` |
| `translations` | `code`, `title`, `licence`, `licenceUrl` |

**Жорсткі правила:**
- `verifiedAgainst` обов'язкове, **мінімум два джерела** для української
- публікація уривка лише після заповнення джерел звірки
- поле «контекст» обов'язкове і візуально відділене від Писання
- ролі: `admin` (Олег), `editor`

**Таблиці користувачів у Payload не показувати за замовчуванням.**
`answers.transcript` — особисті історії людей, а не контент для
редагування. Якщо потрібен перегляд для підтримки — окрема роль і
журнал доступу.

`packages/content` лишається джерелом правди для вже написаних днів 1–5;
Payload наповнюється з них міграцією.

---

## 9. Сервер

**Hetzner Cloud CX22** (2 vCPU, 4 ГБ, 40 ГБ). Локація Nuremberg або Helsinki.
**Ubuntu 24.04 LTS** — підтримка до 2029, найбільша база документації.

**При створенні сервера увімкнути шифрування диска** — тепер на ньому
живуть особисті дані.

```bash
adduser deploy && usermod -aG sudo deploy
sed -i 's/^#*PermitRootLogin.*/PermitRootLogin no/' /etc/ssh/sshd_config
sed -i 's/^#*PasswordAuthentication.*/PasswordAuthentication no/' /etc/ssh/sshd_config
systemctl restart ssh

ufw default deny incoming && ufw allow 22,80,443/tcp && ufw enable
apt install -y fail2ban unattended-upgrades
dpkg-reconfigure --priority=low unattended-upgrades
```

**Caddy замість nginx + certbot** — сертифікати сам:

```caddy
sayitanyway.app {
    handle /api/* { reverse_proxy api:3000 }
    handle { root * /srv/web; try_files {path} /index.html; file_server }
}
admin.sayitanyway.app { reverse_proxy cms:3001 }
```

**Postgres у Docker, порт назовні не відкривати.** Пароль у `.env`.

### Бекапи — тепер критичні

Раніше втрата бази означала втрату контенту. Тепер — втрату прогресу
всіх користувачів.

- `pg_dump` щодня о 3:00 → **Hetzner Storage Box** (≈€4/міс)
- зберігати 14 щоденних + 3 щотижневі
- **раз на місяць — відновлення на порожню базу й перевірка**
- моніторинг: не було бекапу 26 годин → лист

> Бекап, який ніхто жодного разу не відновлював, — це не бекап.

---

## 10. Аналітика

Події вже визначені — 22 штуки з білим списком полів. Тепер вони йдуть
у власну таблицю `events`, а не лише в зовнішню систему.

Ключові для воронки:
`landing_viewed` → `onboarding_completed` → `lesson_started` →
`voice_recording_started` → `voice_submitted` → `lesson_completed`

**Власна таблиця `events` дає головну перевагу:** воронку можна
порахувати SQL-запитом, без зовнішнього сервісу й без cookie-банера.

```sql
SELECT name, count(DISTINCT device_id)
FROM events WHERE created_at > now() - interval '7 days'
GROUP BY name ORDER BY 2 DESC;
```

Зовнішня аналітика потрібна лише для джерел трафіку. Тут:

| | GA4 | Plausible / Umami |
|---|---|---|
| Cookie-банер | **обов'язковий** | не потрібен |
| ЄС | питання передачі даних спірне | дані на вашому сервері |
| Ціна | 0 | 0 (self-host на тому ж VPS) |

Аудиторія в ЄС — рекомендую Plausible. GA4 Олег уже реєструє, рішення за
вами.

**У жодну аналітику не потрапляє текст відповідей, транскрипції чи
збережені фрази.**

---

## 11. Юридичне — планка піднялася

Поки дані лежали в браузері, ми не були розпорядником персональних
даних. Тепер — є.

- [ ] Політика конфіденційності: що зберігаємо, скільки, як видалити
- [ ] Умови користування
- [ ] Окрема згода на зберігання тексту відповідей — **до першого запису**
- [ ] `GET /api/v1/me/export` — вивантаження своїх даних (GDPR, ст. 20)
- [ ] `DELETE /api/v1/me` — видалення (GDPR, ст. 17), **уже в API**
- [ ] Термін зберігання 90 днів — назвати в політиці
- [ ] Cookie-банер, якщо GA4
- [ ] Не заявляти про шифрування полів, якщо є лише шифрування диска

---

## 12. Перехід із чату в код

Після Етапу 1 краще працювати **Claude Code просто в репозиторії**:

```bash
npm install -g @anthropic-ai/claude-code
cd say-it-anyway && claude
```

або розширення «Claude Code» для VS Code.

Claude бачить увесь репозиторій, редагує файли напряму, запускає тести,
робить коміти. Ніяких архівів туди-сюди.

`CLAUDE.md` у корені вже написаний — правила проєкту, які читаються
автоматично на початку кожної сесії.

---

## 13. CI/CD

```
.github/workflows/
  test.yml     на кожен push: lint + unit + Playwright
  migrate.yml  міграції бази — окремим кроком, до деплою
  deploy.yml   на merge у main: build → rsync → docker compose up -d
```

**GitHub Secrets:** `SSH_HOST`, `SSH_KEY`, `OPENAI_API_KEY`,
`POSTGRES_PASSWORD`, `PAYLOAD_SECRET`, `COOKIE_SECRET`.

Захист гілки `main`: заборонити прямий push, вимагати зелені тести.
Гілки: `main` → продакшн, `dev` → `staging.sayitanyway.app`.

**Міграції бази — тільки вперед, з версіонуванням.** Drizzle або Prisma.
Відкат робиться новою міграцією, не `DROP`.

---

## 14. Порядок міграції фронта

Порядок, за якого в будь-який момент є працюючий застосунок:

1. Vite + React + TS, порожній каркас
2. Tailwind, токени з `styles.css` у `theme.extend`
3. `packages/content` і `lib/safety`, `lib/audio` — копіювання без правок
4. **`lib/storage` → клієнт API** (`useProfile`, `useProgress`, `usePhrases`)
5. Спільні компоненти: `Button`, `Card`, `Layer`, `ThoughtPair`, `Player`
6. Екрани: Landing → Onboarding → Route → Lesson → Settings
7. Рушій уроку — керований даними, як зараз (`lesson.steps`)
8. Черга IndexedDB для незапісаних змін
9. PWA: manifest + service worker
10. Playwright: перенести 150 сценаріїв

**Приймальний критерій:** усі 150 сценаріїв зелені, вигляд збігається,
прогрес виживає після очищення даних браузера на іншому пристрої з тим
самим cookie.

---

## 15. Відкриті питання

| Питання | Хто вирішує |
|---|---|
| Зберігати `transcript` чи лише метрики | **Олег** — це продуктове й етичне рішення |
| Черга IndexedDB чи блокування без мережі | друг |
| GA4 чи Plausible | друг + Олег |
| Fastify чи Express | друг |
| Drizzle чи Prisma | друг |
| STT: OpenAI Whisper чи Deepgram | після заміру собівартості |
| Ліцензія УБТ на Огієнка | чекаємо відповіді |

---

## 16. Що перевірити найпершим

**До будь-якої міграції** — запис голосу в Safari на справжньому iPhone.

`MediaRecorder` на iOS історично примхливий, формат там `audio/mp4`, не
webm. Код це враховує, але наживо не перевірявся жодного разу. Якщо там
проблема — вона стосується всієї конструкції продукту.

Спосіб перевірки — у `OLEG_SETUP.md`, крок 9.

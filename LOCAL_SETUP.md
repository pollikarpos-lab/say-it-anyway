# Запуск на localhost

## Найкоротший шлях

```bash
unzip say-it-anyway-v0.5.zip
cd say-it-anyway-claude
npm run dev
```

Відкрити **http://localhost:5173**

`npm install` **не потрібен.** `dependencies` і `devDependencies` порожні,
`node_modules` немає. Потрібен лише **Node ≥ 20** (перевірено на 22.22).

## Що ще можна запустити

```bash
npm test        # 47 модульних тестів (вбудований ранер Node)
npm run build   # dist/ (статичний PWA) + dist/artifact.html (однофайловий бандл)
npm run preview # віддає зібраний dist/ на :4173

# наскрізний прогін у справжньому браузері (150 перевірок + знімки)
node scripts/serve.mjs 5173 ./dist &
node scripts/e2e.mjs
```

Для `e2e.mjs` потрібен Chromium. Шлях береться зі змінної `CHROME_BIN`:

```bash
CHROME_BIN=/usr/bin/chromium node scripts/e2e.mjs
# macOS:
CHROME_BIN="/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" node scripts/e2e.mjs
```

## Чому не можна просто відкрити index.html

Подвійний клік по файлу не спрацює: `file://` блокує ES-модулі, service
worker і мікрофон. Тільки через `npm run dev`.

## Мікрофон

На `http://localhost` мікрофон **працює** — localhost вважається
захищеним контекстом. Це перша нагода перевірити справжній запис:
у моєму середовищі був лише фейковий мікрофон Chromium.

## ⚠️ Головна пастка: перевірка з телефона

Спокуса відкрити `http://192.168.1.x:5173` з айфона в тій самій мережі.
**Так мікрофон не запрацює** — LAN-адреса по http не є захищеним
контекстом, `getUserMedia` мовчки відмовить. Застосунок це розпізнає й
запропонує пройти текстом, але справжній запис ви не перевірите.

Три робочі варіанти:

1. **Тунель із HTTPS** — найшвидше:
   ```bash
   npx cloudflared tunnel --url http://localhost:5173
   # або: ngrok http 5173
   ```
   Дає `https://...` адресу, яку можна відкрити з телефона. Мікрофон працює.

2. **Самопідписаний сертифікат** на dev-сервері — треба буде прийняти
   попередження в Safari.

3. **Chrome на Android**: `chrome://flags` →
   `Insecure origins treated as secure` → додати `http://192.168.1.x:5173`.
   У Safari такого прапорця немає.

Рекомендую перший — на ньому ж перевіриться і встановлення на головний
екран, і service worker, бо обидва вимагають HTTPS.

## Структура

```
index.html          точка входу
config.js           режим провайдерів (БЕЗ ключів)
sw.js               service worker
.env.example        змінні для майбутнього бекенда
src/
  styles.css        дизайн-токени, світла й темна теми
  lib/              dom, storage, analytics, audio, safety
  content/          уроки 1–5, звірені біблійні тексти, маршрут
  providers/        mock (працює) + http (написаний, не перевірений)
  app/              роутер, стан, спільні компоненти
  screens/          лендинг, онбординг, маршрут, урок, криза, налаштування
scripts/            serve, build, cdp, e2e, shots
tests/              47 модульних тестів
docs/               PROVIDERS, LICENCES, SAFETY
screenshots/        95 знімків (у git не входять)
```

## Git

Репозиторій уже ініціалізований, є перший коміт. Щоб запушити:

```bash
git remote add origin git@github.com:<ваш-акаунт>/<репо>.git
git branch -M main
git push -u origin main
```

`.gitignore` виключає `node_modules/`, `dist/`, `.env` і `screenshots/`
(95 PNG на 16 МБ — їм не місце в історії; вони є в архіві).

## Перед тим як міняти стек

Цільовий стек — React + Tailwind + Node на Hetzner. Що варто знати перед
міграцією:

- `src/content/*` і `src/lib/*` — чисті дані й чисті функції, переносяться
  без правок.
- `src/providers/*` — інтерфейси не змінюються, контракт у `docs/PROVIDERS.md`.
- `src/styles.css` — повна система токенів. Її правильно перенести в
  `tailwind.config` як `theme.extend`, а не перемальовувати класами.
- `src/screens/*` — єдине, що треба переписати: `h(...)` → JSX.
- `tests/` переносяться майже як є (чисті функції). `scripts/e2e.mjs` під
  React треба буде переписати на Playwright, але як **специфікація
  поведінки** він лишається корисним: 150 перевірок описують, що саме
  застосунок має робити.

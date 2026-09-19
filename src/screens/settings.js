import { h, addKids } from '../lib/dom.js';
import { topbar, actionbar, sheet, siteFoot, primaryBtn } from '../app/ui.js';
import { MODES } from './onboarding.js';
import { track, readLog } from '../lib/analytics.js';
import { storageAvailable } from '../lib/storage.js';

export function PrivacyScreen({ onBack, standalone, providerMode }) {
  const live = providerMode === 'http';
  return h('.screen',
    topbar({ onBack, title: 'Голос і дані' }),
    h('.flow.pad-bottom', h('.wrap',
      h('p.eyebrow', { style: { marginTop: '18px' } }, 'Ти керуєш своїми даними'),
      h('h1', { style: { fontSize: '1.9rem' } }, 'Приватний ', h('em', 'простір.')),
      h('.card',
        h('.kv', h('span', 'Що обробляється'), h('b', 'Аудіо відповіді')),
        h('.kv', h('span', 'Навіщо'), h('b', 'Текст + мовний розбір')),
        h('.kv', h('span', 'Чи зберігається аудіо'), h('b', 'Ні')),
        h('.kv', h('span', 'Куди йде запис'), h('b', live ? 'На наш сервер → OpenAI' : 'Нікуди, демо-режим')),
        h('.kv', h('span', 'Прогрес'), h('b', storageAvailable() ? 'localStorage на пристрої' : 'тільки в пам\'яті вкладки')),
      ),
      live ? h('div',
        h('h3', { style: { marginTop: '20px' } }, 'Хто ще бачить твою відповідь'),
        h('p.tiny', { style: { marginBottom: '10px' } },
          'Щоб розпізнати голос і розібрати речення, застосунок звертається до ',
          h('b', 'OpenAI'), ' — це стороння компанія. Запит іде через наш сервер, щоб ключі не лежали у твоєму браузері, але дані туди все одно потрапляють.'),
        h('ul.list.tiny',
          h('li', h('b', 'Аудіо'), ' надсилається на розпізнавання. Ми його не зберігаємо — воно живе в пам\u2019яті вкладки й зникає одразу після розшифрування.'),
          h('li', h('b', 'Текст твоєї відповіді'), ' надсилається на мовний розбір. Ми його не зберігаємо.'),
          h('li', 'Ім\u2019я, вибраний тон і збережені фрази не надсилаються нікуди.'),
          h('li', 'Якщо спрацює захист на слова про кризу — відповідь не піде нікуди взагалі.'),
        ),
      ) : null,

      h('h3', { style: { marginTop: '20px' } }, 'Що ми знаємо про користування'),
      h('p.tiny', { style: { marginBottom: '10px' } }, live
        ? 'Щоб бачити, де застосунок незручний, ми надсилаємо собі знеособлені події: «відкрив урок», «натиснув запис», «завершив день 3». Назва події, номер дня, час і випадковий номер пристрою — більше нічого.'
        : 'У демо-режимі події нікуди не надсилаються — вони лишаються тільки в цьому браузері.'),
      h('ul.list.tiny',
        h('li', h('b', 'Тексту відповіді в цих подіях немає.'), ' Це не обіцянка, а будова: дозволені поля перелічені списком, усе інше відкидається — і в браузері, і на сервері.'),
        h('li', 'Номер пристрою випадковий і ні з чим не пов\u2019язаний. «Видалити всі дані» стирає і його.'),
      ),

      h('h3', { style: { marginTop: '20px' } }, 'Що ми НЕ робимо'),
      h('ul.list.tiny',
        h('li', 'Не зберігаємо оригінальне аудіо після транскрипції.'),
        h('li', 'Не надсилаємо текст відповіді в аналітику: подія містить лише назву, день і тривалість.'),
        h('li', 'Не пишемо повний текст відповіді в технічні логи помилок.'),
        h('li', 'Не продаємо дані й не передаємо їх нікому, крім названого вище OpenAI, якому вони потрібні, щоб розбір узагалі працював.'),
      ),
      h('h3', { style: { marginTop: '20px' } }, 'Чого ми НЕ заявляємо'),
      h('.banner', h('span', '⚠'), h('span',
        'Ми не стверджуємо, що дані зашифровані. У цій версії шифрування не реалізоване й не перевірене. Прогрес лежить у localStorage браузера у відкритому вигляді — як і в більшості вебзастосунків на цьому етапі.')),
      standalone ? h('p.tiny', 'Ці налаштування стануть доступні після початку маршруту.') : null,
    )),
  );
}

export function SettingsScreen({ state, onBack, onChangeMode, onDeleteRecording, onWipe, onRestart, hasRecording, providerMode, unlockAll, onToggleUnlock }) {
  let dialog = null;
  const root = h('.screen');

  const openSheet = (node) => { dialog = node; root.appendChild(node); };
  const closeSheet = () => { if (dialog) { dialog.remove(); dialog = null; } };

  const confirmWipe = () => openSheet(sheet({
    title: 'Видалити всі дані?',
    body: h('div',
      h('p', 'Буде видалено: онбординг, вибраний режим, прогрес маршруту, збережені фрази, журнал подій і будь-які метадані записів.'),
      h('p.tiny', { style: { marginBottom: 0 } }, 'Це незворотно. Застосунок повернеться до стартового екрана.'),
    ),
    onClose: closeSheet,
    actions: [
      h('button.btn.btn--danger', { type: 'button', onclick: () => { closeSheet(); onWipe(); } }, 'Так, видалити все'),
      h('button.btn.btn--quiet', { type: 'button', onclick: closeSheet }, 'Скасувати'),
    ],
  }));

  const evCount = readLog().length;

  addKids(root,
    topbar({ onBack, title: 'Налаштування' }),
    h('.flow.pad-bottom', h('.wrap',
      h('h3', { style: { marginTop: '16px' } }, 'Режим'),
      ...MODES.map(m => h('button.choice', {
        type: 'button', 'aria-pressed': state.mode === m.v ? 'true' : 'false',
        onclick: () => onChangeMode(m.v),
      }, h('.choice__dot'), h('.choice__body', h('b', m.label), h('span', m.hint)))),

      h('h3', { style: { marginTop: '22px' } }, 'Приватність'),
      h('.card',
        h('.kv', h('span', 'Зберігати аудіо після розбору'), h('b', 'Ні')),
        h('.kv', h('span', 'Режим провайдерів'), h('b', providerMode === 'mock' ? 'демо (без ключів)' : 'сервер')),
        h('.kv', h('span', 'Подій у журналі'), h('b', String(evCount) + (providerMode === 'http' ? ' · надсилаються' : ' · лише локально'))),
        h('.kv', h('span', 'Сховище браузера'), h('b', storageAvailable() ? 'доступне' : 'недоступне')),
      ),
      h('button.btn.btn--ghost.btn--center', { type: 'button', onclick: () => location.hash = '#/privacy' }, 'Повний текст про голос і дані'),

      h('hr.hr'),

      h('h3', 'Для показу'),
      h('button.choice', {
        type: 'button', 'aria-pressed': unlockAll ? 'true' : 'false', onclick: onToggleUnlock,
      }, h('.choice__dot'), h('.choice__body',
        h('b', 'Відкрити всі готові дні'),
        h('span', 'Зазвичай день відкривається після попереднього. Увімкни, щоб показати комусь будь-який із трьох днів одразу.'))),

      h('hr.hr'),

      h('h3', 'Застосунок на телефоні'),
      installBlock(),

      h('hr.hr'),

      h('h3', 'Мої дані'),
      hasRecording
        ? h('button.btn.btn--danger', { type: 'button', style: { marginBottom: '10px' }, onclick: onDeleteRecording }, 'Видалити поточний запис')
        : h('p.tiny', 'Зараз немає збереженого запису — аудіо видаляється одразу після розбору.'),
      h('button.btn.btn--ghost.btn--center', { type: 'button', style: { marginBottom: '10px' }, onclick: onRestart }, 'Почати демонстрацію спочатку'),
      h('button.btn.btn--danger', { type: 'button', onclick: confirmWipe }, 'Видалити всі мої дані'),
      h('p.caption', { style: { marginTop: '12px' } },
        '«Почати спочатку» скидає прогрес, але лишає вибраний режим. «Видалити всі дані» стирає геть усе, включно з журналом подій.'),
      siteFoot(),
    )),
  );
  return root;
}

function installBlock() {
  const help = h('div', { hidden: true },
    h('p.tiny', { style: { marginTop: '10px' } },
      h('b', 'iPhone: '), 'відкрий у Safari → «Поділитися» → «На екран Home» → «Додати».'),
    h('p.tiny', h('b', 'Android: '), 'меню Chrome → «Додати на головний екран».'),
    h('p.caption', { style: { marginBottom: 0 } },
      'Потрібне HTTPS-з\'єднання. У вбудованому прев\'ю встановлення недоступне.'),
  );
  const btn = h('button.btn.btn--ghost.btn--center', {
    type: 'button',
    onclick: () => {
      const native = window.__SIA_INSTALL__ && window.__SIA_INSTALL__();
      if (!native) help.hidden = false;
    },
  }, 'Додати на головний екран');
  return h('div', btn, help);
}

export function ProgressScreen({ state, onBack }) {
  const done = state.completedDays || [];
  const lesson = (state.lessons && state.lessons['3']) || {};
  const phrases = state.savedPhrases || [];
  return h('.screen',
    topbar({ onBack, title: 'Мій прогрес' }),
    h('.flow.pad-bottom', h('.wrap',
      h('p.eyebrow', { style: { marginTop: '18px' } }, 'Тихо, без балів'),
      h('h1', { style: { fontSize: '1.9rem' } }, 'Мій ', h('em', 'прогрес.')),
      h('.metric-row',
        h('.metric', h('b', String(done.length)), h('span', 'із семи днів пройдено')),
        h('.metric',
          h('b', lesson.speechMs ? Math.round(lesson.speechMs / 1000) : '—'),
          h('span', lesson.speechMs ? 'секунд мовлення, день 3' : 'день 3 — без заміру')),
      ),
      h('p.caption', { style: { marginTop: '-4px' } },
        'Прогрес мовлення порівнюватиметься між днем 3 і днем 7 — це дві однакові відкриті відповіді. Повторення за диктором з дня 1 у це порівняння не входить.'),

      h('p.eyebrow', { style: { marginTop: '22px' } }, 'Збережені фрази'),
      phrases.length
        ? h('div', ...phrases.map(p => h('.layer.layer--you', { style: { marginBottom: '10px' } },
            h('p', { style: { marginBottom: '4px', fontFamily: 'var(--font-serif)', fontSize: '1.08rem' } }, p.text),
            h('.tiny', { style: { opacity: .8 } }, `день ${p.day}`))))
        : h('p.muted', 'Поки що порожньо. Фраза зберігається в кінці уроку.'),

      h('p.eyebrow', { style: { marginTop: '22px' } }, 'Що далі'),
      h('p.tiny', 'Усі сім днів маршруту написані й проходяться до кінця. Чого ще немає — справжнього AI: розпізнавання голосу показує заздалегідь написаний текст, а мовний розбір працює на списку простих правил і ловить не кожну помилку.'),
    )),
  );
}

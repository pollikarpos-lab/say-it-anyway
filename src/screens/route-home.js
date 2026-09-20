import { h, icon } from '../lib/dom.js';
import { getRoute, ROUTES } from '../content/routes.js';
import { isDayUnlocked, builtDays, routeComplete } from '../content/lessons.js';
import { siteFoot } from '../app/ui.js';

export function RouteScreen({ state, onOpenDay, onSettings, onProgress, onSwitchRoute }) {
  const routeId = state.activeRoute || 'fear-7';
  const ROUTE = getRoute(routeId);
  const BUILT = builtDays(routeId);
  // Скільки днів пройдено в КОЖНОМУ маршруті — щоб не пропонувати
  // почати те, що вже почате, і показати, що чекає.
  const doneIn = (id) => ((state.byRoute || {})[id] || (id === routeId ? state : {})).completedDays || [];
  const done = new Set(state.completedDays || []);
  const greet = state.name ? `Вітаю, ${state.name}` : 'Вітаю';
  const finished = routeComplete(state.completedDays || [], routeId);
  const totalMs = Object.values(state.lessons || {}).reduce((a, l) => a + (l.speechMs || 0), 0);

  return h('.screen',
    h('header.topbar',
      h('.topbar__spacer'),
      h('.topbar__title', ROUTE.title),
      h('button.iconbtn', { type: 'button', onclick: onSettings, 'aria-label': 'Налаштування' }, icon('gear')),
    ),
    h('.flow.pad-bottom', h('.wrap',
      h('p.eyebrow', { style: { marginTop: '22px' } }, greet),
      finished
        ? h('h1', { style: { fontSize: '1.95rem' } }, 'Маршрут ', h('em', 'пройдено.'))
        : h('h1', { style: { fontSize: '1.95rem' } }, 'Твій маршрут ', h('em', 'на 7 днів.')),
      h('p.muted', { style: { marginBottom: finished ? '18px' : '24px' } },
        finished
          ? 'Сім днів, сім розмов уголос. Будь-який день можна пройти ще раз — відповідь буде інша.'
          : ROUTE.promise),

      finished ? h('.trophy', { style: { marginBottom: '22px' } },
        h('.trophy__eyebrow', 'Сім днів'),
        h('p.trophy__text', { style: { fontSize: '1.2rem' } },
          totalMs
            ? `Разом ти говорив англійською ${Math.round(totalMs / 60000)} хв ${Math.round((totalMs % 60000) / 1000)} с.`
            : 'Ти пройшов усі сім днів.'),
        h('p.trophy__foot', 'Тиждень тому цих розмов не було.'),
      ) : null,

      // Фінал маршруту — це двері, а не глухий кут. Інші теми показуємо
      // тільки тому, хто дійшов до кінця: інакше людина розпорошиться
      // між п'ятьма початками й не закінчить жодного.
      // Коли всі інші теми теж пройдені, заголовок «Інша тема» обіцяв би
      // нове там, де нового немає. Тоді це просто перехід назад.
      finished && ROUTES.length > 1 ? h('div', { style: { marginBottom: '24px' } },
        h('p.eyebrow', ROUTES.filter(r => r.id !== routeId).every(r => doneIn(r.id).length > 0)
          ? 'Пройдені теми' : 'Інша тема'),
        ...ROUTES.filter(r => r.id !== routeId).map(r => {
          const n = doneIn(r.id).length;
          return h('button.choice', {
            type: 'button',
            onclick: () => onSwitchRoute && onSwitchRoute(r.id),
          }, h('.choice__dot'), h('.choice__body',
            h('b', r.title),
            h('span', n ? `Пройдено днів: ${n}` : r.blurb || r.promise),
          ));
        }),
      ) : null,

      h('.route', ...ROUTE.days.map(d => {
        const isDone = done.has(d.day);
        const built = BUILT.includes(d.day);
        const isReady = built && isDayUnlocked(d.day, state.completedDays || [], state.unlockAll, routeId);
        const cls = isDone ? 'is-done' : isReady ? 'is-active' : 'is-locked';
        return h(`button.day.${cls}`, {
          type: 'button',
          disabled: !isReady,
          onclick: isReady ? () => onOpenDay(d.day) : undefined,
          'aria-label': `День ${d.day}: ${d.title}${isReady || isDone ? '' : built ? ' — відкриється далі' : ' — готується'}`,
        },
          h('.day__rail',
            h('.day__node', isDone ? icon('check', 18) : isReady ? String(d.day) : icon('lock', 15)),
            h('.day__line'),
          ),
          h('.day__card',
            h('.day__title', `День ${d.day}. ${d.title}`),
            // Для ще не написаних днів посилання немає, і голий прочерк у рядку
            // виглядає як забуте поле. Показуємо тільки те, що справді є.
            h('.day__meta', d.ref && d.ref !== '—' ? [d.ref, ' · ', d.subtitle] : d.subtitle),
            isReady || isDone
              ? h('.tiny', { style: { marginTop: '8px' } }, d.blurb)
              : built
                ? h('.tiny', { style: { marginTop: '8px' } }, `Відкриється, коли пройдеш день ${d.day - 1}.`)
                : h('.tiny', { style: { marginTop: '8px' } }, 'Ще готується — контент цього дня не написаний.'),
            isDone ? h('span.pill.pill--ok', { style: { marginTop: '10px' } }, 'Пройдено')
                   : isReady ? h('span.pill', { style: { marginTop: '10px' } }, 'Доступний зараз') : null,
          ),
        );
      })),

      h('.card', { style: { marginTop: '10px' } },
        h('p.eyebrow', 'Як побудований маршрут'),
        h('p.tiny', { style: { marginBottom: 0 } },
          'День 1 — тільки повторення за диктором: перше натискання мікрофона там, де помилитися неможливо. День 2 — власне речення з готової рамки. Дні 3–6 — відкриті відповіді: теперішнє, минуле, майбутнє, розмова з людиною. День 7 — монолог на півтори хвилини й порівняння з днем 3. Порівнюємо саме ці два дні: обидва — однакові відкриті відповіді.'),
      ),

      h('button.btn.btn--ghost.btn--center', { type: 'button', onclick: onProgress, style: { marginTop: '4px' } }, 'Мій прогрес'),
      siteFoot(),
    )),
  );
}

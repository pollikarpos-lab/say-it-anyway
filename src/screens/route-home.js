import { h, icon } from '../lib/dom.js';
import { ROUTE } from '../content/route.js';
import { isDayUnlocked, BUILT_DAYS } from '../content/lessons.js';
import { siteFoot } from '../app/ui.js';

export function RouteScreen({ state, onOpenDay, onSettings, onProgress }) {
  const done = new Set(state.completedDays || []);
  const greet = state.name ? `Вітаю, ${state.name}` : 'Вітаю';

  return h('.screen',
    h('header.topbar',
      h('.topbar__spacer'),
      h('.topbar__title', ROUTE.title),
      h('button.iconbtn', { type: 'button', onclick: onSettings, 'aria-label': 'Налаштування' }, icon('gear')),
    ),
    h('.flow.pad-bottom', h('.wrap',
      h('p.eyebrow', { style: { marginTop: '22px' } }, greet),
      h('h1', { style: { fontSize: '1.95rem' } }, 'Твій маршрут ', h('em', 'на 7 днів.')),
      h('p.muted', { style: { marginBottom: '24px' } }, ROUTE.promise),

      h('.route', ...ROUTE.days.map(d => {
        const isDone = done.has(d.day);
        const built = BUILT_DAYS.includes(d.day);
        const isReady = built && isDayUnlocked(d.day, state.completedDays || [], state.unlockAll);
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
            h('.day__meta', d.ref, ' · ', d.subtitle),
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
        h('p.eyebrow', 'Як побудовані перші три дні'),
        h('p.tiny', { style: { marginBottom: 0 } },
          'День 1 — тільки повторення за диктором: перше натискання мікрофона там, де помилитися неможливо. День 2 — власне речення, але зібране з готової рамки. День 3 — перше відкрите запитання своїми словами, і саме від нього рахується прогрес мовлення. Дні 4–7 ще готуються.'),
      ),

      h('button.btn.btn--ghost.btn--center', { type: 'button', onclick: onProgress, style: { marginTop: '4px' } }, 'Мій прогрес'),
      siteFoot(),
    )),
  );
}

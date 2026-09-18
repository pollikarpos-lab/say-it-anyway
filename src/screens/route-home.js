import { h, icon } from '../lib/dom.js';
import { ROUTE } from '../content/route.js';
import { isDayUnlocked, BUILT_DAYS, routeComplete } from '../content/lessons.js';
import { siteFoot } from '../app/ui.js';

export function RouteScreen({ state, onOpenDay, onSettings, onProgress }) {
  const done = new Set(state.completedDays || []);
  const greet = state.name ? `Вітаю, ${state.name}` : 'Вітаю';
  const finished = routeComplete(state.completedDays || []);
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
        h('p.eyebrow', 'Як побудований маршрут'),
        h('p.tiny', { style: { marginBottom: 0 } },
          'День 1 — тільки повторення за диктором: перше натискання мікрофона там, де помилитися неможливо. День 2 — власне речення з готової рамки. Дні 3–6 — відкриті відповіді: теперішнє, минуле, майбутнє, розмова з людиною. День 7 — монолог на півтори хвилини й порівняння з днем 3. Порівнюємо саме ці два дні: обидва — однакові відкриті відповіді.'),
      ),

      h('button.btn.btn--ghost.btn--center', { type: 'button', onclick: onProgress, style: { marginTop: '4px' } }, 'Мій прогрес'),
      siteFoot(),
    )),
  );
}

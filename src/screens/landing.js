import { h } from '../lib/dom.js';
import { actionbar, primaryBtn, thoughtPair, siteFoot } from '../app/ui.js';
import { ROUTE } from '../content/route.js';
import { track } from '../lib/analytics.js';

/**
 * Герой показує механіку продукту ДО того, як її пояснюють словами:
 * дві картки — та сама думка до й після. Це вся ідея в одному погляді.
 */
function heroArt() {
  return h('.hero-art',
    h('.orbit.orbit-1'), h('.orbit.orbit-2'),
    h('.art-note', 'Тут можна почати з одного речення'),
    thoughtPair({
      original: 'I worried about my future.',
      improved: "I'm worried about my future.",
      note: 'Та сама думка. Більше впевненості.',
      wave: true,
    }),
    h('.art-bottom', "You don't have to say it perfectly"),
  );
}

const HOW = [
  ['01', 'Зупинися на хвилину',
   'Питання про твоє життя і короткий біблійний уривок. Можна вірити, сумніватися або просто досліджувати.'],
  ['02', 'Скажи, як можеш',
   'До хвилини англійською, своїми словами. Без балів, без шкільного тесту, без оцінки людини.'],
  ['03', 'Почуй себе по-новому',
   'Максимум три підказки з поясненням українською — і твоя ж думка, сказана природніше.'],
];

export function LandingScreen({ onStart, onPrivacy, providerMode }) {
  track('landing_viewed');
  const embedded = !!(window.__SIA_CONFIG__ && window.__SIA_CONFIG__.embedded);

  return h('.screen',
    h('.flow.pad-bottom', h('.wrap',

      h('.hero',
        h('p.eyebrow.reveal', 'Англійська для того, що важливо'),
        h('h1.reveal', { 'data-d': '1' },
          'Твоя думка.', h('br'),
          'Твій голос.', h('br'),
          h('em', 'Навіть неідеально.'),
        ),
        h('p.lead.reveal', { 'data-d': '2' },
          'Скажи англійською те, що досі казав тільки українською.'),
        h('p.hero__sub.reveal', { 'data-d': '2' },
          'Особисте запитання. Короткий біблійний уривок. Твоя відповідь — і трохи допомоги, щоб вона зазвучала природніше.'),
        h('.reveal', { 'data-d': '3' }, heroArt()),
      ),

      h('.reveal', { 'data-d': '3' },
        h('p.eyebrow', { style: { marginTop: '28px' } }, 'Одна думка за раз'),
        h('h2', 'Не вивчити відповідь. ', h('em', 'Сказати свою.')),
        h('div', { style: { marginTop: '20px' } },
          ...HOW.map(([n, t, d]) => h('.how',
            h('.how__n', n),
            h('div', h('h3', t), h('p', d)),
          )),
        ),
      ),

      h('.card.reveal', { 'data-d': '4' },
        h('p.eyebrow', 'Маршрут'),
        h('h3', { style: { fontSize: '1.05rem', marginBottom: '8px' } }, 'Сім днів. Одна тема — страх.'),
        h('p.tiny', { style: { marginBottom: '14px' } }, ROUTE.promise),
        h('div', { style: { display: 'flex', flexWrap: 'wrap', gap: '6px' } },
          ...ROUTE.days.map(d => h('span.pill', {
            style: d.status === 'ready' ? {} : { background: 'var(--surface-2)', color: 'var(--muted)' },
          }, `${d.day}. ${d.title}`)),
        ),
      ),

      h('.banner.reveal', { 'data-d': '5' },
        h('span', { style: { fontSize: '15px', lineHeight: 1.3 } }, 'ⓘ'),
        h('span',
          h('b', 'Це перша тестова версія. '),
          'Повністю працює один урок — день 3. ',
          providerMode === 'mock'
            ? 'Розпізнавання голосу ще не підключене: там, де це має значення, застосунок сам скаже про це прямо.'
            : 'Решта днів готуються.',
        ),
      ),

      embedded ? h('p.caption', { style: { marginTop: '-4px' } },
        'Вбудоване прев\'ю: встановлення на головний екран і офлайн тут не працюють, а мікрофон може бути заблокований самим вікном. У кожному уроці є кнопка «Пройти текстом».') : null,

      h('p.caption.center', { style: { marginTop: '18px' } },
        'Застосунок не говорить від імені Бога і не замінює молитву, Біблію, церкву, наставника, психолога чи лікаря.'),

      siteFoot(),
    )),

    actionbar(
      primaryBtn('Спробувати безкоштовно', onStart),
      h('p.caption.center', { style: { margin: '6px 0 0' } },
        'Без реєстрації · У своєму темпі · 8–10 хвилин'),
      h('button.btn.btn--quiet', { type: 'button', onclick: onPrivacy }, 'Що буде з моїм голосом і даними'),
    ),
  );
}

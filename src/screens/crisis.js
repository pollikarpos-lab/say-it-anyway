import { h } from '../lib/dom.js';
import { topbar, actionbar } from '../app/ui.js';
import { CRISIS_RESOURCES } from '../lib/safety.js';
import { track } from '../lib/analytics.js';

/**
 * Повністю статичний екран. Жодного тексту від AI: коли спрацював
 * кризовий сценарій, мовний розбір не запускається взагалі.
 */
export function CrisisScreen({ onBack, onExit, region }) {
  track('crisis_screen_shown');
  const list = CRISIS_RESOURCES.slice().sort((a, b) => {
    const rank = (r) => {
      if (region === 'us' && /США/.test(r.region)) return 0;
      if (region === 'ca' && /Канада/.test(r.region)) return 0;
      if (region === 'ua' && /Україна/.test(r.region)) return 0;
      if (region === 'eu' && /Європа/.test(r.region)) return 0;
      return 1;
    };
    return rank(a) - rank(b);
  });

  return h('.screen',
    topbar({ onBack, title: 'Пауза' }),
    h('.flow.pad-bottom', h('.wrap',
      h('p.eyebrow', { style: { marginTop: '18px' } }, 'Підготовлена картка підтримки · не AI'),
      h('.crisis',
        h('h2', 'Зупинімося ', h('em', 'на хвилину.')),
        h('p', 'У твоїй відповіді прозвучало те, з чим не варто залишатися наодинці — і точно не варто розбирати як мовну вправу.'),
        h('p', { style: { marginBottom: 0 } },
          h('b', 'Цей застосунок — не служба допомоги і не фахівець. '),
          'Він не дає порад у таких ситуаціях і нічого тут не аналізує. Будь ласка, зв\'яжися з живою людиною.'),
      ),

      h('h3', { style: { marginTop: '22px' } }, 'Куди можна звернутися'),
      ...list.map(r => h('.card', { style: { marginBottom: '10px' } },
        h('.tiny', { style: { marginBottom: '4px' } }, r.region),
        h('h3', { style: { marginBottom: '4px' } }, r.name),
        r.tel
          ? h('a.btn.btn--primary.btn--center', { href: 'tel:' + r.tel, style: { marginBottom: '8px', textDecoration: 'none' } }, r.contact)
          : h('p', { style: { marginBottom: '4px', fontSize: '1.05rem', fontWeight: 600 } }, r.contact),
        h('p.tiny', { style: { marginBottom: 0 } }, r.note),
      )),

      h('.card', { style: { borderColor: 'var(--danger)' } },
        h('p', { style: { marginBottom: 0, fontWeight: 600, color: 'var(--danger)' } },
          'Якщо небезпека прямо зараз — 911 (США, Канада) або 112 (Європа, Україна).')),

      h('p.tiny', 'Урок нікуди не подінеться. Він буде тут, коли ти захочеш повернутися.'),
    )),
    actionbar(
      h('button.btn.btn--ghost', { type: 'button', onclick: onExit }, 'На головну'),
    ),
  );
}

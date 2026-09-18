import { h, icon, addKids } from '../lib/dom.js';

export function topbar({ onBack, title, right } = {}) {
  return h('header.topbar',
    onBack ? h('button.iconbtn', { onclick: onBack, 'aria-label': 'Назад', type: 'button' }, icon('back'))
           : h('.topbar__spacer'),
    h('.topbar__title', title || ''),
    right || h('.topbar__spacer'),
  );
}

export function steps(total, current) {
  return h('.steps', { 'aria-label': `Крок ${current + 1} з ${total}` },
    Array.from({ length: total }, (_, i) =>
      h('.steps__seg' + (i < current ? '.is-done' : i === current ? '.is-now' : ''))),
  );
}

export function actionbar(...kids) {
  return h('footer.actionbar', h('.wrap', ...kids));
}

/** Головна кнопка зі стрілкою праворуч. */
export function primaryBtn(label, onclick, { arrow = '↗', disabled = false, center = false } = {}) {
  return h('button.btn.btn--primary' + (center ? '.btn--center' : ''), { type: 'button', onclick, disabled },
    h('span', label), arrow ? h('span.btn__arrow', arrow) : null);
}

/* ============================================================
   Парні картки: «твоя думка» → «трохи природніше».
   Це візуальний підпис продукту — та сама думка, більше впевненості.
   ============================================================ */

export function thoughtPair({ original, improved, note, originalLabel, improvedLabel, wave = false }) {
  return h('.pair',
    h('.thought.thought--original',
      h('small', originalLabel || 'Твоя думка'),
      h('p.thought__text', original),
      wave ? miniWave() : null,
    ),
    h('.pair__link', { 'aria-hidden': 'true' }, h('span', '↓')),
    h('.thought.thought--improved',
      h('small', improvedLabel || 'Трохи природніше'),
      h('p.thought__text', improved),
      note ? h('.thought__note', note) : null,
    ),
  );
}

export function miniWave(n = 16) {
  const hs = [5, 9, 6, 13, 8, 15, 7, 11, 5, 12, 8, 14, 6, 10, 5, 8];
  return h('.mini-wave', ...Array.from({ length: n }, (_, i) =>
    h('i', { style: { height: (hs[i % hs.length]) + 'px' } })));
}

/* ---------- контентні шари ---------- */

export function scriptureLayer({ title, verses, refUk, translation, status, verifiedAgainst }) {
  if (status !== 'verified') {
    return h('.layer.layer--scripture',
      h('.layer__tag', '📖 ' + (title || 'Писання')),
      h('div', { style: { border: '1px dashed currentColor', borderRadius: '12px', padding: '16px' } },
        h('b', 'Текст ще не підтверджено'),
        h('p.tiny', { style: { marginTop: '6px', marginBottom: 0, color: 'inherit', opacity: .85 } },
          'Тут буде ', refUk, '. Текст навмисно не показано: він не звірений із канонічним виданням. Застосунок не генерує й не вигадує біблійних цитат.'),
      ),
    );
  }
  return h('.layer.layer--scripture',
    h('.layer__tag', '📖 ' + (title || 'Писання')),
    ...verses.map(v => h('p.scripture-text',
      h('sup', { style: { opacity: .45, fontSize: '.6em', marginRight: '4px' } }, v.n), v.text)),
    h('.ref',
      h('b', refUk),
      h('span', '· ' + translation.title),
      h('span', { style: { width: '100%', opacity: .8 } }, translation.licence),
      verifiedAgainst && verifiedAgainst.length
        ? h('span', { style: { width: '100%', opacity: .72 } },
            'Звірено: ' + verifiedAgainst.map(s => `${s.source} (${s.date})`).join(' · '))
        : null,
    ),
  );
}

export function humanLayer(ctx) {
  return h('.layer.layer--human',
    h('.layer__tag', '✎ Контекст — написала людина'),
    h('p', { style: { marginBottom: '10px' } }, ctx.body),
    ctx.caution ? h('p', { style: { marginBottom: 0, fontSize: '.88rem', opacity: .9 } },
      h('b', 'Важливо: '), ctx.caution) : null,
  );
}

export function youLayer(tagText, ...kids) {
  return h('.layer.layer--you', h('.layer__tag', '🗣 ' + tagText), ...kids);
}

export function naturalLayer(tagText, ...kids) {
  return h('.layer.layer--natural', h('.layer__tag', '🤖 ' + tagText), ...kids);
}

export function analysisLayer(tagText, ...kids) {
  return h('.card.card--lift',
    h('.layer__tag', { style: { color: 'var(--sage)' } }, '🤖 ' + tagText), ...kids);
}

/* ---------- плеєри ---------- */

function eqGlyph() { return h('.eq', h('i'), h('i'), h('i'), h('i')); }

/**
 * Кнопка відтворення з трьома чесними станами: спокій → готується → грає.
 * TTS браузера стартує не миттєво, тому стан «готується» реальний, не декоративний.
 */
export function ttsPlayer(tts, text, { title, sub, dark = false, compact = false } = {}) {
  const avail = tts.available();
  let state = 'idle'; // idle | loading | playing
  const bar = h('i');
  const btn = h('button.player__btn', { type: 'button', 'aria-label': 'Слухати' });
  const row = h('.player' + (dark ? '.player--on-dark' : ''));
  const meta = h('.tiny', { style: { marginTop: '1px' } });

  const paint = () => {
    btn.replaceChildren(
      state === 'playing' ? eqGlyph()
        : state === 'loading' ? h('span', { style: { fontSize: '13px' } }, '···')
        : icon('play', 18));
    btn.setAttribute('aria-label', state === 'playing' ? 'Зупинити' : 'Слухати');
    row.classList.toggle('is-playing', state === 'playing');
    bar.style.transition = state === 'playing' ? 'width 7s linear' : 'width .2s';
    bar.style.width = state === 'playing' ? '100%' : '0';
    meta.textContent = !avail ? 'Озвучення недоступне в цьому браузері'
      : state === 'playing' ? 'Грає…'
      : state === 'loading' ? 'Готую голос…'
      : (sub || tts.label);
  };

  btn.addEventListener('click', () => {
    if (!avail) return;
    if (state !== 'idle') { tts.stop(); state = 'idle'; paint(); return; }
    state = 'loading'; paint();
    const started = tts.speak(text, { onend: () => { state = 'idle'; paint(); } });
    setTimeout(() => { if (state === 'loading') { state = started ? 'playing' : 'idle'; paint(); } }, 260);
  });

  btn.disabled = !avail;
  addKids(row, btn, h('.player__meta',
    h('b', title || 'Слухати англійською'), meta,
    compact ? null : h('.player__bar', bar)));
  paint();
  return row;
}

/** Плеєр для Blob (власний запис користувача). */
export function blobPlayer(blob, { title, durationMs, onDelete } = {}) {
  const url = URL.createObjectURL(blob);
  const audio = new Audio(url);
  const bar = h('i');
  const row = h('.player');
  const btn = h('button.player__btn', {
    type: 'button', 'aria-label': 'Прослухати свій запис',
    onclick: () => { audio.paused ? audio.play() : audio.pause(); },
  }, icon('play', 18));
  const paint = (playing) => {
    btn.replaceChildren(playing ? eqGlyph() : icon('play', 18));
    row.classList.toggle('is-playing', playing);
  };
  audio.onplay = () => paint(true);
  audio.onpause = () => paint(false);
  audio.onended = () => { paint(false); bar.style.width = '0'; };
  audio.ontimeupdate = () => {
    const d = audio.duration && isFinite(audio.duration) ? audio.duration : (durationMs || 0) / 1000;
    if (d) bar.style.width = Math.min(100, (audio.currentTime / d) * 100) + '%';
  };
  addKids(row, btn,
    h('.player__meta',
      h('b', title || 'Твій запис'),
      h('.tiny', { style: { marginTop: '1px' } }, durationMs ? `${Math.round(durationMs / 1000)} секунд` : 'аудіо'),
      h('.player__bar', bar)),
    onDelete ? h('button.iconbtn', {
      type: 'button', 'aria-label': 'Видалити запис', style: { color: 'var(--danger)' },
      onclick: () => { try { audio.pause(); URL.revokeObjectURL(url); } catch {} onDelete(); },
    }, icon('trash', 18)) : null,
  );
  return row;
}

export function sheet({ title, body, actions, onClose }) {
  const back = h('.sheet-back', {
    onclick: (e) => { if (e.target === back) onClose && onClose(); },
    role: 'dialog', 'aria-modal': 'true',
  }, h('.sheet',
    title ? h('h2', title) : null,
    body,
    h('div', { style: { marginTop: '18px' } }, ...(actions || [])),
  ));
  return back;
}

export function mockBadge(text) {
  return h('.banner',
    h('span', { style: { fontSize: '15px', lineHeight: 1.3 } }, '⚙'),
    h('span', h('b', 'Демо-режим. '), text),
  );
}

export function siteFoot() {
  return h('.site-foot',
    h('span', 'Маленький крок. Своїм голосом.'),
    h('span', 'Say It Anyway · v0.5'),
  );
}

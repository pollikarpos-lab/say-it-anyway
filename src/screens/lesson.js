import { h, icon } from '../lib/dom.js';
import {
  topbar, steps, actionbar, primaryBtn, thoughtPair,
  scriptureLayer, humanLayer, youLayer, analysisLayer,
  ttsPlayer, blobPlayer, mockBadge,
} from '../app/ui.js';
import { getPassage, TRANSLATIONS } from '../content/scripture.js';
import { KIND_LABEL } from '../providers/types.js';
import { createRecorder, classifyMicError, MIC_ERRORS, micSupported, fmtTime, MAX_RECORDING_MS } from '../lib/audio.js';
import { detectCrisis, filterAiOutput } from '../lib/safety.js';
import { track } from '../lib/analytics.js';

export function stepsOf(lesson) { return lesson.steps; }
const barStepsOf = (lesson) => lesson.steps.filter(s => s !== 'processing');

export function LessonScreen(ctx) {
  const { ls, mode, lesson: L } = ctx;
  const SEQ = L.steps;
  const step = SEQ[ls.step];
  const passage = getPassage(L.passageId);
  const BAR = barStepsOf(L);
  const barIndex = Math.max(0, BAR.indexOf(step));

  const frame = (...kids) => h('.screen',
    topbar({
      onBack: ls.step > 0 && step !== 'processing' ? () => ctx.goStep(ls.step - 1) : ctx.onExit,
      title: `День ${L.day} · ${L.title}`,
      right: h('button.iconbtn', { type: 'button', onclick: ctx.onExit, 'aria-label': 'Вийти з уроку' }, '✕'),
    }),
    step === 'processing' ? null : steps(BAR.length, barIndex),
    ...kids,
  );

  const next = () => ctx.goStep(ls.step + 1);
  const page = (content, bar) => frame(h('.flow.pad-bottom', h('.wrap', ...content)), bar);

  switch (step) {

    case 'intro':
      return page([
        h('p.eyebrow', { style: { marginTop: '18px' } }, 'Сьогодні'),
        h('h1', { style: { fontSize: '2rem' } }, L.title),
        h('p.lead', L.intro[mode] || L.intro.open),
        h('.card', { style: { marginTop: '20px' } },
          h('p.eyebrow', 'Що буде далі'),
          ...planOf(L).map(t => h('.used',
            h('.used__mark', { style: { color: 'var(--sage)' } }, '·'),
            h('span', { style: { fontWeight: 400, fontSize: '.92rem' } }, t))),
        ),
        recallCard(ctx),
        h('p.caption',
          L.kind === 'shadowing' ? 'Приблизно 6 хвилин. Можна зупинитися будь-коли — прогрес збережеться.'
          : L.kind === 'monologue' ? 'Приблизно 12 хвилин — сьогодні відповідь довша. Можна зупинитися будь-коли.'
          : 'Приблизно 9 хвилин. Можна зупинитися будь-коли — прогрес збережеться.'),
      ], actionbar(primaryBtn('Почати', next, { arrow: '→' })));

    case 'question':
      return page([
        h('.card.card--lift', { style: { marginTop: '26px', padding: '28px 22px' } },
          h('p.eyebrow', 'Запитання дня'),
          h('h2', { style: { fontSize: '1.68rem', marginBottom: '14px' } }, L.lifeQuestion),
          h('p.muted', { style: { marginBottom: 0 } }, L.lifeQuestionNote),
        ),
        h('p.caption.center', { style: { marginTop: '20px' } },
          L.kind === 'shadowing'
            ? 'Сьогодні відповідати не треба. Просто тримай це десь поруч.'
            : 'Поки що нічого не треба казати. Потримай це в голові — повернемося за кілька хвилин.'),
      ], actionbar(primaryBtn('Далі', next, { arrow: '→' })));

    case 'scripture-uk':
      return page([
        h('p.eyebrow', { style: { marginTop: '18px' } }, 'Уривок'),
        scriptureLayer({
          title: 'Українською',
          verses: passage.uk.verses, refUk: passage.refUk,
          translation: TRANSLATIONS[passage.uk.translation],
          status: passage.uk.status, verifiedAgainst: passage.uk.verifiedAgainst,
        }),
        h('p.caption', passage.uk.verifiedNote || ''),
      ], actionbar(primaryBtn('Тепер англійською', next, { arrow: '→' })));

    case 'scripture-en':
      return page([
        h('p.eyebrow', { style: { marginTop: '18px' } }, 'Той самий уривок'),
        scriptureLayer({
          title: 'English',
          verses: passage.en.verses, refUk: passage.refEn,
          translation: TRANSLATIONS[passage.en.translation],
          status: passage.en.status, verifiedAgainst: passage.en.verifiedAgainst,
        }),
        ttsPlayer(ctx.tts, passage.en.verses.map(v => v.text).join(' '), {
          title: 'Слухати англійською', sub: 'Повільніше за звичайну мову',
        }),
        h('p.caption', 'Синхронного підсвічування слів у цій версії ще немає.'),
      ], actionbar(primaryBtn('Далі', next, { arrow: '→' })));

    case 'context':
      return page([
        h('p.eyebrow', { style: { marginTop: '18px' } }, 'Звідки це'),
        humanLayer(passage.context),
        h('p.caption', 'Цей коментар написала людина-редактор. Це не Писання і не текст, згенерований помічником.'),
      ], actionbar(primaryBtn('Далі', next, { arrow: '→' })));

    case 'phrases':
      return page([
        h('p.eyebrow', { style: { marginTop: '18px' } }, 'Три живі конструкції'),
        h('h2', 'Так кажуть ', h('em', 'у розмові.')),
        h('p.muted', { style: { marginBottom: '20px' } },
          'Біблійна англійська і жива англійська — різні речі, тому конструкції беремо з сучасної мови.'),
        ...L.targets.map(t => h('.phrase',
          h('.phrase__row',
            h('.phrase__en', t.en),
            ctx.tts.available() ? speakBtn(ctx, t.en) : null,
          ),
          h('.phrase__uk', t.uk),
          h('.phrase__note', t.note),
          h('.phrase__note', { style: { opacity: .85 } }, h('i', t.example)),
        )),
      ], actionbar(primaryBtn('Далі', next, { arrow: '→' })));

    case 'sample':
      return page([
        h('p.eyebrow', { style: { marginTop: '18px' } }, 'Приклад'),
        h('h2', 'Як може ', h('em', 'звучати відповідь.')),
        h('p.muted', { style: { marginBottom: '16px' } }, `Рівень ${L.sampleAnswer.level}. ${L.sampleAnswer.note}`),
        h('.card', h('p', { style: { marginBottom: 0, fontFamily: 'var(--font-serif)', fontSize: '1.12rem', lineHeight: 1.55 } },
          L.sampleAnswer.text)),
        ctx.tts.available() ? ttsPlayer(ctx.tts, L.sampleAnswer.text, { title: 'Послухати приклад' }) : null,
        h('p.caption', 'Не переказуй цей приклад. Він тут лише щоб показати обсяг.'),
      ], actionbar(primaryBtn('Я готовий відповідати', next, { arrow: '→' })));

    case 'template':
      return templateStep(ctx, page, next);

    case 'consent':
      return consentStep(ctx, page, next);

    case 'shadow':
      return shadowStep(ctx, frame, next);

    case 'record':
      return recordStep(ctx, frame);

    case 'review':
      return reviewStep(ctx, page);

    case 'processing': {
      const wave = h('.wave', { style: { marginBottom: '16px' } },
        ...Array.from({ length: 14 }, (_, i) => h('i', {
          style: {
            height: (6 + Math.abs(Math.sin(i)) * 22) + 'px',
            animation: `eq 900ms ${i * 0.06}s ease-in-out infinite alternate`,
          },
        })));
      return frame(h('.flow', h('.wrap',
        h('.card', { style: { marginTop: '26dvh', textAlign: 'center', padding: '32px 22px' } },
          wave,
          h('h3', 'Розбираю твою відповідь'),
          h('p.caption', { style: { marginBottom: 0 } }, ls.processingNote || 'Кілька секунд…'),
        ))));
    }

    case 'transcript':
      return transcriptStep(ctx, page);

    case 'corrections':
      return correctionsStep(ctx, page, next);

    case 'improved':
      return improvedStep(ctx, page, next);

    case 'save-phrase':
      return savePhraseStep(ctx, page, next);

    case 'complete':
      return completeStep(ctx, page);

    default:
      return page([h('p', 'Невідомий крок.')], actionbar(
        h('button.btn.btn--ghost.btn--center', { type: 'button', onclick: ctx.onExit }, 'На головну')));
  }
}

/* ---------------- дрібні помічники ---------------- */

function planOf(L) {
  if (L.kind === 'shadowing') return [
    'Уривок українською та англійською, з аудіо',
    'Три короткі фрази, які легко сказати',
    'Ти слухаєш і повторюєш уголос — без розбору й оцінки',
  ];
  if (L.kind === 'monologue') return [
    'Уривок українською та англійською, з аудіо',
    'Три конструкції, якими зв\'язують розповідь',
    'Монолог 60–90 секунд — найдовша відповідь маршруту',
    'Порівняння з твоєю відповіддю в день 3',
  ];
  if (L.kind === 'template') return [
    'Уривок українською та англійською, з аудіо',
    'Три конструкції для живої розмови',
    'Ти збираєш власне речення з рамки і промовляєш його',
    'Максимум три підказки з поясненням українською',
  ];
  return [
    'Уривок українською та англійською, з аудіо',
    'Три конструкції, які справді вживають у розмові',
    'Твоя власна відповідь уголос — до 60 секунд',
    'Максимум три підказки й пояснення українською',
  ];
}

/**
 * Інтервальне повторення в найдешевшому вигляді: фраза, збережена в
 * попередні дні, повертається на початку наступного уроку. Окремого
 * екрана повторення немає — і поки що не треба.
 */
function recallCard(ctx) {
  const saved = (ctx.savedPhrases || []).filter(p => p.day < ctx.lesson.day);
  if (!saved.length) return null;
  const pick = saved[saved.length - 1];
  return h('.card', { style: { background: 'var(--surface-2)' } },
    h('p.eyebrow', `Ти зберіг це в день ${pick.day}`),
    h('.phrase__row',
      h('p', { style: { flex: 1, margin: 0, fontFamily: 'var(--font-serif)', fontSize: '1.08rem', lineHeight: 1.4 } },
        pick.text),
      ctx.tts.available() ? speakBtn(ctx, pick.text) : null,
    ),
    h('p.caption', { style: { marginTop: '10px', marginBottom: 0 } },
      'Скажи це вголос один раз — і йдемо далі.'),
  );
}

function speakBtn(ctx, text, size = 17) {
  const b = h('button.speak', { type: 'button', 'aria-label': 'Прослухати: ' + text }, icon('speak', size));
  b.addEventListener('click', () => {
    b.classList.add('is-on');
    b.replaceChildren(h('.eq', h('i'), h('i'), h('i'), h('i')));
    ctx.tts.speak(text, { onend: () => { b.classList.remove('is-on'); b.replaceChildren(icon('speak', size)); } });
  });
  return b;
}

const norm = (s) => String(s || '').toLowerCase().replace(/[^a-z0-9' ]/gi, '').replace(/\s+/g, ' ').trim();

/* ---------------- КРОК: рамка речення (день 2) ---------------- */

function templateStep(ctx, page, next) {
  const T = ctx.lesson.template;
  const sel = ctx.ls.templateSlots || (ctx.ls.templateSlots = {});

  const sentence = () => T.frame.map(part =>
    part.type === 'text' ? part.value : (sel[part.id] ? sel[part.id].en : '…')).join('');

  const ready = T.frame.filter(p => p.type === 'slot').every(p => sel[p.id]);

  const preview = h('.thought.thought--improved', { style: { marginBottom: '18px' } },
    h('small', 'Твоє речення'),
    h('p.thought__text', sentence()),
  );

  const slotGroup = (slotId) => {
    const cfg = T.slots[slotId];
    return h('div', { style: { marginBottom: '18px' } },
      h('p.eyebrow', cfg.label),
      h('div', { style: { display: 'flex', flexWrap: 'wrap', gap: '8px' } },
        ...cfg.options.map(o => {
          const on = sel[slotId] && sel[slotId].en === o.en;
          return h('button.chip' + (on ? '.is-on' : ''), {
            type: 'button', 'aria-pressed': on ? 'true' : 'false',
            onclick: () => { sel[slotId] = o; ctx.rerender(); },
          }, h('b', o.en), h('span', o.uk));
        }),
      ),
    );
  };

  return page([
    h('p.eyebrow', { style: { marginTop: '18px' } }, 'Рамка'),
    h('h2', 'Збери ', h('em', 'своє речення.')),
    h('p.muted', { style: { marginBottom: '20px' } }, T.lead),
    preview,
    slotGroup('feel'),
    slotGroup('do'),
    h('p.caption', T.hint),
  ], actionbar(
    primaryBtn('Це моє речення', () => { ctx.setTemplateSentence(sentence()); next(); },
      { arrow: '→', disabled: !ready }),
    !ready ? h('p.caption.center', { style: { margin: '6px 0 0' } }, 'Обери по одному варіанту в кожному рядку') : null,
  ));
}

/* ---------------- КРОК: повторення за диктором (день 1) ---------------- */

function shadowStep(ctx, frame, next) {
  const L = ctx.lesson;
  const S = L.shadow;
  const ls = ctx.ls;
  const i = ls.shadowIndex || 0;
  const item = S.items[i];
  const done = ls.shadowDone || (ls.shadowDone = []);
  const rec = ls.shadowRec || (ls.shadowRec = {});

  let recorder = null, recording = false;
  const hint = h('p.caption.center', { style: { minHeight: '20px', marginBottom: 0 } },
    rec[item.id] ? S.doneLine : 'Спершу послухай, потім натисни мікрофон.');
  let micBtn;

  async function stop() {
    if (!recorder || !recording) return;
    recording = false;
    const out = await recorder.stop();
    if (out && out.blob && out.blob.size > 300) {
      rec[item.id] = { blob: out.blob, durationMs: out.durationMs };
      if (!done.includes(item.id)) done.push(item.id);
      ls.shadowMs = (ls.shadowMs || 0) + out.durationMs;
    }
    ctx.rerender();
  }

  async function start() {
    try {
      recorder = createRecorder({ onAutoStop: stop });
      await recorder.start();
      track('microphone_permission_granted');
      track('voice_recording_started', { day: L.day });
      recording = true;
      micBtn.classList.add('is-recording');
      micBtn.replaceChildren(icon('stop', 30));
      hint.textContent = 'Говори… Натисни ще раз, коли скажеш.';
    } catch (err) {
      const kind = classifyMicError(err);
      track('microphone_permission_denied', { reason: kind });
      ctx.setMicError(kind);
    }
  }

  micBtn = h('button.mic', {
    type: 'button', style: { width: '88px', height: '88px' },
    'aria-label': 'Повторити вголос',
    onclick: () => (recording ? stop() : start()),
  }, icon('mic', 32));

  const hasRec = !!rec[item.id];

  return frame(h('.flow.pad-bottom', h('.wrap',
    h('p.eyebrow.eyebrow--plain', { style: { marginTop: '18px' } }, `Фраза ${i + 1} з ${S.items.length}`),
    h('h2', 'Слухай ', h('em', 'і повторюй.')),
    h('p.muted', { style: { marginBottom: '18px' } }, S.lead),

    h('.card.card--lift', { style: { padding: '24px 20px' } },
      h('p', { style: { fontFamily: 'var(--font-serif)', fontSize: '1.5rem', lineHeight: 1.35, letterSpacing: '-.02em', marginBottom: '6px' } },
        item.text),
      h('p.muted', { style: { marginBottom: '16px' } }, item.uk),
      ctx.tts.available()
        ? ttsPlayer(ctx.tts, item.text, { title: 'Послухати', sub: 'Повільно, з паузами', compact: true })
        : h('p.caption', 'Озвучення недоступне в цьому браузері — прочитай уголос сам.'),
      h('.recorder', { style: { gap: '12px' } }, micBtn),
      hint,
      hasRec ? blobPlayer(rec[item.id].blob, {
        title: 'Як це прозвучало в тебе', durationMs: rec[item.id].durationMs,
      }) : null,
    ),

    ls.micError ? micErrorCard(ls.micError, ctx, { shadow: true }) : null,

    h('.route-dots', { style: { marginTop: '16px' } },
      ...S.items.map((it, k) => h('i' + (done.includes(it.id) ? '.on' : k === i ? '.now' : '')))),
    h('p.caption.center', { style: { marginTop: '8px' } },
      'Цей запис нікуди не надсилається — навіть у демо-розпізнавання. Він лишається у вкладці.'),
  )),
  actionbar(
    // Поки фразу не сказано, головна дія — мікрофон. Кнопка «пропустити»
    // навмисно тиха, щоб не запрошувати пропускати.
    i < S.items.length - 1
      ? (hasRec
          ? primaryBtn('Наступна фраза',
              () => { ls.shadowIndex = i + 1; ls.micError = null; ctx.rerender(); }, { arrow: '→' })
          : h('button.btn.btn--quiet', { type: 'button',
              onclick: () => { ls.shadowIndex = i + 1; ls.micError = null; ctx.rerender(); } },
              'Пропустити цю фразу'))
      : (done.length
          ? primaryBtn('Завершити', next, { arrow: '→' })
          : h('button.btn.btn--quiet', { type: 'button', onclick: next }, 'Завершити без запису')),
    i > 0 ? h('button.btn.btn--quiet', { type: 'button',
      onclick: () => { ls.shadowIndex = i - 1; ctx.rerender(); } }, 'Попередня фраза') : null,
  ));
}

/* ---------------- решта кроків ---------------- */

function consentStep(ctx, page, next) {
  const shadowOnly = ctx.lesson.kind === 'shadowing';
  return page([
    h('p.eyebrow', { style: { marginTop: '18px' } }, 'Перед записом'),
    h('h2', 'Що станеться ', h('em', 'з твоїм голосом.')),
    h('.card',
      h('.kv', h('span', 'Що обробляється'), h('b', shadowOnly ? 'Нічого' : 'Аудіо твоєї відповіді')),
      h('.kv', h('span', 'Навіщо'), h('b', shadowOnly ? 'Щоб ти почув себе' : 'Текст і мовний розбір')),
      h('.kv', h('span', 'Куди надсилається'),
        h('b', shadowOnly ? 'Нікуди' : (ctx.providerMode === 'mock' ? 'Нікуди' : 'На сервер застосунку'))),
      h('.kv', h('span', 'Чи зберігається аудіо'), h('b', 'Ні')),
      h('.kv', h('span', 'Де живе запис'), h('b', 'Лише у вкладці браузера')),
    ),
    shadowOnly
      ? h('p', { style: { fontSize: '.92rem' } },
          h('b', 'Сьогодні аудіо не покидає твій телефон узагалі. '),
          'Воно не йде ні на сервер, ні в розпізнавання. Ти просто чуєш себе — і все.')
      : h('ul.list.tiny',
          h('li', 'Оригінальне аудіо видаляється одразу після транскрипції.'),
          h('li', 'Текст твоєї відповіді не потрапляє в аналітику й не пишеться в технічні логи.'),
          h('li', 'Ти можеш видалити запис або всі свої дані будь-коли — у налаштуваннях.'),
          h('li', 'Ми не заявляємо про шифрування: у цій версії воно не реалізоване й не перевірене.'),
        ),
    h('p.caption', shadowOnly
      ? 'Якщо мікрофона немає — урок можна просто дочитати, фрази прочитаєш уголос сам.'
      : 'Можна пройти урок і без мікрофона — текстом. Кнопка буде на наступному екрані.'),
  ], actionbar(
    primaryBtn('Згоден, далі', () => { ctx.acceptConsent(); track('consent_accepted', { day: ctx.lesson.day }); next(); }, { arrow: '→' }),
    shadowOnly ? null : h('button.btn.btn--quiet', { type: 'button', onclick: () => ctx.useTextMode() },
      'Не хочу записувати голос — пройду текстом'),
  ));
}

function recordStep(ctx, frame) {
  const ls = ctx.ls;
  const L = ctx.lesson;
  if (ls.textMode) return textInputStep(ctx, frame);

  let recorder = null, recording = false;
  const bars = Array.from({ length: 21 }, () => h('i'));
  const timerEl = h('.timer', '0:00', h('small', ' / 1:00'));
  const limitFill = h('i');
  const hint = h('p.caption.center', { style: { minHeight: '20px', marginBottom: 0 } },
    'Натисни й говори. Можна зупинити раніше.');
  let micBtn;

  const setLevel = (v) => {
    for (let i = 0; i < bars.length; i++) {
      const d = 1 - Math.abs(i - (bars.length - 1) / 2) / ((bars.length - 1) / 2);
      const hgt = 5 + v * 32 * (0.35 + d * 0.65) * (0.7 + Math.random() * 0.6);
      bars[i].style.height = Math.min(38, hgt) + 'px';
      bars[i].style.opacity = String(0.4 + v * 0.6);
    }
  };
  const setTime = (ms) => {
    timerEl.replaceChildren(document.createTextNode(fmtTime(ms)), h('small', ' / 1:00'));
    limitFill.style.width = Math.min(100, (ms / MAX_RECORDING_MS) * 100) + '%';
  };

  async function stop() {
    if (!recorder || !recording) return;
    recording = false;
    micBtn.classList.remove('is-recording');
    micBtn.replaceChildren(icon('mic', 38));
    const out = await recorder.stop();
    setLevel(0);
    if (!out || !out.blob || out.blob.size < 512) {
      hint.textContent = 'Запис вийшов порожній. Спробуй ще раз — говори ближче до мікрофона.';
      return;
    }
    ctx.setRecording(out.blob, out.durationMs);
  }

  async function start() {
    hint.textContent = '';
    try {
      recorder = createRecorder({
        onLevel: setLevel, onTick: setTime,
        onAutoStop: () => { hint.textContent = 'Хвилина вийшла — запис зупинено.'; stop(); },
      });
      await recorder.start();
      track('microphone_permission_granted');
      track('voice_recording_started', { day: L.day });
      recording = true;
      micBtn.classList.add('is-recording');
      micBtn.replaceChildren(icon('stop', 34));
      hint.textContent = 'Говорю… Натисни ще раз, щоб зупинити.';
    } catch (err) {
      const kind = classifyMicError(err);
      track('microphone_permission_denied', { reason: kind });
      ctx.setMicError(kind);
    }
  }

  micBtn = h('button.mic', {
    type: 'button', 'aria-label': 'Записати відповідь',
    onclick: () => (recording ? stop() : start()),
  }, icon('mic', 38));

  const sentence = ls.templateSentence;

  return frame(h('.flow.pad-bottom', h('.wrap',
    h('p.eyebrow', { style: { marginTop: '18px' } }, sentence ? 'Скажи це вголос' : 'Твоя черга'),
    sentence
      ? h('.thought.thought--improved', { style: { marginBottom: '16px' } },
          h('small', 'Твоє речення'), h('p.thought__text', sentence))
      : h('h2', { style: { fontSize: '1.42rem' } }, L.lifeQuestion),
    h('p.muted', { style: { marginBottom: '20px' } }, (L.voicePrompt && (L.voicePrompt[ctx.mode] || L.voicePrompt.open)) || ''),

    h('.card.card--lift', { style: { padding: '24px 18px' } },
      h('.recorder', h('.wave', ...bars), micBtn, timerEl, h('.limitbar', limitFill)),
      hint,
    ),

    ls.micError ? micErrorCard(ls.micError, ctx) : null,

    sentence ? null : h('details', { style: { marginTop: '4px' } },
      h('summary.caption', { style: { cursor: 'pointer', padding: '9px 0' } }, 'Підказка: з чого почати'),
      h('p.caption', { style: { marginTop: '4px' } },
        'Почни просто: “This week I\'m worried about…”. Далі — чому. Потім — що ти з цим робиш. Три речення.'),
    ),

    h('button.btn.btn--quiet', { type: 'button', onclick: () => ctx.useTextMode() },
      'Немає мікрофона? Пройти текстом'),
  )));
}

function micErrorCard(kind, ctx, { shadow = false } = {}) {
  const map = {
    [MIC_ERRORS.DENIED]: {
      t: 'Доступ до мікрофона заборонено',
      b: 'Ти або браузер відхилили запит. Це можна змінити в налаштуваннях сайту й спробувати ще раз.',
    },
    [MIC_ERRORS.EMBEDDED]: {
      t: 'Тут запис недоступний',
      b: 'Застосунок відкритий усередині вбудованого вікна, а воно не передає дозвіл на мікрофон. Це не твої налаштування — там цього не змінити. Відкрий застосунок за його власною адресою, окремою вкладкою.',
    },
    [MIC_ERRORS.NOTFOUND]: {
      t: 'Мікрофон не знайдено',
      b: 'На цьому пристрої немає доступного мікрофона.',
    },
    [MIC_ERRORS.UNSUPPORTED]: {
      t: 'Браузер не дозволяє запис тут',
      b: 'Запис недоступний у цьому контексті — таке буває у вбудованих вікнах. Відкрий застосунок як окрему сторінку.',
    },
    [MIC_ERRORS.OTHER]: { t: 'Не вдалося увімкнути мікрофон', b: 'Спробуй ще раз.' },
  };
  const m = map[kind] || map[MIC_ERRORS.OTHER];
  return h('.card', { style: { borderColor: 'var(--clay)' } },
    h('h3', { style: { color: 'var(--clay)' } }, m.t),
    h('p.tiny', m.b + (shadow ? ' Сьогодні можна просто прочитати фрази вголос без запису — сенс дня від цього не втрачається.' : '')),
    shadow ? null : h('button.btn.btn--ghost.btn--sm.btn--center', { type: 'button', onclick: () => ctx.useTextMode() },
      'Пройти текстом'),
  );
}

function textInputStep(ctx, frame) {
  const ls = ctx.ls;
  const L = ctx.lesson;
  let draft = ls.textDraft || ls.templateSentence || '';
  const counter = h('.caption', { style: { textAlign: 'right' } }, `${draft.length} / 600`);
  const submitBtn = h('button.btn.btn--primary', {
    type: 'button', disabled: draft.trim().length < 10,
    onclick: () => { track('text_fallback_used', { day: L.day }); ctx.submitText(draft.trim()); },
  }, h('span', 'Надіслати на розбір'), h('span.btn__arrow', '→'));
  const ta = h('textarea.field', {
    placeholder: ls.templateSentence || "This week I'm worried about…",
    maxlength: '600', rows: '6', spellcheck: 'false',
    autocapitalize: 'sentences', enterkeyhint: 'done', value: draft,
    oninput: (e) => {
      draft = e.target.value; ctx.ls.textDraft = draft;
      counter.textContent = `${draft.length} / 600`;
      submitBtn.disabled = draft.trim().length < 10;
    },
  });

  return frame(h('.flow.pad-bottom', h('.wrap',
    h('p.eyebrow', { style: { marginTop: '18px' } }, 'Текстовий шлях'),
    h('h2', { style: { fontSize: '1.42rem' } }, ls.templateSentence ? 'Напиши своє речення' : L.lifeQuestion),
    h('p.muted', { style: { marginBottom: '16px' } },
      'Напиши англійською своїми словами. Розбір буде такий самий, як для голосу — не буде тільки тривалості мовлення.'),
    ta, counter,
    h('p.caption', 'Це твій справжній текст: тут не працює жодне розпізнавання голосу, тому й підмінити його нічим.'),
    h('div', { style: { marginTop: '12px' } }, submitBtn),
    micSupported() ? h('button.btn.btn--quiet', { type: 'button', onclick: () => ctx.useVoiceMode() },
      'Повернутися до запису голосом') : null,
  )));
}

function reviewStep(ctx, page) {
  const ls = ctx.ls;
  return page([
    h('p.eyebrow', { style: { marginTop: '18px' } }, 'Перед надсиланням'),
    h('h2', 'Послухай ', h('em', 'себе.')),
    h('p.muted', { style: { marginBottom: '16px' } },
      'Це тільки для тебе. Не подобається — перезапиши, ніхто цього не почує.'),
    ls.audioBlob ? blobPlayer(ls.audioBlob, {
      title: 'Твій запис', durationMs: ls.durationMs, onDelete: () => ctx.deleteRecording(),
    }) : h('p.muted', 'Запису немає.'),
    h('p.caption', 'Після розбору це аудіо буде видалене. Воно не зберігається.'),
  ], actionbar(
    primaryBtn('Надіслати на розбір', () => ctx.submitVoice(), { arrow: '→' }),
    h('.btn-row', { style: { marginTop: '8px' } },
      h('button.btn.btn--ghost.btn--center.btn--sm', { type: 'button', onclick: () => ctx.retake() }, 'Перезаписати'),
      h('button.btn.btn--danger.btn--sm', { type: 'button', onclick: () => ctx.deleteRecording() }, 'Видалити'),
    ),
  ));
}

function transcriptStep(ctx, page) {
  const t = ctx.ls.transcript;
  const isDemo = t && t.isDemo;
  return page([
    h('p.eyebrow', { style: { marginTop: '18px' } }, 'Що почув застосунок'),
    isDemo ? mockBadge('Це НЕ розшифровка вашого голосу. Справжнє розпізнавання ще не підключене, тому показано підготовлений демонстраційний текст — щоб ви могли пройти урок до кінця.') : null,
    t && t.provider === 'text-input'
      ? h('p.caption', { style: { marginTop: '-4px' } }, '✓ Це рівно той текст, який ви написали. Розпізнавання голосу тут не застосовувалося.')
      : null,
    youLayer('Твоя відповідь',
      h('p', { style: { marginBottom: 0, fontFamily: 'var(--font-serif)', fontSize: '1.15rem', lineHeight: 1.5 } },
        t ? t.text : '')),
    h('.card',
      h('h3', 'Це схоже на те, що ти сказав?'),
      h('p.tiny', isDemo
        ? 'У демо-режимі — звісно ні. У робочій версії тут можна повернутися й перезаписати, якщо розпізнало неправильно.'
        : 'Якщо текст сильно розходиться з тим, що ти говорив, краще перезаписати — інакше розбір буде не про твою відповідь.'),
      h('.btn-row',
        h('button.btn.btn--ghost.btn--center.btn--sm', { type: 'button', onclick: () => ctx.retake() }, 'Ні, перезаписати'),
        h('button.btn.btn--primary.btn--center.btn--sm', { type: 'button', onclick: () => ctx.goStep(ctx.ls.step + 1) }, 'Так, далі'),
      ),
    ),
  ]);
}

function correctionsStep(ctx, page, next) {
  const a = ctx.ls.analysis;
  const list = (a && a.corrections) || [];
  track('feedback_shown', { day: ctx.lesson.day, count: list.length });
  return page([
    h('p.eyebrow', { style: { marginTop: '18px' } }, 'Розбір'),
    h('h2', list.length
      ? h('span', list.length === 1 ? 'Одна річ, ' : 'Кілька речей, ', h('em', 'і не більше.'))
      : h('span', 'Тут майже ', h('em', 'нема що виправляти.'))),
    h('p.muted', { style: { marginBottom: '18px' } },
      a && a.totalFound > list.length
        ? `Дрібніших неточностей більше (${a.totalFound}), але показуємо максимум три — решта зараз не важлива.`
        : 'Показуємо максимум три — решта зараз не важлива.'),
    a && a.isDemo ? h('span.pill.pill--mock', { style: { marginBottom: '14px' } }, 'Демо: розбір за правилами, без AI') : null,
    list.length
      ? analysisLayer('Мовний розбір', ...list.map(c => h('.fix',
          h('.fix__kind', KIND_LABEL[c.kind] || c.kind),
          h('.fix__swap', h('span.fix__before', c.before), ' → ', h('span.fix__after', c.after)),
          h('.fix__why', c.why),
        )))
      : analysisLayer('Мовний розбір', h('p', { style: { marginBottom: 0 } },
          'Правила не знайшли типових помилок. Це не означає «ідеально» — це означає, що цей набір правил не має що сказати.')),
    h('p.caption', 'Зміст твоєї відповіді не змінювався. Виправляли тільки форму.'),
  ], actionbar(primaryBtn(list.length ? 'Показати природнішу версію' : 'Далі', next, { arrow: '→' })));
}

function improvedStep(ctx, page, next) {
  const ls = ctx.ls;
  const a = ls.analysis;
  const safe = filterAiOutput(a ? a.improved : '');
  const text = safe.text;
  const original = ls.transcript ? ls.transcript.text : '';
  const unchanged = safe.ok && norm(text) === norm(original);

  const repeatBtn = h('button.btn.btn--ghost.btn--center', { type: 'button' }, h('span', 'Повторити за диктором'));
  repeatBtn.addEventListener('click', () => {
    track('improved_audio_played', { day: ctx.lesson.day });
    repeatBtn.disabled = true;
    repeatBtn.replaceChildren(h('.eq', h('i'), h('i'), h('i'), h('i')),
      h('span', { style: { marginLeft: '10px' } }, 'Слухай і повторюй…'));
    ctx.tts.speak(text, {
      rate: 0.85,
      onend: () => { repeatBtn.disabled = false; repeatBtn.replaceChildren(h('span', 'Повторити за диктором')); },
    });
  });

  return page([
    h('p.eyebrow', { style: { marginTop: '18px' } }, unchanged ? 'Нічого міняти' : 'Та сама думка'),
    h('h2', unchanged
      ? h('span', 'Ти сказав це ', h('em', 'правильно одразу.'))
      : h('span', 'Твої слова. ', h('em', 'Трохи природніше.'))),
    h('p.muted', { style: { marginBottom: '20px' } }, unchanged
      ? 'Правила не знайшли, що тут поліпшити. Це твоє речення таким, як ти його сказав.'
      : 'Це не зразкова відповідь із підручника. Зміст твій — змінена тільки форма.'),

    !safe.ok
      ? h('.card', { style: { borderColor: 'var(--danger)' } },
          h('h3', { style: { color: 'var(--danger)' } }, 'Розбір заблоковано'),
          h('p.tiny', { style: { marginBottom: 0 } },
            'Вихід помічника не пройшов перевірку безпеки (' + safe.violations.map(v => v.why).join(', ') + '), тому його не показано.'))
      : unchanged
        ? h('.thought.thought--improved', { style: { marginBottom: '16px' } },
            h('small', 'Твоє речення'),
            h('p.thought__text', text),
            h('.thought__note', 'Без жодної правки.'))
        : thoughtPair({
            original, improved: text,
            originalLabel: 'Як сказав ти', improvedLabel: 'Трохи природніше',
            note: 'Та сама думка. Більше впевненості.',
          }),

    ctx.tts.available() ? ttsPlayer(ctx.tts, text, { title: unchanged ? 'Послухати своє речення' : 'Послухати покращену версію' }) : null,
    ctx.tts.available() ? repeatBtn : h('p.caption', 'Озвучення недоступне в цьому браузері.'),

    a && a.usedTargets ? usedConstructions(ctx.lesson, a.usedTargets, { compact: true }) : null,
  ], actionbar(
    primaryBtn('Далі', next, { arrow: '→' }),
    h('button.btn.btn--quiet', { type: 'button', onclick: () => ctx.retake(true) }, 'Записати ще раз із цим знанням'),
  ));
}

/**
 * День 7 проти дня 3 — дві однакові відкриті відповіді з різницею в тиждень.
 * Порівнюємо тільки їх: порівнювати повторення за диктором із монологом
 * було б нечесно, і це сказано прямо.
 */
function comparisonBlock(ctx, secsNow) {
  const d3 = (ctx.lessonsState && ctx.lessonsState['3']) || null;
  const secsThen = d3 && d3.speechMs ? Math.round(d3.speechMs / 1000) : null;
  const phraseThen = (ctx.savedPhrases || []).filter(p => p.day === 3).slice(-1)[0];
  const phraseNow = ctx.ls.savedPhrase;

  if (!d3 && !phraseThen) {
    return h('.card',
      h('p.eyebrow', 'Порівняння з днем 3'),
      h('p.tiny', { style: { marginBottom: 0 } },
        'Дані дня 3 не знайдені — схоже, той день проходили на іншому пристрої або дані вже видалені. Порівняти нема з чим, але сьогоднішня відповідь від цього не гірша.'),
    );
  }

  const delta = (secsThen != null && secsNow != null)
    ? Math.round(((secsNow - secsThen) / Math.max(secsThen, 1)) * 100) : null;

  return h('div',
    h('.card',
      h('p.eyebrow', 'День 3 → День 7'),
      h('.metric-row', { style: { marginBottom: '0' } },
        h('.metric',
          h('b', secsThen != null ? secsThen : '—'),
          h('span', 'секунд у день 3')),
        h('.metric',
          h('b', secsNow != null ? secsNow : '—'),
          h('span', 'секунд сьогодні')),
      ),
      delta != null ? h('p.caption', { style: { marginTop: '12px', marginBottom: 0 } },
        delta > 0
          ? `Сьогодні ти говорив на ${delta}% довше, ніж чотири дні тому.`
          : delta === 0
            ? 'Тривалість та сама. Дивись не на секунди, а на речення нижче.'
            : 'Сьогодні коротше — і це нормально: коротко сказати складніше, ніж довго.')
        : h('p.caption', { style: { marginTop: '12px', marginBottom: 0 } },
            'Один із днів пройдено текстом, тож секунди не порівнюємо.'),
    ),
    (phraseThen && phraseNow) ? thoughtPair({
      original: phraseThen.text, improved: phraseNow,
      originalLabel: 'Твоє речення в день 3',
      improvedLabel: 'Твоє речення сьогодні',
      note: 'Між ними — чотири дні й п\'ять розмов уголос.',
    }) : null,
  );
}

function usedConstructions(L, used, { compact = false } = {}) {
  const hit = L.targets.filter(t => used.includes(t.id));
  const rest = L.targets.filter(t => !used.includes(t.id));
  return h('.card', { style: { marginTop: compact ? '14px' : '0' } },
    h('p.eyebrow', 'Конструкції у твоїй відповіді'),
    hit.length
      ? h('.used-list', ...hit.map(t => h('.used', h('.used__mark', '✓'), h('span', t.en))))
      : h('p', { style: { marginBottom: '6px' } }, 'Цього разу жодна з трьох не прозвучала — і це нормально.'),
    rest.length
      ? h('p.caption', { style: { marginBottom: 0, marginTop: hit.length ? '12px' : '0' } },
          (hit.length ? 'Лишилися на потім: ' : 'Спробуй їх наступного разу: ') + rest.map(t => t.en).join(' · '))
      : h('p.caption', { style: { marginBottom: 0, marginTop: '12px' } }, 'Усі три — в одній відповіді.'),
  );
}

function savePhraseStep(ctx, page, next) {
  const ls = ctx.ls;
  const text = (ls.analysis && ls.analysis.improved) || '';
  const options = splitSentences(text).slice(0, 4);
  let picked = ls.pickedPhrase || options[0] || '';

  return page([
    h('p.eyebrow', { style: { marginTop: '18px' } }, 'Забрати з собою'),
    h('h2', 'Одна фраза ', h('em', 'на повторення.')),
    h('p.muted', { style: { marginBottom: '20px' } },
      'Вибери речення, яке хочеш уміти сказати не думаючи. Воно повернеться в наступних днях.'),
    options.length
      ? h('div', ...options.map(s => h('button.choice', {
          type: 'button', 'aria-pressed': picked === s ? 'true' : 'false',
          onclick: () => { picked = s; ctx.ls.pickedPhrase = s; ctx.rerender(); },
        }, h('.choice__dot'), h('.choice__body',
          h('b', { style: { fontWeight: 500, fontFamily: 'var(--font-serif)', fontSize: '1.02rem' } }, s)))))
      : h('p.muted', 'Немає з чого вибрати.'),
  ], actionbar(
    primaryBtn('Зберегти мою фразу', () => { ctx.savePhrase(picked); next(); }, { arrow: '🔖' }),
    h('button.btn.btn--quiet', { type: 'button', onclick: next }, 'Пропустити'),
  ));
}

function completeStep(ctx, page) {
  const ls = ctx.ls;
  const L = ctx.lesson;
  const a = ls.analysis;
  const shadowing = L.kind === 'shadowing';
  const used = (a && a.usedTargets) || [];
  const secs = shadowing
    ? (ls.shadowMs ? Math.round(ls.shadowMs / 1000) : null)
    : (ls.durationMs ? Math.round(ls.durationMs / 1000) : null);
  const practice = L.practice[ctx.mode] || L.practice.open;
  const improved = (a && a.improved) || '';
  const trophyLine = shadowing ? L.trophyLine : (ls.savedPhrase || splitSentences(improved)[0] || improved);
  const trophyFoot = shadowing ? L.trophyFoot : 'Тиждень тому цього речення не існувало.';
  const answer = ls.transcript ? ls.transcript.text : '';
  const words = shadowing
    ? (L.shadow.items.filter(i => (ls.shadowDone || []).includes(i.id))
        .join(' ').match(/[A-Za-z'’]+/g) || []).length
    : (answer.match(/[A-Za-z'’]+/g) || []).length;
  const saidCount = shadowing ? (ls.shadowDone || []).length : null;

  return page([
    h('p.eyebrow', { style: { marginTop: '20px' } }, `День ${L.day} — пройдено`),
    h('h1', { style: { fontSize: '2rem', marginBottom: '14px' } },
      shadowing ? h('span', 'Ти сказав це ', h('em', 'уголос.')) : h('span', 'Ти сказав це ', h('em', 'англійською.'))),
    h('p.muted', { style: { marginBottom: '22px' } },
      shadowing
        ? (saidCount
            ? `Ти вимовив ${saidCount} ${plural(saidCount, 'фразу', 'фрази', 'фраз')} англійською. ${L.encouragement}`
            : L.encouragement)
        : (secs != null
            ? `Сьогодні ти говорив ${secs} ${plural(secs, 'секунду', 'секунди', 'секунд')} мовою, якою боявся говорити.`
            : 'Сьогодні ти сформулював це англійською — своїми словами.')),

    trophyLine ? h('.trophy',
      h('.trophy__eyebrow', shadowing ? 'Фраза дня' : 'Твоє речення сьогодні'),
      h('p.trophy__text', trophyLine),
      h('p.trophy__foot', trophyFoot),
    ) : null,

    h('.metric-row',
      h('.metric',
        h('b', secs != null ? secs : '—'),
        h('span', secs != null
          ? (shadowing ? 'секунд ти говорив уголос' : 'секунд твого мовлення (разом із паузами)')
          : 'без заміру мовлення')),
      h('.metric',
        h('b', String(words)),
        h('span', shadowing ? 'слів англійською ти вимовив' : 'слів англійською у твоїй відповіді')),
    ),
    !shadowing && ls.retakes ? h('p.caption', { style: { marginTop: '-6px' } },
      `Ти пробував ще раз ${ls.retakes} ${plural(ls.retakes, 'раз', 'рази', 'разів')} — це теж рахується.`) : null,

    shadowing ? null : usedConstructions(L, used),

    h('.layer.layer--human', { style: { marginTop: '14px' } },
      h('.layer__tag', '✎ ' + practice.title),
      h('p', { style: { marginBottom: 0 } }, practice.body)),

    h('.card',
      h('p.eyebrow', 'Один крок на сьогодні'),
      h('p', { style: { marginBottom: 0, fontSize: '.95rem' } }, L.step[ctx.mode] || L.step.open)),

    L.kind === 'monologue' ? comparisonBlock(ctx, secs) : null,

    h('.card',
      h('p.eyebrow', 'Маршрут'),
      h('p.tiny', { style: { marginBottom: '4px' } }, ctx.routeNote),
      h('.route-dots', ...Array.from({ length: 7 }, (_, i) =>
        h('i' + (ctx.completedDays.includes(i + 1) || i + 1 === L.day ? '.on' : '')))),
    ),
  ], actionbar(primaryBtn(ctx.nextDayLabel || 'На головну', ctx.onFinish || ctx.onExit, { arrow: '→' })));
}

/* ---------------- утиліти ---------------- */

export function splitSentences(text) {
  return String(text || '').split(/(?<=[.!?])\s+/).map(s => s.trim()).filter(s => s.length > 8);
}
function plural(n, one, few, many) {
  const m10 = n % 10, m100 = n % 100;
  if (m10 === 1 && m100 !== 11) return one;
  if (m10 >= 2 && m10 <= 4 && (m100 < 10 || m100 >= 20)) return few;
  return many;
}
export { detectCrisis };

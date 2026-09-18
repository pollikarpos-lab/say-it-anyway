import { test } from 'node:test';
import assert from 'node:assert/strict';
import { PASSAGES, TRANSLATIONS } from '../src/content/scripture.js';
import { ROUTE, getDay, ACTIVE_DAY } from '../src/content/route.js';
import { LESSON_DAY3 as L } from '../src/content/lesson-day3.js';
import { LESSON_DAY1 as L1 } from '../src/content/lesson-day1.js';
import { LESSON_DAY2 as L2 } from '../src/content/lesson-day2.js';
import { LESSON_DAY4 as L4 } from '../src/content/lesson-day4.js';
import { LESSON_DAY5 as L5 } from '../src/content/lesson-day5.js';
import { LESSONS, BUILT_DAYS, getLesson, isDayUnlocked, nextDay } from '../src/content/lessons.js';
import { EVENTS } from '../src/lib/analytics.js';

test('маршрут має 7 днів, із них п\'ять написані', () => {
  assert.equal(ROUTE.days.length, 7);
  const ready = ROUTE.days.filter(d => d.status === 'ready').map(d => d.day);
  assert.deepEqual(ready, [1, 2, 3, 4, 5]);
  assert.deepEqual(BUILT_DAYS, [1, 2, 3, 4, 5]);
  assert.equal(ACTIVE_DAY, 1);
});

test('дні відкриваються послідовно', () => {
  assert.equal(isDayUnlocked(1, []), true);
  assert.equal(isDayUnlocked(2, []), false);
  assert.equal(isDayUnlocked(2, [1]), true);
  assert.equal(isDayUnlocked(3, [1]), false);
  assert.equal(isDayUnlocked(3, [1, 2]), true);
  assert.equal(isDayUnlocked(4, [1, 2, 3]), true);
  assert.equal(isDayUnlocked(5, [1, 2, 3, 4]), true);
  assert.equal(isDayUnlocked(6, [1, 2, 3, 4, 5]), false, 'день 6 ще не написаний');
});

test('показовий режим відкриває всі написані дні', () => {
  for (const d of BUILT_DAYS) assert.equal(isDayUnlocked(d, [], true), true);
  assert.equal(isDayUnlocked(6, [], true), false, 'але не ненаписані');
});

test('nextDay веде по маршруту', () => {
  assert.equal(nextDay([]), 1);
  assert.equal(nextDay([1]), 2);
  assert.equal(nextDay([1, 2]), 3);
  assert.equal(nextDay([1, 2, 3]), 4);
  assert.equal(nextDay([1, 2, 3, 4]), 5);
  assert.equal(nextDay([1, 2, 3, 4, 5]), 5);
});

test('дні 4 і 5 — вільна відповідь із власною мовною ціллю', () => {
  assert.equal(L4.kind, 'open');
  assert.equal(L5.kind, 'open');
  assert.deepEqual(L4.steps, L5.steps, 'однакова форма уроку');
  assert.notEqual(L4.lifeQuestion, L5.lifeQuestion);
  // день 4 — про минуле, день 5 — про майбутнє
  assert.ok(/вже пройшов|позаду/.test(L4.lifeQuestion + L4.intro.open));
  assert.ok(/цього тижня|зробиш/.test(L5.lifeQuestion + L5.voicePrompt.open));
});

test('усі п\'ять уроків мають унікальні уривки', () => {
  const ids = Object.values(LESSONS).map(l => l.passageId);
  assert.equal(new Set(ids).size, ids.length, 'уривки не повторюються: ' + ids.join(', '));
});

test('демо-транскрипції унікальні для кожного дня, де вони є', () => {
  const texts = Object.values(LESSONS).map(l => l.demoTranscript).filter(Boolean);
  assert.equal(new Set(texts).size, texts.length);
  assert.equal(LESSONS[1].demoTranscript, undefined, 'день 1 нічого не розпізнає');
});

test('кожен урок має свій тип і послідовність кроків', () => {
  assert.equal(L1.kind, 'shadowing');
  assert.equal(L2.kind, 'template');
  assert.equal(L.kind, 'open');
  for (const l of Object.values(LESSONS)) {
    assert.ok(Array.isArray(l.steps) && l.steps.length >= 8, `день ${l.day}`);
    assert.equal(l.steps[0], 'intro');
    assert.equal(l.steps[l.steps.length - 1], 'complete');
    assert.ok(l.steps.includes('consent'), 'згода перед будь-яким записом');
  }
});

test('день 1 не має ані розбору, ані транскрипції', () => {
  for (const forbidden of ['transcript', 'corrections', 'improved', 'processing', 'record']) {
    assert.ok(!L1.steps.includes(forbidden), `день 1 не повинен мати кроку ${forbidden}`);
  }
  assert.ok(L1.steps.includes('shadow'));
  assert.equal(L1.demoTranscript, undefined, 'день 1 нічого не розпізнає');
});

test('день 1: три короткі фрази для повторення', () => {
  assert.equal(L1.shadow.items.length, 3);
  assert.ok(L1.shadow.items[0].text.split(' ').length <= 3, 'перша фраза має бути дуже короткою');
  for (const it of L1.shadow.items) assert.ok(it.text && it.uk && it.id);
  assert.ok(L1.trophyLine.includes('anyway'));
});

test('день 2: рамка речення повна й узгоджена', () => {
  const T = L2.template;
  const slotIds = T.frame.filter(p => p.type === 'slot').map(p => p.id);
  assert.deepEqual(slotIds, ['feel', 'do']);
  for (const id of slotIds) {
    assert.ok(T.slots[id], `немає слота ${id}`);
    assert.ok(T.slots[id].options.length >= 4);
    for (const o of T.slots[id].options) assert.ok(o.en && o.uk);
  }
  assert.ok(L2.steps.includes('template'));
});

test('день 2: зібране речення — коректна англійська', () => {
  const T = L2.template;
  const build = (a, b) => T.frame.map(p => p.type === 'text' ? p.value
    : (p.id === 'feel' ? a : b)).join('');
  assert.equal(build('anxious', 'go for a walk'),
    'When I feel anxious, I go for a walk. It helps a little.');
});

test('усі уроки мають обидва тони практики', () => {
  for (const l of Object.values(LESSONS)) {
    for (const m of ['christian', 'open']) {
      assert.ok(l.practice[m] && l.practice[m].body, `день ${l.day} / ${m}`);
      assert.ok(l.step[m], `день ${l.day} / крок / ${m}`);
    }
  }
});

test('getLesson повертає саме те, що просили', () => {
  assert.equal(getLesson(1), L1);
  assert.equal(getLesson(2), L2);
  assert.equal(getLesson('3'), L);
  assert.equal(getLesson(9), null);
});

test('кожен день має назву й посилання', () => {
  for (const d of ROUTE.days) {
    assert.ok(d.title && d.ref && d.subtitle, `день ${d.day}`);
  }
});

test('усі п\'ять уривків перевірені, з джерелами звірки', () => {
  for (const id of ['2ti1.7', 'jhn14.27', 'php4.6-7', 'isa43.2', 'isa41.10']) {
    const p = PASSAGES[id];
    assert.ok(p, 'немає уривка ' + id);
    assert.equal(p.uk.status, 'verified', id);
    assert.equal(p.en.status, 'verified', id);
    assert.ok(p.uk.verifiedAgainst.length >= 2, `${id}: українська потребує двох джерел`);
    assert.ok(p.en.verifiedAgainst.length >= 1, id);
    assert.ok(p.context.body.length > 80 && p.context.caution, id + ': контекст і застереження');
  }
});

test('біблійний текст присутній лише у перевіреному вигляді', () => {
  const p = PASSAGES['php4.6-7'];
  for (const side of ['uk', 'en']) {
    assert.ok(['verified', 'unverified'].includes(p[side].status));
    if (p[side].status === 'verified') {
      assert.ok(p[side].verses.length > 0);
      assert.ok(p[side].verifiedAgainst.length > 0, 'має бути вказано джерело звірки');
      for (const v of p[side].verifiedAgainst) assert.ok(v.source && v.date);
    }
  }
});

test('український текст — саме Огієнко, англійський — BSB', () => {
  const p = PASSAGES['php4.6-7'];
  assert.equal(p.uk.translation, 'OHIENKO');
  assert.equal(p.en.translation, 'BSB');
  assert.ok(TRANSLATIONS.BSB.licence.includes('CC0'));
  assert.ok(TRANSLATIONS.OHIENKO.licence.includes('CC BY-SA'));
});

test('текст звірено з ДВОМА незалежними джерелами (українська)', () => {
  assert.ok(PASSAGES['php4.6-7'].uk.verifiedAgainst.length >= 2);
});

test('контекст відділений від Писання й підписаний людиною', () => {
  const c = PASSAGES['php4.6-7'].context;
  assert.ok(c.body.length > 100);
  assert.ok(c.author.includes('людина'));
  assert.ok(c.caution, 'має бути застереження проти хибного прочитання');
});

test('урок має три цільові конструкції з поясненнями', () => {
  assert.equal(L.targets.length, 3);
  for (const t of L.targets) {
    assert.ok(t.en && t.uk && t.note && t.example);
    assert.ok(Array.isArray(t.match) && t.match.length > 0);
  }
});

test('обидва режими мають свій тон практики', () => {
  for (const m of ['christian', 'open']) {
    assert.ok(L.practice[m] && L.practice[m].title && L.practice[m].body, m);
    assert.ok(L.step[m], m);
  }
  assert.notEqual(L.practice.christian.title, L.practice.open.title);
});

test('режим «просто англійська» свідомо відсутній', () => {
  assert.equal(L.practice.englishOnly, undefined);
});

test('усі потрібні події аналітики оголошені', () => {
  const required = [
    'landing_viewed','onboarding_started','onboarding_completed','lesson_started',
    'consent_accepted','microphone_permission_granted','microphone_permission_denied',
    'voice_recording_started','voice_submitted','transcription_succeeded','transcription_failed',
    'feedback_shown','improved_audio_played','retry_started','phrase_saved','lesson_completed',
    'app_install_prompt_shown','app_installed','recording_deleted','user_data_deleted',
  ];
  for (const e of required) assert.ok(EVENTS.includes(e), 'немає події ' + e);
});

test('демонстраційна транскрипція містить помилки рівня A2–B1', () => {
  assert.ok(/not know|stop to think|out from/.test(L.demoTranscript));
});

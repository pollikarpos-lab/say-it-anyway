import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createMockLlm, detectTargets } from '../src/providers/mock.js';
import { LESSON_DAY3 as L } from '../src/content/lesson-day3.js';

const llm = createMockLlm();
const analyze = (t) => llm.analyze({ transcript: t, targets: L.targets });

test('показує не більше трьох корекцій', async () => {
  const r = await analyze(L.demoTranscript);
  assert.ok(r.corrections.length <= 3);
  assert.ok(r.totalFound > r.corrections.length, 'у демо-тексті помилок більше, ніж показано');
});

test('корекції покривають різні категорії, найважливіше першим', async () => {
  const r = await analyze(L.demoTranscript);
  const kinds = r.corrections.map(c => c.kind);
  assert.equal(new Set(kinds).size, kinds.length, 'категорії не повторюються');
  assert.equal(kinds[0], 'clarity', 'перша корекція — та, що заважає зрозуміти');
});

test('покращена версія НЕ змінює зміст', async () => {
  const src = "This week I very worry about my daughter school. I not know what to do.";
  const r = await analyze(src);
  for (const w of ['week', 'daughter', 'school', 'know', 'do']) {
    assert.ok(r.improved.includes(w), `втрачено слово: ${w}`);
  }
  assert.ok(!/Bog|God|pray|молитв/i.test(r.improved), 'у розбір не додано нічого духовного');
});

test('правила застосовуються послідовно (залежні виправлення)', async () => {
  const r = await analyze('so now it out from my hands');
  assert.ok(r.improved.includes("it's out of my hands"), r.improved);
});

test('порожній і короткий ввід не ламають розбір', async () => {
  for (const s of ['', '   ', 'ok']) {
    const r = await analyze(s);
    assert.ok(Array.isArray(r.corrections));
    assert.equal(typeof r.improved, 'string');
  }
});

test('цільові конструкції рахуються лише коли вжиті правильно', () => {
  assert.deepEqual(detectTargets("I'm worried about money", L.targets), ['worried']);
  assert.deepEqual(detectTargets("I can't stop to think about it", L.targets), []);
  assert.deepEqual(detectTargets("I can't stop thinking about it", L.targets), ['cantstop']);
  assert.deepEqual(detectTargets("it's out of my hands", L.targets), ['outofhands']);
  assert.deepEqual(detectTargets('I have a cat', L.targets), []);
});

test('текст без відомих помилок не отримує вигаданих корекцій', async () => {
  const r = await analyze("I am fine. Everything is good today.");
  assert.equal(r.corrections.length, 0);
});

test('день 2: рамкове речення розбирається правильно', async () => {
  const { LESSON_DAY2 } = await import('../src/content/lesson-day2.js');
  const r = await llm.analyze({ transcript: LESSON_DAY2.demoTranscript, targets: LESSON_DAY2.targets });
  assert.ok(r.improved.includes('for a walk'), r.improved);
  assert.ok(r.improved.includes('It helps'), r.improved);
  assert.ok(r.improved.includes('anxious'), 'зміст збережено');
});

test('правильно зібране рамкове речення не отримує правок', async () => {
  const r = await analyze('When I feel anxious, I go for a walk. It helps a little.');
  assert.equal(r.corrections.length, 0);
});

test('правило третьої особи не ламає інфінітив', async () => {
  const r = await analyze('It helps me to go for a walk.');
  assert.equal(r.corrections.length, 0, JSON.stringify(r.corrections));
});

test('день 4: минулий час розбирається правильно', async () => {
  const { LESSON_DAY4 } = await import('../src/content/lesson-day4.js');
  const r = await llm.analyze({ transcript: LESSON_DAY4.demoTranscript, targets: LESSON_DAY4.targets });
  assert.ok(r.improved.includes("didn't have"), r.improved);
  assert.ok(r.improved.includes("now it's better"), r.improved);
  assert.ok(r.improved.includes('a very hard time'), r.improved);
  assert.deepEqual(r.usedTargets, ['gotthrough'], 'зараховуємо тільки те, що справді сказано');
});

test('день 5: will розбирається правильно', async () => {
  const { LESSON_DAY5 } = await import('../src/content/lesson-day5.js');
  const r = await llm.analyze({ transcript: LESSON_DAY5.demoTranscript, targets: LESSON_DAY5.targets });
  assert.ok(r.improved.includes('will call') && !r.improved.includes('will to call'), r.improved);
  assert.ok(r.improved.includes('he says no'), r.improved);
  assert.ok(r.usedTargets.includes('iwill') && r.usedTargets.includes('figureout'));
  assert.ok(!r.usedTargets.includes('evenif'), 'even if не звучало — не зараховуємо');
});

test('слоти корекцій добираються до трьох, а не пропадають', async () => {
  // три помилки однієї й тієї ж категорії все одно мають показатися
  const r = await analyze("I will to go. He say no. It help me.");
  assert.ok(r.corrections.length >= 2, JSON.stringify(r.corrections));
  assert.ok(r.corrections.length <= 3);
});

test('правило will не чіпає іменник після will', async () => {
  const r = await analyze('I will talk to him tomorrow.');
  assert.equal(r.corrections.length, 0);
});

test('розбір чесно позначений як демонстраційний', async () => {
  const r = await analyze('I not know');
  assert.equal(r.isDemo, true);
  assert.equal(r.provider, 'rule-based');
});

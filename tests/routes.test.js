import { test } from 'node:test';
import assert from 'node:assert/strict';
import { PASSAGES } from '../src/content/scripture.js';
import { ROUTES, ROUTE_ALONE, getRoute, nextRouteAfter, DEFAULT_ROUTE_ID } from '../src/content/routes.js';
import { BY_ROUTE, builtDays, getLesson, isDayUnlocked, nextDay, routeComplete } from '../src/content/lessons.js';
import { detectTargets, createMockLlm } from '../src/providers/mock.js';

const ALONE = 'alone-7';
const A = n => getLesson(n, ALONE);

test('маршрутів два, у кожного свої сім днів', () => {
  assert.equal(ROUTES.length, 2);
  assert.equal(new Set(ROUTES.map(r => r.id)).size, 2, 'id маршрутів унікальні');
  for (const r of ROUTES) {
    assert.equal(r.days.length, 7, r.id);
    assert.ok(r.title && r.blurb && r.promise, r.id);
    assert.deepEqual(r.days.map(d => d.day), [1, 2, 3, 4, 5, 6, 7], r.id);
  }
});

test('маршрут «Далеко від дому» написаний повністю', () => {
  assert.deepEqual(builtDays(ALONE), [1, 2, 3, 4, 5, 6, 7]);
  const ready = ROUTE_ALONE.days.filter(d => d.status === 'ready').map(d => d.day);
  assert.deepEqual(ready, [1, 2, 3, 4, 5, 6, 7], 'жоден день не лишився «готується»');
  for (const d of ROUTE_ALONE.days) {
    assert.ok(d.ref && d.ref !== '—', `день ${d.day}: посилання на текст`);
    assert.ok(d.title && d.subtitle && d.blurb, `день ${d.day}`);
  }
});

test('обіцянка на картці маршруту збігається з тим, що в ньому є', () => {
  // Карток днів рівно стільки ж, скільки написаних уроків. Якщо колись
  // з'явиться день у ROUTE, якого немає в BY_ROUTE, людина натисне на
  // порожнечу.
  for (const r of ROUTES) {
    const built = builtDays(r.id);
    const ready = r.days.filter(d => d.status === 'ready').map(d => d.day);
    assert.deepEqual(ready, built, `${r.id}: «готовий» і «написаний» мусять збігатися`);
  }
});

test('дні другого маршруту відкриваються послідовно й восьмого немає', () => {
  assert.equal(isDayUnlocked(1, [], false, ALONE), true);
  assert.equal(isDayUnlocked(2, [], false, ALONE), false);
  assert.equal(isDayUnlocked(7, [1, 2, 3, 4, 5, 6], false, ALONE), true);
  assert.equal(isDayUnlocked(7, [1, 2, 3, 4, 5], false, ALONE), false);
  assert.equal(isDayUnlocked(8, [1, 2, 3, 4, 5, 6, 7], true, ALONE), false);
  assert.equal(getLesson(8, ALONE), null);
  assert.equal(nextDay([1, 2, 3, 4, 5, 6], ALONE), 7);
  assert.equal(routeComplete([1, 2, 3, 4, 5, 6], ALONE), false);
  assert.equal(routeComplete([1, 2, 3, 4, 5, 6, 7], ALONE), true);
});

test('прогрес одного маршруту не рахується за інший', () => {
  assert.equal(routeComplete([1, 2, 3, 4, 5, 6, 7], DEFAULT_ROUTE_ID), true);
  assert.equal(routeComplete([1, 2, 3], ALONE), false);
  assert.notEqual(getLesson(3, ALONE), getLesson(3, DEFAULT_ROUTE_ID));
});

test('наступний маршрут пропонується лише непройдений', () => {
  const done = new Set();
  const isComplete = id => done.has(id);
  assert.equal(nextRouteAfter(DEFAULT_ROUTE_ID, isComplete).id, ALONE);
  done.add(ALONE);
  assert.equal(nextRouteAfter(DEFAULT_ROUTE_ID, isComplete), null, 'усі пройдені — пропонувати нічого');
  assert.equal(getRoute('такого немає').id, DEFAULT_ROUTE_ID, 'невідомий id не ламає застосунок');
});

test('уроки другого маршруту тієї самої форми, що й першого', () => {
  for (const n of builtDays(ALONE)) {
    const l = A(n);
    assert.equal(l.route, ALONE, `день ${n}`);
    assert.equal(l.day, n);
    assert.ok(Array.isArray(l.steps) && l.steps.length >= 8, `день ${n}`);
    assert.equal(l.steps[0], 'intro');
    assert.equal(l.steps[l.steps.length - 1], 'complete');
    assert.ok(l.steps.includes('consent'), `день ${n}: згода перед записом`);
    for (const m of ['christian', 'open']) {
      assert.ok(l.intro[m], `день ${n} / intro / ${m}`);
      assert.ok(l.practice[m] && l.practice[m].title && l.practice[m].body, `день ${n} / practice / ${m}`);
      assert.ok(l.step[m], `день ${n} / step / ${m}`);
    }
    assert.equal(l.targets.length, 3, `день ${n}: рівно три конструкції`);
    for (const t of l.targets) {
      assert.ok(t.id && t.en && t.uk && t.note && t.example, `день ${n} / ${t.id}`);
      assert.ok(Array.isArray(t.match) && t.match.length > 0, `день ${n} / ${t.id}`);
    }
  }
});

test('день 1 другого маршруту нічого не розпізнає', () => {
  const l = A(1);
  assert.equal(l.kind, 'shadowing');
  assert.equal(l.demoTranscript, undefined);
  for (const forbidden of ['record', 'transcript', 'corrections', 'improved', 'processing']) {
    assert.ok(!l.steps.includes(forbidden), `день 1 не повинен мати кроку ${forbidden}`);
  }
  assert.equal(A(2).kind, 'template');
  for (const n of [3, 4, 5, 6]) assert.equal(A(n).kind, 'open', `день ${n}`);
});

test('день 7 другого маршруту — монолог із порівнянням із днем 3', () => {
  const l = A(7);
  assert.equal(l.kind, 'monologue');
  assert.ok(/день 3|дні 3|днем 3/i.test(l.intro.open + l.practice.open.body + (l.voicePrompt.open || '')),
    'монолог має посилатися на день 3');
  assert.ok(/довг|півтори хвилини|60–90/.test(l.intro.open + l.voicePrompt.open));
});

test('день 6 звертається до іншої людини, а не до себе', () => {
  const l = A(6);
  assert.ok(/їй|людин|комусь|до неї/.test(l.voicePrompt.open + l.lifeQuestion));
  assert.ok(l.targets.some(t => /tell me|know how it feels/i.test(t.en)));
});

test('жоден уривок не використано двічі — ні в маршруті, ні між маршрутами', () => {
  const ids = [];
  for (const routeId of Object.keys(BY_ROUTE)) {
    for (const n of builtDays(routeId)) ids.push(getLesson(n, routeId).passageId);
  }
  assert.equal(new Set(ids).size, ids.length, 'повтор уривка: ' + ids.join(', '));
  for (const id of ids) assert.ok(PASSAGES[id], 'немає уривка ' + id);
});

test('демо-транскрипції не повторюються між маршрутами', () => {
  const texts = [];
  for (const routeId of Object.keys(BY_ROUTE)) {
    for (const n of builtDays(routeId)) {
      const t = getLesson(n, routeId).demoTranscript;
      if (t) texts.push(t);
    }
  }
  assert.equal(new Set(texts).size, texts.length);
});

test('усі уривки другого маршруту звірені з двома джерелами', () => {
  for (const n of builtDays(ALONE)) {
    const p = PASSAGES[A(n).passageId];
    assert.equal(p.uk.status, 'verified', A(n).passageId);
    assert.equal(p.en.status, 'verified', A(n).passageId);
    assert.ok(p.uk.verifiedAgainst.length >= 2, `${A(n).passageId}: українська потребує двох джерел`);
    assert.ok(p.en.verifiedAgainst.length >= 1, A(n).passageId);
    for (const side of ['uk', 'en']) {
      for (const v of p[side].verifiedAgainst) assert.ok(v.source && v.date, A(n).passageId);
    }
    assert.ok(p.context.body.length > 80 && p.context.caution, A(n).passageId + ': контекст і застереження');
  }
});

test('Псалом 41(42) показує обидві нумерації — розійшлися навіть номери віршів', () => {
  const p = PASSAGES['psa41.1-4'];
  assert.ok(p.refUk.includes('41') && p.refUk.includes('42'), p.refUk);
  assert.ok(/нумерац/i.test(p.uk.verifiedNote), 'розбіжність має бути пояснена');
});

test('патерн цілі ловить власний приклад цілі', () => {
  // Якщо приклад конструкції не розпізнається її ж патерном, то або патерн
  // хибний, або приклад не містить того, чого вчить день. І те, й те —
  // помилка в тексті, яку видно лише тут.
  for (const routeId of Object.keys(BY_ROUTE)) {
    for (const n of builtDays(routeId)) {
      const l = getLesson(n, routeId);
      for (const t of l.targets) {
        assert.ok(detectTargets(t.example, [t]).includes(t.id),
          `${routeId} день ${n}: приклад «${t.example}» не містить «${t.en}»`);
      }
    }
  }
});

test('патерни цілей не зберігають стан між викликами', () => {
  // Прапорець /g у регулярці робить .test() залежним від lastIndex: та сама
  // конструкція зараховується через раз. Мовчазна помилка, яку неможливо
  // відтворити вручну.
  for (const routeId of Object.keys(BY_ROUTE)) {
    for (const n of builtDays(routeId)) {
      for (const t of getLesson(n, routeId).targets) {
        for (const re of t.match) {
          assert.ok(!re.global, `${routeId} день ${n} / ${t.id}: патерн із прапорцем /g`);
          assert.equal(detectTargets(t.example, [t]).length, detectTargets(t.example, [t]).length);
        }
        assert.deepEqual(detectTargets(t.example, [t]), detectTargets(t.example, [t]));
      }
    }
  }
});

test('помилкова форма конструкції не зараховується як ужита', () => {
  // Найгірша помилка в продукті — метрика, яка хвалить за несказане.
  // Це саме ті помилки, що стоять у демо-транскрипції дня 6.
  const six = A(6).targets;
  assert.deepEqual(detectTargets('you can say me', six), [], '«say me» — це не «tell me»');
  assert.deepEqual(detectTargets('it need time', six), [], '«need time» — це не «takes time»');
  assert.deepEqual(detectTargets('I know how is it', six), [], 'зламаний порядок слів не зараховується');
  assert.deepEqual(detectTargets("If it gets hard, you can tell me. It takes time. I know how it feels.", six).sort(),
    ['iknowhow', 'ittakestime', 'youcantell']);
});

test('у демо дня 7 ужито всі три конструкції, а в дні 6 — жодної', () => {
  assert.equal(detectTargets(A(7).demoTranscript, A(7).targets).length, 3,
    'фінальний день має показати три конструкції в сирому тексті');
  assert.equal(detectTargets(A(6).demoTranscript, A(6).targets).length, 0,
    'демо дня 6 навмисно містить помилкові форми');
});

test('у демо останнього дня помилок на сто слів менше, ніж у демо дня 3', async () => {
  // Рахується густина, а не загальна кількість: сьомий день навмисно довший
  // (монолог на півтори хвилини проти тридцяти секунд), тож у довшому тексті
  // помилок у сумі буде більше навіть за помітного прогресу. Порівнювати
  // абсолютні числа тут означало б виміряти довжину тексту, а не поступ.
  const llm = createMockLlm();
  const rate = async (l) => {
    const r = await llm.analyze({ transcript: l.demoTranscript, targets: l.targets });
    return (r.totalFound / l.demoTranscript.split(/\s+/).length) * 100;
  };
  const d3 = await rate(A(3));
  const d7 = await rate(A(7));
  assert.ok(d7 < d3, `день 7: ${d7.toFixed(1)} на 100 слів, день 3: ${d3.toFixed(1)}`);
  assert.ok(A(7).demoTranscript.split(/\s+/).length > A(3).demoTranscript.split(/\s+/).length * 1.5,
    'фінальний монолог має бути помітно довшим за відповідь дня 3');
});

test('розбір не вигадує правок, які нічого не змінюють', async () => {
  // «used to talk → used to talk» людина бачила на екрані як знайдену
  // помилку. Правка, що не змінює тексту, не є правкою.
  const llm = createMockLlm();
  for (const routeId of Object.keys(BY_ROUTE)) {
    for (const n of builtDays(routeId)) {
      const l = getLesson(n, routeId);
      for (const text of [l.demoTranscript, l.sampleAnswer && l.sampleAnswer.text]) {
        if (!text) continue;
        const r = await llm.analyze({ transcript: text, targets: l.targets });
        for (const c of r.corrections) {
          assert.notEqual(c.before, c.after, `${routeId} день ${n}: «${c.before}» → те саме`);
        }
      }
    }
  }
});

test('розбір не псує правильних речень другого маршруту', async () => {
  // Пропущена правка нешкідлива; хибна псує саме те, чого людина прийшла
  // вчитися. Тому зразкові відповіді мусять пройти розбір без змін.
  const llm = createMockLlm();
  for (const n of builtDays(ALONE)) {
    const l = A(n);
    if (!l.sampleAnswer) continue;
    const r = await llm.analyze({ transcript: l.sampleAnswer.text, targets: l.targets });
    assert.equal(r.corrections.length, 0,
      `день ${n}: розбір чіпає правильний текст — ` +
      r.corrections.map(c => `${c.before} → ${c.after}`).join('; '));
  }
});

test('рамка дня 2 узгоджена сама з собою в кожному маршруті', () => {
  // Слоти в рамці й слоти в описі мусять збігатися один в один. Екран
  // малює групи варіантів саме за рамкою: слот, якого немає в T.slots,
  // впаде, а слот, який є, але не згаданий у рамці, просто не з'явиться —
  // і людина не зможе зібрати речення.
  for (const routeId of Object.keys(BY_ROUTE)) {
    const l = Object.values(BY_ROUTE[routeId]).find(x => x.kind === 'template');
    assert.ok(l, `${routeId}: у маршруті має бути день із рамкою`);
    const T = l.template;
    const inFrame = T.frame.filter(p => p.type === 'slot').map(p => p.id);
    assert.deepEqual(inFrame.slice().sort(), Object.keys(T.slots).sort(),
      `${routeId}: рамка й слоти розійшлися`);
    for (const id of inFrame) {
      assert.ok(T.slots[id].label, `${routeId} / ${id}: підпис`);
      assert.ok(T.slots[id].options.length >= 4, `${routeId} / ${id}: мало варіантів`);
      for (const o of T.slots[id].options) assert.ok(o.en && o.uk, `${routeId} / ${id}`);
    }
    // Перший варіант кожного слота має складатися в коректне речення.
    const sentence = T.frame.map(p => p.type === 'text' ? p.value : T.slots[p.id].options[0].en).join('');
    assert.ok(/^[A-Z].*\.$/.test(sentence), `${routeId}: «${sentence}»`);
  }
});

test('демо-розпізнавання бере текст того маршруту, що відкритий', async () => {
  // Демо-текст підбирався тільки за номером дня, тож у другому маршруті
  // людині показувало відповідь із першого: чужа історія, видана за її
  // власну. Номер дня однаковий в обох маршрутах — цього замало.
  const { createMockStt } = await import('../src/providers/mock.js');
  const stt = createMockStt((day, routeId) => {
    const l = getLesson(day, routeId);
    return (l && l.demoTranscript) || '';
  });
  for (const routeId of Object.keys(BY_ROUTE)) {
    for (const n of builtDays(routeId)) {
      const l = getLesson(n, routeId);
      if (!l.demoTranscript) continue;
      const r = await stt.transcribe(null, { day: n, routeId });
      assert.equal(r.text, l.demoTranscript, `${routeId} день ${n}`);
      assert.equal(r.isDemo, true, 'демо-режим має бути позначений як демо');
    }
  }
});

// Перевірки бекенд-проксі. Мережа підставна: жодного справжнього запиту
// в OpenAI, жодних витрат. Перевіряється те, що має триматися незалежно
// від того, що поверне модель.
import test from 'node:test';
import assert from 'node:assert/strict';
import { buildMessages, parseAnalysis, extractText, buildRequestBody } from '../worker/prompt.js';

const { default: worker } = await import('../worker/index.js');

const ENV = { OPENAI_API_KEY: 'sk-підставний', ASSETS: { fetch: () => new Response('site') } };
const post = (path, body, headers = {}) =>
  new Request('https://example.com' + path, {
    method: 'POST',
    headers: { 'content-type': 'application/json', ...headers },
    body: JSON.stringify(body),
  });

/** Підставляє відповідь OpenAI на час одного виклику. */
async function withUpstream(reply, fn) {
  const real = globalThis.fetch;
  globalThis.fetch = async () => reply();
  const quiet = console.error; console.error = () => {};
  try { return await fn(); }
  finally { globalThis.fetch = real; console.error = quiet; }
}
// Підставна відповідь у формі /v1/responses — саме її тепер питає Worker.
const llmReply = (content) => () => new Response(JSON.stringify({
  output: [{ type: 'message', content: [{ type: 'output_text', text: content }] }],
}), { status: 200, headers: { 'content-type': 'application/json' } });

test('без ключа сервер каже про це прямо, а не вдає розбір', async () => {
  const res = await worker.fetch(post('/api/analyze', { transcript: 'I worried.' }), { ...ENV, OPENAI_API_KEY: '' });
  assert.equal(res.status, 503);
  assert.equal((await res.json()).error, 'no_key');
});

test('порожній текст не йде в модель', async () => {
  const res = await worker.fetch(post('/api/analyze', { transcript: '   ' }), ENV);
  assert.equal(res.status, 400);
});

test('задовгий текст відсікається до звернення в OpenAI', async () => {
  const res = await worker.fetch(post('/api/analyze', { transcript: 'a'.repeat(2001) }), ENV);
  assert.equal(res.status, 413);
});

test('запит із чужого сайту відхиляється', async () => {
  const res = await worker.fetch(post('/api/analyze', { transcript: 'hi' }, { origin: 'https://evil.example' }), ENV);
  assert.equal(res.status, 403);
});

test('нормальний розбір проходить і ріжеться до трьох правок', async () => {
  const many = Array.from({ length: 6 }, (_, i) => ({ kind: 'grammar', before: 'a' + i, after: 'b' + i, why: 'бо так' }));
  const res = await withUpstream(llmReply(JSON.stringify({
    corrections: many, improved: 'I am worried about my father.', usedTargets: ['worried'], totalFound: 6,
  })), () => worker.fetch(post('/api/analyze', {
    transcript: 'I worried about my father.', targets: [{ id: 'worried', en: "I'm worried about…" }],
  }), ENV));
  assert.equal(res.status, 200);
  const j = await res.json();
  assert.equal(j.corrections.length, 3, 'максимум три правки — жорстко на сервері');
  assert.equal(j.totalFound, 6, 'решта рахується, але не показується');
  assert.deepEqual(j.usedTargets, ['worried']);
});

test('вигадана моделлю конструкція не зараховується', async () => {
  const res = await withUpstream(llmReply(JSON.stringify({
    corrections: [], improved: 'I am fine.', usedTargets: ['worried', 'такого-немає'], totalFound: 0,
  })), () => worker.fetch(post('/api/analyze', {
    transcript: 'I am fine.', targets: [{ id: 'worried', en: "I'm worried about…" }],
  }), ENV));
  assert.deepEqual((await res.json()).usedTargets, ['worried']);
});

test('проповідь у відповіді моделі блокується на виході', async () => {
  const res = await withUpstream(llmReply(JSON.stringify({
    corrections: [], improved: 'God is telling you to be brave.', usedTargets: [], totalFound: 0,
  })), () => worker.fetch(post('/api/analyze', { transcript: 'I am scared.', targets: [] }), ENV));
  assert.equal(res.status, 422);
  assert.equal((await res.json()).error, 'blocked');
});

test('сміття замість JSON — це помилка, а не тихий фолбек', async () => {
  const res = await withUpstream(llmReply('вибач, не можу'),
    () => worker.fetch(post('/api/analyze', { transcript: 'I am scared.', targets: [] }), ENV));
  assert.equal(res.status, 502);
});

test('падіння OpenAI не розкриває клієнтові подробиць', async () => {
  const res = await withUpstream(
    () => new Response('{"error":{"message":"Incorrect API key sk-abc123"}}', { status: 401 }),
    () => worker.fetch(post('/api/analyze', { transcript: 'hi', targets: [] }), ENV));
  const body = await res.text();
  assert.equal(res.status, 502);
  assert.ok(!body.includes('sk-abc'), 'ключ не має просочитися у відповідь');
  assert.ok(!body.includes('Incorrect API key'), 'подробиці постачальника назовні не йдуть');
});

test('усе, що не /api/, віддається як статичний сайт', async () => {
  const res = await worker.fetch(new Request('https://example.com/index.html'), ENV);
  assert.equal(await res.text(), 'site');
});

test('промпт забороняє духовні коментарі й вимагає рахувати сире мовлення', async () => {
  const sys = buildMessages({ transcript: 'x', targets: [] })[0].content;
  assert.match(sys, /Бога, віру, молитву/);
  assert.match(sys, /СИРОМУ тексті/);
  assert.match(sys, /Не більше трьох правок/);
});

test('parseAnalysis вимагає improved і не вигадує його', () => {
  assert.throws(() => parseAnalysis({ corrections: [], improved: '' }, { transcript: 'x' }));
});

test('невідома модель називається прямо, а не ховається за «щось пішло не так»', async () => {
  const res = await withUpstream(
    () => new Response('{"error":{"message":"The model does not exist"}}', { status: 404 }),
    () => worker.fetch(post('/api/analyze', { transcript: 'hi', targets: [] }), ENV));
  assert.equal(res.status, 502);
  assert.equal((await res.json()).error, 'bad_model');
});

test('назву моделі можна змінити змінною середовища, не чіпаючи код', async () => {
  let sent = null;
  const real = globalThis.fetch;
  globalThis.fetch = async (_url, init) => { sent = JSON.parse(init.body); return llmReply(JSON.stringify({ corrections: [], improved: 'ok.', usedTargets: [], totalFound: 0 }))(); };
  try {
    await worker.fetch(post('/api/analyze', { transcript: 'hi', targets: [] }), { ...ENV, LLM_MODEL: 'зовсім-інша-модель' });
  } finally { globalThis.fetch = real; }
  assert.equal(sent.model, 'зовсім-інша-модель');
});

test('невідома адреса розпізнавання називається прямо', async () => {
  const fd = new FormData();
  fd.append('audio', new Blob(['x'], { type: 'audio/webm' }), 'a.webm');
  const req = new Request('https://example.com/api/stt', { method: 'POST', body: fd });
  const res = await withUpstream(() => new Response('{}', { status: 404 }), () => worker.fetch(req, ENV));
  assert.equal((await res.json()).error, 'bad_stt');
});

test('відмова в дозволі на розпізнавання не плутається зі збоєм', async () => {
  const fd = new FormData();
  fd.append('audio', new Blob(['x'], { type: 'audio/webm' }), 'a.webm');
  const req = new Request('https://example.com/api/stt', { method: 'POST', body: fd });
  const res = await withUpstream(() => new Response('{}', { status: 403 }), () => worker.fetch(req, ENV));
  assert.equal((await res.json()).error, 'stt_forbidden');
});

/* Два інтерфейси OpenAI: старий /chat/completions і новіший /responses.
   Який із них доступний — залежить від акаунта, тож Worker має розуміти
   обидва, а не вгадувати один. */

test('відповідь у формі /responses читається', () => {
  assert.equal(extractText({ output: [{ content: [{ text: 'привіт' }] }] }), 'привіт');
  assert.equal(extractText({ output_text: 'привіт' }), 'привіт');
});

test('відповідь у старій формі /chat/completions теж читається', () => {
  assert.equal(extractText({ choices: [{ message: { content: 'привіт' } }] }), 'привіт');
});

test('незнайома форма відповіді дає порожнє, а не викидає виняток', () => {
  assert.equal(extractText({ щось: 'інше' }), '');
  assert.equal(extractText(null), '');
});

test('тіло запиту добирається за адресою', () => {
  const msgs = [{ role: 'system', content: 'СИС' }, { role: 'user', content: 'ЮЗЕР' }];
  const r = buildRequestBody({ path: '/responses', model: 'm', messages: msgs });
  assert.equal(r.instructions, 'СИС');
  assert.equal(r.input, 'ЮЗЕР');
  assert.ok(!r.messages, '/responses не приймає messages');

  const c = buildRequestBody({ path: '/chat/completions', model: 'm', messages: msgs });
  assert.equal(c.messages.length, 2);
  assert.ok(!c.instructions, '/chat/completions не приймає instructions');
});

test('порожня відповідь моделі — це помилка, а не порожній розбір', async () => {
  const res = await withUpstream(
    () => new Response(JSON.stringify({ output: [] }), { status: 200 }),
    () => worker.fetch(post('/api/analyze', { transcript: 'hi', targets: [] }), ENV));
  assert.equal(res.status, 502);
});

test('старий інтерфейс працює, якщо вказати його явно', async () => {
  const chatReply = () => new Response(JSON.stringify({
    choices: [{ message: { content: JSON.stringify({ corrections: [], improved: 'I am fine.', usedTargets: [], totalFound: 0 }) } }],
  }), { status: 200 });
  const res = await withUpstream(chatReply, () => worker.fetch(
    post('/api/analyze', { transcript: 'I am fine.', targets: [] }),
    { ...ENV, LLM_PATH: '/chat/completions' }));
  assert.equal(res.status, 200);
  assert.equal((await res.json()).improved, 'I am fine.');
});

test('промпт вимагає короткий фрагмент правки, а не ціле речення', () => {
  const sys = buildMessages({ transcript: 'x', targets: [] })[0].content;
  assert.match(sys, /НАЙКОРОТШИЙ фрагмент/);
  assert.match(sys, /Не ціле речення/);
});

/* ───────── аналітика ─────────
   Найважливіше тут не «чи записалася подія», а чи НЕ МОЖЕ в базу
   потрапити текст відповіді. Клієнт підмінити може будь-хто, тож
   перевіряється саме серверний фільтр. */

const { sanitizeEvent } = await import('../worker/index.js');

test('текст відповіді не проходить у подію навіть якщо його підсунути', () => {
  const ev = sanitizeEvent({
    name: 'lesson_completed', day: 3, at: 1,
    transcript: 'I am worried about my owner, he is in hospital',
    text: 'щось особисте', name_of_user: 'Олег', answer: 'приватне',
  });
  assert.deepEqual(Object.keys(ev.props), ['day'], 'дозволено тільки поля з білого списку');
  assert.equal(JSON.stringify(ev).includes('hospital'), false);
  assert.equal(JSON.stringify(ev).includes('Олег'), false);
});

test('довгий рядок у дозволеному полі теж відкидається', () => {
  const ev = sanitizeEvent({ name: 'lesson_started', reason: 'ц'.repeat(41), at: 1 });
  assert.equal(ev.props.reason, undefined);
  const ok = sanitizeEvent({ name: 'lesson_started', reason: 'коротко', at: 1 });
  assert.equal(ok.props.reason, 'коротко');
});

test('невідома назва події відкидається цілком', () => {
  assert.equal(sanitizeEvent({ name: 'вигадана_подія', at: 1 }), null);
  assert.equal(sanitizeEvent(null), null);
  assert.equal(sanitizeEvent('рядок'), null);
});

test('вкладений об\'єкт не просочується в props', () => {
  const ev = sanitizeEvent({ name: 'lesson_completed', day: { hidden: 'текст' }, at: 1 });
  assert.equal(typeof ev.props.day, 'undefined');
});

test('статистика закрита ключем', async () => {
  const withDb = { ...ENV, DB: {}, STATS_KEY: 'секрет' };
  const noKey = await worker.fetch(new Request('https://example.com/stats'), withDb);
  assert.equal(noKey.status, 401);
  const wrong = await worker.fetch(new Request('https://example.com/stats?key=не-той'), withDb);
  assert.equal(wrong.status, 401);
});

test('без сховища подій сервер каже про це прямо', async () => {
  const res = await worker.fetch(post('/api/events', { device: 'd1', events: [] }), ENV);
  assert.equal(res.status, 503);
  assert.equal((await res.json()).error, 'no_db');
});

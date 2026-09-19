// Бекенд-проксі на Cloudflare Workers.
//
// Єдина причина, чому він існує: ключ OpenAI не можна класти в браузер.
// Тут ключ читається зі сховища секретів Cloudflare (env.OPENAI_API_KEY) і
// ніколи не потрапляє ні у відповідь, ні в лог, ні в код.
//
// Цей же Worker роздає статичний сайт: усе, що не починається з /api/,
// обслуговують assets із wrangler.jsonc. Тому фронтенд і бекенд на одному
// домені — без CORS і без окремого сервера.

import { buildMessages, parseAnalysis, extractText, buildRequestBody } from './prompt.js';
import { filterAiOutput } from '../src/lib/safety.js';

const OPENAI = 'https://api.openai.com/v1';

// Моделі задаються змінними середовища, щоб їх можна було змінити в
// інтерфейсі Cloudflare, не чіпаючи код і не чекаючи на нову збірку.
//
// Чому це важливо саме тут: назви моделей змінюються швидше, ніж
// оновлюються мої знання. Значення за замовчуванням узяті зі списку
// моделей у самому акаунті власника (19.09.2026). Якщо OpenAI їх
// перейменує — вписати нову назву буде питанням однієї хвилини.
const DEFAULT_STT_MODEL = 'whisper-1';
const DEFAULT_LLM_MODEL = 'gpt-5.4-mini';

// Шлях до розпізнавання теж винесено в env. Причина конкретна: у списку
// дозволів акаунта (19.09.2026) є рядок для /v1/audio/speech, але немає
// для /v1/audio/transcriptions. Тобто адреса могла змінитися відтоді, як
// я її вивчив. Якщо так — це правиться змінною STT_PATH в інтерфейсі
// Cloudflare, без зміни коду й без нової збірки.
const DEFAULT_STT_PATH = '/audio/transcriptions';

// За замовчуванням — новіший /responses: у списку дозволів акаунта
// (19.09.2026) рядок Chat completions неактивний, а Responses доступний.
// Обидва інтерфейси підтримані, форма запиту й розбір відповіді
// добираються за шляхом. Якщо вгадано неправильно — правиться змінною
// LLM_PATH, без коду й без нової збірки.
const DEFAULT_LLM_PATH = '/responses';

// Межі — це не оптимізація, а захист гаманця. Ендпоінт публічний, і за
// кожен запит платить власник ключа. Місячний ліміт в OpenAI лишається
// головним запобіжником, а це — перший бар'єр.
const MAX_AUDIO_BYTES = 2 * 1024 * 1024;   // ~60 секунд mp4/webm
const MAX_TRANSCRIPT_CHARS = 2000;

const json = (obj, status = 200) =>
  new Response(JSON.stringify(obj), {
    status, headers: { 'content-type': 'application/json; charset=utf-8' },
  });

/** Помилка для клієнта: без подробиць від постачальника й без тексту користувача. */
const fail = (code, message, status = 400) => json({ error: code, message }, status);

/** Запити приймаються лише зі свого ж сайту. Не панацея, але відсікає просте зловживання. */
function sameOrigin(request) {
  const origin = request.headers.get('origin');
  if (!origin) return true;                       // прямий запит без Origin — напр. з самої сторінки
  try { return new URL(origin).host === new URL(request.url).host; }
  catch { return false; }
}

async function handleStt(request, env) {
  if (!env.OPENAI_API_KEY) return fail('no_key', 'Ключ не налаштований на сервері.', 503);

  const form = await request.formData();
  const audio = form.get('audio');
  if (!audio || typeof audio === 'string') return fail('no_audio', 'Аудіо не надійшло.');
  if (audio.size > MAX_AUDIO_BYTES) return fail('too_long', 'Запис задовгий.', 413);

  const out = new FormData();
  out.append('file', audio, 'answer.webm');
  out.append('model', env.STT_MODEL || DEFAULT_STT_MODEL);
  out.append('language', String(form.get('lang') || 'en'));

  const res = await fetch(`${OPENAI}${env.STT_PATH || DEFAULT_STT_PATH}`, {
    method: 'POST',
    headers: { authorization: `Bearer ${env.OPENAI_API_KEY}` },
    body: out,
  });
  if (!res.ok) {
    // Статус — так, тіло відповіді — ні: у ньому бувають фрагменти запиту.
    console.error('stt_upstream_failed', res.status);
    if (res.status === 404) {
      console.error('stt_endpoint_unknown', env.STT_PATH || DEFAULT_STT_PATH, env.STT_MODEL || DEFAULT_STT_MODEL);
      return fail('bad_stt', 'Розпізнавання не знайдене — перевірте адресу й назву моделі в налаштуваннях.', 502);
    }
    if (res.status === 401 || res.status === 403) {
      console.error('stt_forbidden', res.status);
      return fail('stt_forbidden', 'Ключ не має дозволу на розпізнавання мовлення.', 502);
    }
    return fail('stt_failed', 'Не вдалося розпізнати запис.', 502);
  }
  const data = await res.json();
  const text = String(data.text || '').trim();
  if (!text) return fail('stt_empty', 'У записі не почуто мовлення.', 422);

  return json({ text, confidence: 'unknown' });
}

async function handleAnalyze(request, env) {
  if (!env.OPENAI_API_KEY) return fail('no_key', 'Ключ не налаштований на сервері.', 503);

  const body = await request.json().catch(() => null);
  const transcript = String((body && body.transcript) || '').trim();
  if (!transcript) return fail('no_text', 'Немає тексту для розбору.');
  if (transcript.length > MAX_TRANSCRIPT_CHARS) return fail('too_long', 'Текст задовгий.', 413);

  const targets = Array.isArray(body.targets) ? body.targets : [];
  const messages = buildMessages({ transcript, targets, level: body.level || 'A2-B1' });

  const path = env.LLM_PATH || DEFAULT_LLM_PATH;
  const res = await fetch(`${OPENAI}${path}`, {
    method: 'POST',
    headers: {
      authorization: `Bearer ${env.OPENAI_API_KEY}`,
      'content-type': 'application/json',
    },
    body: JSON.stringify(buildRequestBody({
      path,
      model: env.LLM_MODEL || DEFAULT_LLM_MODEL,
      messages,
    })),
  });
  if (!res.ok) {
    console.error('llm_upstream_failed', res.status);
    // 404 від OpenAI на цьому шляху майже завжди означає одне: моделі з
    // такою назвою немає. Це помилка налаштування, а не збій, і вона має
    // читатися в логах одразу, без здогадок.
    if (res.status === 404) {
      console.error('llm_endpoint_or_model_unknown', path, env.LLM_MODEL || DEFAULT_LLM_MODEL);
      return fail('bad_model', 'Модель або адреса розбору не знайдені — перевірте LLM_PATH і LLM_MODEL.', 502);
    }
    if (res.status === 401 || res.status === 403) {
      console.error('llm_forbidden', res.status, path);
      return fail('llm_forbidden', 'Ключ не має дозволу на цей спосіб розбору.', 502);
    }
    return fail('analyze_failed', 'Розбір не вдався.', 502);
  }

  const data = await res.json();
  const content = extractText(data);
  if (!content) {
    console.error('llm_empty_response', path);
    return fail('analyze_failed', 'Розбір не вдався.', 502);
  }

  let parsed;
  try {
    parsed = parseAnalysis(content, { transcript, targets });
  } catch (err) {
    console.error('llm_bad_shape', (err && err.message) || 'unknown');
    return fail('analyze_failed', 'Розбір не вдався.', 502);
  }

  // Перевірка на ВИХОДІ, а не прохання в промпті. Те, що не пройшло, не
  // показується взагалі — ні користувачеві, ні в обхід.
  const safe = filterAiOutput(parsed.improved);
  if (!safe.ok) {
    console.error('llm_blocked', safe.violations.map(v => v.why).join('; '));
    return fail('blocked', 'Відповідь помічника не пройшла перевірку безпеки.', 422);
  }

  return json({
    corrections: parsed.corrections,
    improved: parsed.improved,
    usedTargets: parsed.usedTargets,
    totalFound: parsed.totalFound,
  });
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (!url.pathname.startsWith('/api/')) {
      // Усе інше — статичний сайт. assets налаштовані у wrangler.jsonc.
      return env.ASSETS.fetch(request);
    }
    if (request.method !== 'POST') return fail('method', 'Тільки POST.', 405);
    if (!sameOrigin(request)) return fail('origin', 'Запит з чужого джерела.', 403);

    try {
      if (url.pathname === '/api/stt') return await handleStt(request, env);
      if (url.pathname === '/api/analyze') return await handleAnalyze(request, env);
      return fail('not_found', 'Немає такого методу.', 404);
    } catch (err) {
      // Текст користувача в лог не пишеться ніколи — тільки тип помилки.
      console.error('worker_error', (err && err.name) || 'unknown');
      return fail('server', 'Внутрішня помилка.', 500);
    }
  },
};

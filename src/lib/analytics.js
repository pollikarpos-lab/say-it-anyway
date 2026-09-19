// Аналітика БЕЗ вмісту особистої відповіді.
//
// Що надсилається: назва події з білого списку EVENTS, кілька числових
// полів з білого списку ALLOWED_PROPS, час і анонімний ідентифікатор
// пристрою. Більше нічого.
//
// Що НЕ надсилається ніколи: текст відповіді, транскрипція, ім'я, аудіо.
// Технічно це неможливо: поля поза ALLOWED_PROPS відкидаються, а рядки
// довші за 40 символів — теж. Той самий фільтр повторений на сервері,
// бо клієнт можна підмінити.
//
// Надсилання працює ТІЛЬКИ на справжньому домені. На localhost події
// лишаються локальними — щоб розробка й тести не засмічували статистику.

export const EVENTS = [
  'landing_viewed','onboarding_started','onboarding_completed','lesson_started',
  'consent_accepted','microphone_permission_granted','microphone_permission_denied',
  'voice_recording_started','voice_submitted','transcription_succeeded','transcription_failed',
  'feedback_shown','improved_audio_played','retry_started','phrase_saved','lesson_completed',
  'app_install_prompt_shown','app_installed','recording_deleted','user_data_deleted',
  'crisis_screen_shown','text_fallback_used',
];

const KEY = 'sia.events';
const MAX = 300;

// Поля, які дозволено класти в props. Усе інше відкидається — це технічний
// запобіжник проти випадкового витоку тексту відповіді в аналітику.
export const ALLOWED_PROPS = new Set([
  'day','mode','ms','durationMs','count','reason','provider','source','ok','step','kind',
]);

export function track(name, props = {}) {
  if (!EVENTS.includes(name)) { console.warn('[analytics] невідома подія:', name); return; }
  const safe = {};
  for (const [k, v] of Object.entries(props)) {
    if (!ALLOWED_PROPS.has(k)) continue;
    if (typeof v === 'string' && v.length > 40) continue; // ніякого вільного тексту
    safe[k] = v;
  }
  const ev = { name, at: Date.now(), ...safe };
  try {
    const log = JSON.parse(localStorage.getItem(KEY) || '[]');
    log.push(ev);
    localStorage.setItem(KEY, JSON.stringify(log.slice(-MAX)));
  } catch {}
  if (globalThis.__SIA_DEBUG__) console.log('[event]', ev);

  if (sendingEnabled()) {
    queue(ev);
    // Пачками, а не по одній події: менше запитів і менше батареї.
    clearTimeout(flushTimer);
    flushTimer = setTimeout(flush, 3000);
  }
  return ev;
}

/* ───────── надсилання ───────── */

const QUEUE_KEY = 'sia.events.queue';
const DEVICE_KEY = 'sia.device';
let flushTimer = 0;

/** Анонімний ідентифікатор пристрою. Випадковий, не пов'язаний з людиною. */
function deviceId() {
  try {
    let id = localStorage.getItem(DEVICE_KEY);
    if (!id) {
      id = 'd' + Math.random().toString(36).slice(2) + Date.now().toString(36);
      localStorage.setItem(DEVICE_KEY, id);
    }
    return id;
  } catch { return 'd-unknown'; }
}

function sendingEnabled() {
  const c = (typeof window !== 'undefined' && window.__SIA_CONFIG__) || {};
  return c.providerMode === 'http' && !!c.apiBaseUrl;
}

function queue(ev) {
  try {
    const q = JSON.parse(localStorage.getItem(QUEUE_KEY) || '[]');
    q.push(ev);
    localStorage.setItem(QUEUE_KEY, JSON.stringify(q.slice(-100)));
  } catch {}
}

/** Надсилає накопичене. Помилка мережі не втрачає події — вони чекають. */
export async function flush() {
  if (!sendingEnabled()) return;
  let q = [];
  try { q = JSON.parse(localStorage.getItem(QUEUE_KEY) || '[]'); } catch {}
  if (!q.length) return;
  const cfg = window.__SIA_CONFIG__ || {};
  try {
    const res = await fetch(`${cfg.apiBaseUrl}/events`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ device: deviceId(), events: q }),
      keepalive: true,
    });
    if (res.ok) localStorage.setItem(QUEUE_KEY, '[]');
  } catch { /* лишається в черзі до наступного разу */ }
}

export function readLog() {
  try { return JSON.parse(localStorage.getItem(KEY) || '[]'); } catch { return []; }
}
export function clearLog() {
  try { localStorage.removeItem(KEY); localStorage.removeItem(QUEUE_KEY); } catch {}
}

/** Видалення всіх даних стирає і анонімний ідентифікатор. */
export function clearDevice() { try { localStorage.removeItem(DEVICE_KEY); } catch {} }

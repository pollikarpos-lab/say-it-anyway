// Аналітика БЕЗ вмісту особистої відповіді.
// У цій версії події лише пишуться в localStorage і в console — жодної
// зовнішньої відправки не налаштовано і не заявляється.

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
const ALLOWED_PROPS = new Set([
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
  return ev;
}

export function readLog() {
  try { return JSON.parse(localStorage.getItem(KEY) || '[]'); } catch { return []; }
}
export function clearLog() { try { localStorage.removeItem(KEY); } catch {} }

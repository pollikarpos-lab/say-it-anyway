// Збереження прогресу. localStorage може кинути виняток (приватний режим,
// заблоковані site data) — тому КОЖЕН доступ у try/catch, і застосунок
// коректно працює навіть коли сховище недоступне (просто не пам'ятає).

const KEY = 'sia.v1';

/** @typedef {object} Progress */
export const DEFAULT_STATE = {
  version: 1,
  onboarded: false,
  name: '',
  region: '',
  comfort: '',        // speak comfort level
  mode: '',           // 'christian' | 'open'
  reminder: '',
  activeDay: 1,       // у MVP реалізовані дні 1–3
  unlockAll: false,   // показовий режим: відкрити всі готові дні
  completedDays: [],
  savedPhrases: [],   // [{id, text, day, at}]
  lessons: {},        // { '3': { completed, retakes, speechMs, usedTargets:[], transcriptSaved:bool } }
  consent: { voice: false, at: null },
  privacy: { keepAudio: false },  // за замовчуванням аудіо НЕ зберігається
  recordings: {},     // { '3': {id, createdAt, durationMs} }  — метадані; саме аудіо тільки в пам'яті
  createdAt: null,
};

let memoryFallback = null;
let storageWorks = null;

export function storageAvailable() {
  if (storageWorks !== null) return storageWorks;
  try {
    const t = '__sia_probe__';
    localStorage.setItem(t, '1');
    localStorage.removeItem(t);
    storageWorks = true;
  } catch { storageWorks = false; }
  return storageWorks;
}

export function load() {
  if (!storageAvailable()) return memoryFallback ? clone(memoryFallback) : fresh();
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return fresh();
    const parsed = JSON.parse(raw);
    if (!parsed || parsed.version !== 1) return fresh();
    return { ...fresh(), ...parsed };
  } catch {
    return fresh();
  }
}

export function save(state) {
  memoryFallback = clone(state);
  if (!storageAvailable()) return false;
  try {
    localStorage.setItem(KEY, JSON.stringify(state));
    return true;
  } catch {
    return false;
  }
}

/** Повне видалення всіх даних користувача. */
export function wipe() {
  memoryFallback = null;
  try { localStorage.removeItem(KEY); } catch {}
  try { localStorage.removeItem('sia.events'); } catch {}
  return true;
}

function fresh() { const s = clone(DEFAULT_STATE); s.createdAt = new Date().toISOString(); return s; }
function clone(o) { return JSON.parse(JSON.stringify(o)); }

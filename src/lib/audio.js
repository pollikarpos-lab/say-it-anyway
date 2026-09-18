// Запис і відтворення голосу в браузері. Жодних залежностей.
// Аудіо живе тільки в пам'яті вкладки (Blob). За замовчуванням воно
// видаляється одразу після транскрипції — див. privacy.keepAudio.

export const MAX_RECORDING_MS = 60_000;

export function micSupported() {
  return !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia &&
            typeof window.MediaRecorder !== 'undefined');
}

/** Причини відмови, які треба показувати по-різному. */
export const MIC_ERRORS = {
  UNSUPPORTED: 'unsupported',   // немає API (старий браузер / iframe без дозволу)
  DENIED: 'denied',             // користувач або політика заборонили
  NOTFOUND: 'notfound',         // немає мікрофона
  OTHER: 'other',
};

export function classifyMicError(err) {
  if (!err) return MIC_ERRORS.OTHER;
  const n = err.name || '';
  if (n === 'NotAllowedError' || n === 'SecurityError' || n === 'PermissionDeniedError') return MIC_ERRORS.DENIED;
  if (n === 'NotFoundError' || n === 'DevicesNotFoundError' || n === 'OverconstrainedError') return MIC_ERRORS.NOTFOUND;
  if (n === 'NotSupportedError' || n === 'TypeError') return MIC_ERRORS.UNSUPPORTED;
  return MIC_ERRORS.OTHER;
}

function pickMime() {
  if (typeof MediaRecorder === 'undefined' || !MediaRecorder.isTypeSupported) return '';
  const candidates = ['audio/webm;codecs=opus', 'audio/webm', 'audio/mp4', 'audio/ogg;codecs=opus'];
  for (const c of candidates) { if (MediaRecorder.isTypeSupported(c)) return c; }
  return '';
}

/**
 * Створює рекордер. onLevel(0..1) — для хвилі, onTick(ms) — для таймера.
 */
export function createRecorder({ onLevel, onTick, onAutoStop } = {}) {
  let stream = null, rec = null, chunks = [], startedAt = 0, raf = 0, timer = 0;
  let ctx = null, analyser = null, data = null, stopped = false;

  async function start() {
    if (!micSupported()) { const e = new Error('unsupported'); e.name = 'NotSupportedError'; throw e; }
    stream = await navigator.mediaDevices.getUserMedia({
      audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true },
    });
    const mime = pickMime();
    rec = new MediaRecorder(stream, mime ? { mimeType: mime } : undefined);
    chunks = []; stopped = false;
    rec.ondataavailable = (e) => { if (e.data && e.data.size) chunks.push(e.data); };
    rec.start(200);
    startedAt = Date.now();

    // рівень сигналу для хвилі
    try {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (AC) {
        ctx = new AC();
        const src = ctx.createMediaStreamSource(stream);
        analyser = ctx.createAnalyser();
        analyser.fftSize = 512;
        data = new Uint8Array(analyser.frequencyBinCount);
        src.connect(analyser);
        const loop = () => {
          if (!analyser) return;
          analyser.getByteTimeDomainData(data);
          let sum = 0;
          for (let i = 0; i < data.length; i++) { const v = (data[i] - 128) / 128; sum += v * v; }
          onLevel && onLevel(Math.min(1, Math.sqrt(sum / data.length) * 3.2));
          raf = requestAnimationFrame(loop);
        };
        loop();
      }
    } catch { /* хвиля — прикраса, без неї запис працює */ }

    timer = setInterval(() => {
      const ms = Date.now() - startedAt;
      onTick && onTick(ms);
      if (ms >= MAX_RECORDING_MS && !stopped) { stopped = true; onAutoStop && onAutoStop(); }
    }, 100);
  }

  function stop() {
    return new Promise((resolve) => {
      if (!rec) return resolve(null);
      const finish = () => {
        cleanup();
        const type = rec.mimeType || 'audio/webm';
        const blob = new Blob(chunks, { type });
        resolve({ blob, durationMs: Math.min(Date.now() - startedAt, MAX_RECORDING_MS), mime: type });
      };
      if (rec.state === 'inactive') finish();
      else { rec.onstop = finish; try { rec.stop(); } catch { finish(); } }
    });
  }

  function cleanup() {
    clearInterval(timer); timer = 0;
    cancelAnimationFrame(raf); raf = 0;
    analyser = null; data = null;
    if (ctx) { try { ctx.close(); } catch {} ctx = null; }
    if (stream) { stream.getTracks().forEach(t => { try { t.stop(); } catch {} }); stream = null; }
  }

  return { start, stop, cleanup, get elapsed() { return startedAt ? Date.now() - startedAt : 0; } };
}

/** Простий плеєр для Blob або URL, з колбеком прогресу. */
export function createPlayer() {
  let el = null, url = null;
  function load(src) {
    unload();
    el = new Audio();
    if (src instanceof Blob) { url = URL.createObjectURL(src); el.src = url; }
    else el.src = src;
    el.preload = 'metadata';
    return el;
  }
  function unload() {
    if (el) { try { el.pause(); } catch {} el = null; }
    if (url) { URL.revokeObjectURL(url); url = null; }
  }
  return { load, unload, get el() { return el; } };
}

export function fmtTime(ms) {
  const s = Math.max(0, Math.round(ms / 1000));
  return `${String(Math.floor(s / 60)).padStart(1, '0')}:${String(s % 60).padStart(2, '0')}`;
}

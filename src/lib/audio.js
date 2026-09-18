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
  UNSUPPORTED: 'unsupported',   // немає API (старий браузер)
  DENIED: 'denied',             // користувач або налаштування сайту заборонили
  EMBEDDED: 'embedded',         // сторінка у вбудованому вікні, яке не передає дозвіл
  NOTFOUND: 'notfound',         // немає мікрофона
  OTHER: 'other',
};

/** Сторінка відкрита всередині чужого вікна (прев'ю, артефакт, вбудований блок). */
export function inEmbeddedFrame() {
  try { return window.self !== window.top; }
  catch { return true; }   // доступ до window.top кинув виняток — значить, рамка чужа
}

/**
 * Чи рамка точно не передає дозвіл на мікрофон.
 * true / false там, де браузер дає це спитати; null — невідомо (Safari).
 */
export function framePolicyBlocksMic() {
  try {
    const fp = document.featurePolicy || document.permissionsPolicy;
    if (fp && typeof fp.allowsFeature === 'function') return !fp.allowsFeature('microphone');
  } catch {}
  return null;
}

export function classifyMicError(err) {
  if (!err) return MIC_ERRORS.OTHER;
  const n = err.name || '';
  if (n === 'NotAllowedError' || n === 'SecurityError' || n === 'PermissionDeniedError') {
    // Та сама помилка означає дві різні речі. Якщо сторінка у вбудованому
    // вікні, найімовірніше заборонила саме рамка, а не людина: системного
    // запиту при цьому не було, і в налаштуваннях Safari цього не змінити.
    // Відправляти людину в налаштування сайту в такому разі — це відправляти
    // її туди, де вона нічого не знайде.
    const blocked = framePolicyBlocksMic();
    if (blocked === true) return MIC_ERRORS.EMBEDDED;
    if (blocked === false) return MIC_ERRORS.DENIED;   // рамка дозвіл передає — отже, відхилила людина
    return inEmbeddedFrame() ? MIC_ERRORS.EMBEDDED : MIC_ERRORS.DENIED;
  }
  if (n === 'NotFoundError' || n === 'DevicesNotFoundError' || n === 'OverconstrainedError') return MIC_ERRORS.NOTFOUND;
  if (n === 'NotSupportedError' || n === 'TypeError') {
    return inEmbeddedFrame() ? MIC_ERRORS.EMBEDDED : MIC_ERRORS.UNSUPPORTED;
  }
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
    // Свідомо БЕЗ timeslice. Шматки нам не потрібні — блоб збирається один
    // раз на stop(). А Safari пише mp4 фрагментами, і нарізка timeslice там
    // історично давала непрогравані записи. Немає нарізки — немає класу
    // помилок, яких ми все одно не змогли б відтворити в Chromium.
    rec.start();
    startedAt = Date.now();

    // рівень сигналу для хвилі
    try {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (AC) {
        ctx = new AC();
        // Safari створює AudioContext у стані suspended, якщо жест користувача
        // «згорів» на await getUserMedia вище. Без resume() хвиля просто стоїть.
        if (ctx.state === 'suspended' && typeof ctx.resume === 'function') {
          ctx.resume().catch(() => {});
        }
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

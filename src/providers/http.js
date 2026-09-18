// HTTP-провайдери. Клієнт НІКОЛИ не тримає ключів: він звертається лише
// до вашого власного бекенд-проксі, а проксі вже ходить у STT/LLM/TTS.
// Контракт проксі описано в docs/PROVIDERS.md. У цій версії ці провайдери
// НЕ ПЕРЕВІРЕНІ на реальному сервері — вони є як точка розширення.

const TIMEOUT_MS = 30_000;

async function post(url, body, opts = {}) {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), opts.timeout || TIMEOUT_MS);
  try {
    const res = await fetch(url, {
      method: 'POST',
      signal: ctrl.signal,
      body: body instanceof FormData ? body : JSON.stringify(body),
      headers: body instanceof FormData ? undefined : { 'content-type': 'application/json' },
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } finally { clearTimeout(t); }
}

export function createHttpStt(baseUrl) {
  return {
    id: 'http-stt',
    label: 'Розпізнавання на сервері',
    async transcribe(blob, opts = {}) {
      const fd = new FormData();
      fd.append('audio', blob, 'answer.webm');
      fd.append('lang', opts.lang || 'en');
      const json = await post(`${baseUrl}/stt`, fd);
      return {
        text: String(json.text || ''),
        isDemo: false,
        confidence: json.confidence || 'unknown',
        provider: 'http-stt',
        durationMs: opts.durationMs || 0,
      };
    },
  };
}

export function createHttpLlm(baseUrl) {
  return {
    id: 'http-llm',
    label: 'Мовний розбір на сервері',
    async analyze({ transcript, targets = [], level = 'A2-B1' }) {
      const json = await post(`${baseUrl}/analyze`, {
        transcript, level,
        targets: targets.map(t => ({ id: t.id, en: t.en })),
      });
      return {
        corrections: (json.corrections || []).slice(0, 3),
        improved: String(json.improved || ''),
        usedTargets: json.usedTargets || [],
        totalFound: json.totalFound ?? (json.corrections || []).length,
        isDemo: false,
        provider: 'http-llm',
      };
    },
  };
}

export function createHttpTts(baseUrl) {
  let audio = null;
  return {
    id: 'http-tts',
    label: 'Озвучення на сервері',
    available: () => true,
    stop() { if (audio) { try { audio.pause(); } catch {} audio = null; } },
    speak(text, { onend } = {}) {
      post(`${baseUrl}/tts`, { text, voice: 'en-US' })
        .then(j => {
          audio = new Audio(j.url);
          audio.onended = () => onend && onend();
          audio.onerror = () => onend && onend();
          return audio.play();
        })
        .catch(() => onend && onend());
      return true;
    },
  };
}

import { createMockStt, createMockLlm, createBrowserTts } from './mock.js';
import { createHttpStt, createHttpLlm, createHttpTts } from './http.js';
import { getLesson } from '../content/lessons.js';

/**
 * Конфіг читається з window.__SIA_CONFIG__ (файл config.js, який кладе
 * ваш деплой). Ключів у ньому НЕМАЄ — лише режим і базовий URL проксі.
 */
function cfg() {
  const c = (typeof window !== 'undefined' && window.__SIA_CONFIG__) || {};
  return { mode: c.providerMode || 'mock', apiBaseUrl: c.apiBaseUrl || '', serverTts: !!c.serverTts };
}

export function getProviders() {
  const { mode, apiBaseUrl } = cfg();
  const useHttp = mode === 'http' && !!apiBaseUrl;
  return {
    mode: useHttp ? 'http' : 'mock',
    stt: useHttp ? createHttpStt(apiBaseUrl) : createMockStt((day) => { const l = getLesson(day); return (l && l.demoTranscript) || ''; }),
    llm: useHttp ? createHttpLlm(apiBaseUrl) : createMockLlm(),
    // TTS свідомо лишається браузерним навіть у http-режимі: голос уже
    // працює, коштує нуль і не залежить від мережі. Серверне озвучення
    // вмикається тільки явним прапорцем, коли буде за що його вмикати.
    tts: (useHttp && cfg().serverTts) ? createHttpTts(apiBaseUrl) : createBrowserTts(),
  };
}

/** Текстовий шлях (без мікрофона) — це НЕ STT. Позначаємо окремо. */
export function textAsTranscript(text) {
  return { text: String(text || '').trim(), isDemo: false, confidence: 'text', provider: 'text-input', durationMs: 0 };
}

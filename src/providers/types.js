/**
 * Контракти провайдерів. Реалізацій дві: mock (локально, без ключів) і
 * http (звертається до ВАШОГО бекенд-проксі, який тримає ключі в себе).
 *
 * SttProvider.transcribe(blob, {lang}) ->
 *   { text, isDemo, confidence: 'high'|'low'|'unknown', provider, durationMs }
 *
 * LlmProvider.analyze({transcript, targets, level}) ->
 *   { corrections: [{kind, before, after, why}], improved, usedTargets: [id],
 *     isDemo, provider }
 *
 * TtsProvider.speak(text, {rate}) -> Promise<void>   (або відтворює аудіо)
 * TtsProvider.available() -> boolean
 * TtsProvider.label -> рядок для UI («голос браузера» / «сервер»)
 */
export const CORRECTION_KINDS = {
  CLARITY: 'clarity',        // заважає зрозуміти думку
  NATURAL: 'natural',        // звучить неправильно/неприродно
  GRAMMAR: 'grammar',        // одна важлива граматична конструкція
};
export const KIND_LABEL = {
  clarity: 'Заважає зрозуміти',
  natural: 'Звучить неприродно',
  grammar: 'Граматика',
};

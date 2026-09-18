// Класифікація відмов мікрофона. Одна й та сама помилка браузера означає
// дві різні речі, і від того, яку з них ми покажемо, залежить, чи піде
// людина щось налаштовувати даремно.
import test from 'node:test';
import assert from 'node:assert/strict';

/** Ставить мінімальне вікно/документ так, як їх бачить браузер. */
function withEnv({ embedded = false, policyAllowsMic = undefined }, fn) {
  const top = {};
  const self = embedded ? {} : top;
  globalThis.window = { self, top };
  globalThis.document = {};
  if (policyAllowsMic !== undefined) {
    globalThis.document.featurePolicy = { allowsFeature: (f) => f === 'microphone' ? policyAllowsMic : true };
  }
  try { return fn(); }
  finally { delete globalThis.window; delete globalThis.document; }
}

const err = (name) => Object.assign(new Error(name), { name });

const { classifyMicError, MIC_ERRORS, inEmbeddedFrame } = await import('../src/lib/audio.js');

test('окрема вкладка: відмова — це відмова людини', () => {
  withEnv({ embedded: false }, () => {
    assert.equal(classifyMicError(err('NotAllowedError')), MIC_ERRORS.DENIED);
  });
});

test('вбудоване вікно: та сама помилка — це рамка, а не людина', () => {
  withEnv({ embedded: true }, () => {
    assert.equal(classifyMicError(err('NotAllowedError')), MIC_ERRORS.EMBEDDED);
    assert.equal(classifyMicError(err('SecurityError')), MIC_ERRORS.EMBEDDED);
  });
});

test('політика рамки має пріоритет над здогадкою про вкладеність', () => {
  withEnv({ embedded: false, policyAllowsMic: false }, () => {
    assert.equal(classifyMicError(err('NotAllowedError')), MIC_ERRORS.EMBEDDED);
  });
  withEnv({ embedded: true, policyAllowsMic: true }, () => {
    // Рамка дозвіл передає — отже, відхилила таки людина.
    assert.equal(classifyMicError(err('NotAllowedError')), MIC_ERRORS.DENIED);
  });
});

test('відсутній мікрофон не плутається з забороною', () => {
  withEnv({ embedded: true }, () => {
    assert.equal(classifyMicError(err('NotFoundError')), MIC_ERRORS.NOTFOUND);
  });
});

test('немає API: у вкладці — старий браузер, у рамці — рамка', () => {
  withEnv({ embedded: false }, () => {
    assert.equal(classifyMicError(err('NotSupportedError')), MIC_ERRORS.UNSUPPORTED);
  });
  withEnv({ embedded: true }, () => {
    assert.equal(classifyMicError(err('NotSupportedError')), MIC_ERRORS.EMBEDDED);
  });
});

test('недоступний window.top вважається чужою рамкою', () => {
  globalThis.window = { get self() { return {}; }, get top() { throw new Error('cross-origin'); } };
  globalThis.document = {};
  try { assert.equal(inEmbeddedFrame(), true); }
  finally { delete globalThis.window; delete globalThis.document; }
});

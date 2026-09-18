import { test } from 'node:test';
import assert from 'node:assert/strict';
import { detectCrisis, filterAiOutput, CRISIS_RESOURCES } from '../src/lib/safety.js';

test('кризовий детектор ловить явні сигнали українською', () => {
  for (const s of [
    'Я більше не хочу жити',
    'думаю покінчити з собою',
    'мене б\'є чоловік і я боюся за своє життя',
  ]) assert.equal(detectCrisis(s).crisis, true, s);
});

test('кризовий детектор ловить явні сигнали англійською', () => {
  for (const s of [
    'I want to kill myself',
    'I think about self-harm every day',
    'there is no reason to live anymore',
    'he hits me when he drinks',
  ]) assert.equal(detectCrisis(s).crisis, true, s);
});

test('кризовий детектор НЕ спрацьовує на звичайну тривогу', () => {
  for (const s of [
    "This week I'm worried about my work and my documents.",
    'Я хвилююся через співбесіду й не можу заснути',
    'I am afraid of losing my job',
    'My manager said there will be changes in our team',
    'I killed it at the interview',
  ]) assert.equal(detectCrisis(s).crisis, false, s);
});

test('фільтр блокує мовлення від імені Бога', () => {
  const r = filterAiOutput('Бог каже тобі не боятися — це знак згори.');
  assert.equal(r.ok, false);
  assert.ok(r.violations.length >= 1);
  assert.ok(!r.text.includes('Бог каже'));
});

test('фільтр блокує оцінку віри й діагнози', () => {
  assert.equal(filterAiOutput('У тебе слабка віра, тому й тривога.').ok, false);
  assert.equal(filterAiOutput('У тебе депресія, зверніться до лікаря.').ok, false);
  assert.equal(filterAiOutput('God is telling you to move.').ok, false);
});

test('фільтр пропускає звичайний мовний розбір', () => {
  const ok = filterAiOutput('Після stop іде -ing: stop thinking. Так звучить природніше.');
  assert.equal(ok.ok, true);
  assert.ok(ok.text.includes('stop thinking'));
});

test('контакти допомоги статичні й непорожні', () => {
  assert.ok(CRISIS_RESOURCES.length >= 3);
  for (const r of CRISIS_RESOURCES) {
    assert.ok(r.name && r.contact && r.region);
  }
});

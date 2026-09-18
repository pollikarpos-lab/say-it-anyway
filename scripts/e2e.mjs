#!/usr/bin/env node
/**
 * Наскрізний прогін застосунку в headless Chromium + знімки екранів.
 * Проходить усі три написані дні підряд, як це робитиме людина.
 * Запуск:  node scripts/serve.mjs 5173 ./dist &   node scripts/e2e.mjs
 */
import { launch } from './cdp.mjs';
import { mkdirSync, writeFileSync } from 'node:fs';

const URL_BASE = process.env.SIA_URL || 'http://localhost:5173/index.html';
const SHOTS = new URL('../screenshots/', import.meta.url).pathname;
mkdirSync(SHOTS, { recursive: true });

let pass = 0, fail = 0;
const results = [];
function check(name, ok, extra = '') {
  ok ? pass++ : fail++;
  results.push(`${ok ? 'PASS' : 'FAIL'}  ${name}${extra ? ' — ' + extra : ''}`);
  console.log(`${ok ? '  ok' : 'FAIL'}  ${name}${extra ? ' — ' + extra : ''}`);
}

const clickText = (t, tag = 'button') => `(() => {
  const el = [...document.querySelectorAll(${JSON.stringify(tag)})]
    .find(b => b.textContent.trim().includes(${JSON.stringify(t)}) && !b.disabled);
  if (!el) return false; el.click(); return true;
})()`;
const clickSel = (s) => `(() => { const e = document.querySelector(${JSON.stringify(s)}); if(!e) return false; e.click(); return true; })()`;
const text = () => `document.getElementById('root').innerText`;
const wait = (ms) => new Promise(r => setTimeout(r, ms));
// innerText враховує text-transform: uppercase, тому порівнюємо без регістру
const has = (hay, needle) => String(hay).toLocaleLowerCase('uk').includes(String(needle).toLocaleLowerCase('uk'));

const b = await launch({ width: 390, height: 844, dsf: 2 });

/** Чекає на реальний стан, а не на «приблизно стільки мілісекунд». */
async function waitFor(expr, { timeout = 12000, every = 150, label = '' } = {}) {
  const t0 = Date.now();
  while (Date.now() - t0 < timeout) {
    try { if (await b.eval(expr)) return true; } catch {}
    await wait(every);
  }
  console.log(`   (waitFor вичерпав час: ${label || expr})`);
  return false;
}
const analysisReady = () => waitFor(
  `window.__SIA__.lesson.transcript !== null && window.__SIA__.lesson.analysis !== null`,
  { label: 'транскрипція + розбір' });

/** Проходить «відкритий» день від кроку phrases до фіналу. */
async function walkOpenDay(day, o = {}) {
  await b.eval(clickText('Далі')); await wait(250);      // context → phrases
  await b.eval(clickText('Далі')); await wait(250);      // phrases → sample
  await b.eval(clickText('Я готовий відповідати')); await wait(250);
  await b.eval(clickText('Згоден, далі')); await wait(350);
  check(`д${day}: екран запису`, await b.eval(`!!document.querySelector('.mic')`));
  await recordInto('.mic', 2200);
  check(`д${day}: прослуховування свого запису`, has(await b.eval(text()), 'Послухай себе'));
  await b.eval(clickText('Надіслати на розбір'));
  await analysisReady(); await wait(250);
  check(`д${day}: транскрипція показана`, has(await b.eval(text()), 'Що почув застосунок'));
  await b.eval(clickText('Так, далі')); await wait(350);
  const n = await b.eval(`document.querySelectorAll('.fix').length`);
  check(`д${day}: показано ≤3 корекції`, n > 0 && n <= 3, `${n} шт.`);
  if (o.expectCorrection) {
    check(`д${day}: спіймано «${o.expectCorrection}»`, has(await b.eval(text()), o.expectCorrection));
  }
  if (o.shotPrefix) await b.shot(SHOTS + o.shotPrefix + '-corrections.png', { full: true });
  await b.eval(clickText('Показати природнішу версію')); await wait(350);
  const improved = await b.eval(`window.__SIA__.lesson.analysis.improved`);
  for (const w of (o.expectInProof || [])) {
    check(`д${day}: сенс збережено («${w}»)`, improved.includes(w), improved.slice(0, 70) + '…');
  }
  if (o.shotPrefix) await b.shot(SHOTS + o.shotPrefix + '-improved.png', { full: true });
  await b.eval(clickText('Далі')); await wait(300);
  await b.eval(clickText('Зберегти мою фразу')); await wait(500);
  const done = await b.eval(text());
  check(`д${day}: урок завершено`, has(done, `День ${day} — пройдено`));
  if (o.nextLabel) check(`д${day}: кнопка веде далі`, has(done, o.nextLabel));
  if (o.shotPrefix) await b.shot(SHOTS + o.shotPrefix + '-complete.png', { full: true });
}

/** Записує репліку фейковим мікрофоном Chromium. */
async function recordInto(sel, ms = 2200) {
  await b.eval(clickSel(sel)); await wait(ms);
  await b.eval(clickSel(sel)); await wait(900);
}

try {
  /* ═══════════ 1. Лендинг ═══════════ */
  await b.goto(URL_BASE);
  await b.eval(`localStorage.clear(); location.hash=''; window.__SIA__ && window.__SIA__.render();`);
  await wait(400);
  const land = await b.eval(text());
  check('лендинг рендериться', has(land, 'Скажи англійською'));
  check('головна ідея на першому екрані', has(land, 'Твоя думка') && has(land, 'Навіть неідеально'));
  check('герой показує механіку парою карток',
    await b.eval(`!!document.querySelector('.hero-art .thought--original') && !!document.querySelector('.hero-art .thought--improved')`));
  check('є блок «як це працює» 01–03', has(land, 'Зупинися на хвилину'));
  check('немає горизонтального скролу (лендинг)',
    await b.eval('document.documentElement.scrollWidth <= window.innerWidth + 1'));
  await b.shot(SHOTS + '01-landing.png', { full: true });

  /* ═══════════ 2. Онбординг ═══════════ */
  check('CTA «Спробувати безкоштовно»', await b.eval(clickText('Спробувати безкоштовно')));
  await wait(300);
  check('онбординг: питання 1', has(await b.eval(text()), 'Як до тебе звертатися'));
  await b.shot(SHOTS + '02-onboarding.png');
  await b.eval(`(() => { const i = document.querySelector('input.field'); i.value='Олег'; i.dispatchEvent(new Event('input',{bubbles:true})); })()`);
  await b.eval(clickText('Далі')); await wait(250);
  check('онбординг: регіон', has(await b.eval(text()), 'Де ти зараз живеш'));
  await b.eval(clickText('США', '.choice')); await wait(350);
  check('онбординг: комфорт', has(await b.eval(text()), 'комфортно говорити'));
  await b.eval(clickText('Кілька речень можу', '.choice')); await wait(350);
  check('онбординг: нагадування', has(await b.eval(text()), 'Коли нагадувати'));
  await b.eval(clickText('Зранку', '.choice')); await wait(400);
  check('екран вибору режиму', has(await b.eval(text()), 'Що тобі ближче зараз'));
  await b.shot(SHOTS + '03-mode.png', { full: true });
  await b.eval(clickText('Я християнин', '.choice')); await wait(200);
  await b.eval(clickText('Почати')); await wait(400);

  /* ═══════════ 3. Маршрут ═══════════ */
  const routeTxt = await b.eval(text());
  check('маршрут на 7 днів видно', has(routeTxt, 'Твій маршрут на 7 днів'));
  check('усі 7 днів у списку', [1,2,3,4,5,6,7].every(n => has(routeTxt, 'День ' + n)));
  check('день 1 доступний', has(routeTxt, 'Доступний зараз'));
  check('день 2 замкнений до проходження дня 1', has(routeTxt, 'Відкриється, коли пройдеш день 1'));
  check('дні 6–7 позначені як «готується»', has(routeTxt, 'Ще готується'));
  check('у маршруті п\'ять написаних днів',
    await b.eval(`[...document.querySelectorAll('.day')].filter(d => !d.textContent.includes('Ще готується')).length === 5`));
  check('клікабельний рівно один день',
    await b.eval(`[...document.querySelectorAll('.day')].filter(d => !d.disabled).length === 1`));
  await b.shot(SHOTS + '04-route.png', { full: true });

  /* ═══════════════════════════════════════════
     ДЕНЬ 1 — повторення за диктором
     ═══════════════════════════════════════════ */
  await b.eval(clickSel('.day.is-active')); await wait(400);
  check('день 1 відкрився', has(await b.eval(text()), 'Не бійся'));
  check('це справді урок дня 1', await b.eval(`window.__SIA__.lesson.day === 1`));
  await b.shot(SHOTS + '10-day1-intro.png', { full: true });

  await b.eval(clickText('Почати')); await wait(250);
  check('д1: запитання не вимагає відповіді', has(await b.eval(text()), 'Відповідати не треба'));
  await b.eval(clickText('Далі')); await wait(250);

  const d1uk = await b.eval(text());
  check('д1: уривок українською (Огієнко)', has(d1uk, 'Бо не дав нам Бог духа страху'));
  check('д1: посилання й переклад', has(d1uk, 'II до Тимофія 1:7') && has(d1uk, 'Огієнка'));
  check('д1: указано два джерела звірки', has(d1uk, 'bible.com') && has(d1uk, 'only.bible'));
  await b.shot(SHOTS + '11-day1-scripture.png', { full: true });
  await b.eval(clickText('Тепер англійською')); await wait(250);
  check('д1: уривок англійською (BSB)', has(await b.eval(text()), 'a spirit of fear'));
  await b.eval(clickText('Далі')); await wait(250);
  check('д1: контекст від людини', has(await b.eval(text()), 'Контекст — написала людина'));
  await b.eval(clickText('Далі')); await wait(250);
  check('д1: три фрази', has(await b.eval(text()), "I'm scared"));
  await b.eval(clickText('Далі')); await wait(250);

  const d1consent = await b.eval(text());
  check('д1: згода каже, що аудіо нікуди не йде', has(d1consent, 'не покидає твій телефон'));
  check('д1: «що обробляється — нічого»', has(d1consent, 'Нічого'));
  await b.shot(SHOTS + '12-day1-consent.png', { full: true });
  await b.eval(clickText('Згоден, далі')); await wait(350);

  check('д1: екран повторення', has(await b.eval(text()), 'Фраза 1 з 3'));
  check('д1: до запису головна дія — мікрофон, не «пропустити»',
    await b.eval(`![...document.querySelectorAll('.actionbar .btn--primary')].length`));
  check('д1: мікрофон на місці', await b.eval(`!!document.querySelector('.mic')`));
  check('д1: немає жодного розбору в кроках',
    await b.eval(`!window.__SIA__.lesson.analysis`));
  await b.shot(SHOTS + '13-day1-shadow.png', { full: true });

  for (let i = 1; i <= 3; i++) {
    await recordInto('.mic', 1600);
    check(`д1: фразу ${i} записано`, await b.eval(`Object.keys(window.__SIA__.lesson.shadowRec).length === ${i}`));
    if (i === 1) await b.shot(SHOTS + '14-day1-recorded.png', { full: true });
    if (i === 1) check('д1: після запису з\'явилася головна кнопка «Наступна фраза»',
      await b.eval(`!![...document.querySelectorAll('.actionbar .btn--primary')].length`));
    if (i < 3) { await b.eval(clickText('Наступна фраза')); await wait(350); }
  }
  check('д1: аудіо лишилося у вкладці й не пішло в розпізнавання',
    await b.eval(`window.__SIA__.lesson.transcript === null`));
  await b.eval(clickText('Завершити')); await wait(500);

  const d1done = await b.eval(text());
  check('д1: урок завершено', has(d1done, 'День 1 — пройдено') && has(d1done, 'Ти сказав це уголос'));
  check('д1: трофей — фраза дня', has(d1done, 'anyway'));
  check('д1: показано секунди мовлення', /\d+/.test(d1done) && has(d1done, 'секунд'));
  check('д1: НЕМАЄ блоку конструкцій (нічого не оцінювали)', !has(d1done, 'Конструкції у твоїй відповіді'));
  check('д1: є молитва за режимом', has(d1done, 'Коротка молитва'));
  check('д1: є один крок', has(d1done, 'Один крок на сьогодні'));
  check('д1: кнопка веде на день 2', has(d1done, 'Далі: день 2'));
  await b.shot(SHOTS + '15-day1-complete.png', { full: true });

  /* ═══════════════════════════════════════════
     ДЕНЬ 2 — речення з рамки
     ═══════════════════════════════════════════ */
  await b.eval(clickText('Далі: день 2')); await wait(500);
  check('день 2 відкрився одразу після дня 1', await b.eval(`window.__SIA__.lesson.day === 2`));
  check('д1 позначено пройденим у стані', await b.eval(`window.__SIA__.state.completedDays.includes(1)`));

  // intro → question → uk → en → context → phrases → template
  for (const label of ['Почати', 'Далі', 'Тепер англійською', 'Далі', 'Далі', 'Далі']) {
    await b.eval(clickText(label)); await wait(250);
  }
  const d2t = await b.eval(text());
  check('д2: екран рамки', has(d2t, 'Збери своє речення'));
  check('д2: кнопка заблокована, поки не вибрано', await b.eval(
    `[...document.querySelectorAll('.actionbar button')].some(x => x.disabled)`));
  await b.shot(SHOTS + '20-day2-template.png', { full: true });

  await b.eval(clickText('anxious', '.chip')); await wait(250);
  await b.eval(clickText('go for a walk', '.chip')); await wait(250);
  check('д2: попередній перегляд зібрався',
    has(await b.eval(text()), 'When I feel anxious, I go for a walk. It helps a little.'));
  check('д2: кнопка розблокувалася', await b.eval(
    `[...document.querySelectorAll('.actionbar button')].every(x => !x.disabled)`));
  await b.shot(SHOTS + '21-day2-template-filled.png', { full: true });

  await b.eval(clickText('Це моє речення')); await wait(300);
  check('д2: речення збережено в стані',
    await b.eval(`window.__SIA__.lesson.templateSentence.includes('anxious')`));
  await b.eval(clickText('Згоден, далі')); await wait(350);
  check('д2: на екрані запису показано саме твоє речення',
    has(await b.eval(text()), 'Твоє речення'));
  await b.shot(SHOTS + '22-day2-record.png', { full: true });

  await recordInto('.mic', 2000);
  check('д2: перехід на прослуховування', has(await b.eval(text()), 'Послухай себе'));
  await b.eval(clickText('Надіслати на розбір'));
  await analysisReady(); await wait(250);

  const d2tr = await b.eval(text());
  check('д2: транскрипція показана', has(d2tr, 'Що почув застосунок'));
  check('д2: демо-режим чесно позначений', has(d2tr, 'НЕ розшифровка вашого голосу'));
  check('д2: демо-текст саме для дня 2',
    await b.eval(`window.__SIA__.lesson.transcript.text.includes('When I feel anxious')`));
  await b.eval(clickText('Так, далі')); await wait(350);

  const d2fix = await b.eval(text());
  const d2n = await b.eval(`document.querySelectorAll('.fix').length`);
  check('д2: показано ≤3 корекції', d2n > 0 && d2n <= 3, `${d2n} шт.`);
  check('д2: спіймано «for walk»', has(d2fix, 'for a walk'));
  check('д2: спіймано третю особу', has(d2fix, 'It helps'));
  await b.shot(SHOTS + '23-day2-corrections.png', { full: true });
  await b.eval(clickText('Показати природнішу версію')); await wait(350);

  const d2imp = await b.eval(text());
  check('д2: пара «як сказав ти» → «трохи природніше»',
    has(d2imp, 'Як сказав ти') && has(d2imp, 'Трохи природніше'));
  const d2improved = await b.eval(`window.__SIA__.lesson.analysis.improved`);
  check('д2: сенс збережено', ['anxious', 'walk', 'helps'].every(w => d2improved.includes(w)), d2improved);
  await b.shot(SHOTS + '24-day2-improved.png', { full: true });
  await b.eval(clickText('Далі')); await wait(300);
  await b.eval(clickText('Зберегти мою фразу')); await wait(450);

  const d2done = await b.eval(text());
  check('д2: урок завершено', has(d2done, 'День 2 — пройдено'));
  check('д2: кнопка веде на день 3', has(d2done, 'Далі: день 3'));
  await b.shot(SHOTS + '25-day2-complete.png', { full: true });

  /* ═══════════════════════════════════════════
     ДЕНЬ 3 — відкрита відповідь
     ═══════════════════════════════════════════ */
  await b.eval(clickText('Далі: день 3')); await wait(500);
  check('день 3 відкрився', await b.eval(`window.__SIA__.lesson.day === 3`));

  // intro → question → uk → en → context → phrases → sample → consent
  for (const label of ['Почати', 'Далі', 'Тепер англійською', 'Далі', 'Далі', 'Далі', 'Я готовий відповідати']) {
    await b.eval(clickText(label)); await wait(250);
  }
  const d3consent = await b.eval(text());
  check('д3: екран згоди', has(d3consent, 'Що станеться з твоїм голосом'));
  check('д3: немає заяв про шифрування', has(d3consent, 'не заявляємо про шифрування'));
  await b.eval(clickText('Згоден, далі')); await wait(350);

  check('д3: екран запису', await b.eval(`!!document.querySelector('.mic')`));
  await b.shot(SHOTS + '30-day3-record.png', { full: true });
  await recordInto('.mic', 2400);
  check('д3: прослуховування свого запису', has(await b.eval(text()), 'Послухай себе'));
  await b.eval(clickText('Надіслати на розбір'));
  await analysisReady(); await wait(250);

  const d3tr = await b.eval(text());
  check('д3: транскрипція показана', has(d3tr, 'Що почув застосунок'));
  check('д3: є перевірка якості транскрипції', has(d3tr, 'Це схоже на те, що ти сказав'));
  check('д3: аудіо видалено після транскрипції', await b.eval('window.__SIA__.lesson.audioBlob === null'));
  await b.eval(clickText('Так, далі')); await wait(350);

  const d3n = await b.eval(`document.querySelectorAll('.fix').length`);
  check('д3: показано ≤3 корекції', d3n > 0 && d3n <= 3, `${d3n} шт.`);
  check('д3: пояснення українською', has(await b.eval(text()), 'Заперечення в теперішньому часі'));
  await b.shot(SHOTS + '31-day3-corrections.png', { full: true });
  await b.eval(clickText('Показати природнішу версію')); await wait(350);

  const d3imp = await b.eval(text());
  check('д3: пара карток відрендерена',
    await b.eval(`document.querySelectorAll('.thought--original').length === 1 && document.querySelectorAll('.thought--improved').length === 1`));
  const improved = await b.eval('window.__SIA__.lesson.analysis.improved');
  check('д3: сенс збережено', ['worried','work','manager','CV','hands'].every(w => improved.includes(w)));
  check('д3: конструкції показані без оцінки',
    has(d3imp, 'Конструкції у твоїй відповіді') && !/\b\d\s*\/\s*3\b/.test(d3imp));
  check('д3: є кнопка «Повторити за диктором»', has(d3imp, 'Повторити за диктором'));
  await b.shot(SHOTS + '32-day3-improved.png', { full: true });
  await b.eval(clickText('Далі')); await wait(300);
  check('д3: екран збереження фрази', has(await b.eval(text()), 'Одна фраза на повторення'));
  await b.eval(clickText('Зберегти мою фразу')); await wait(500);

  const d3done = await b.eval(text());
  check('д3: урок завершено', has(d3done, 'День 3 — пройдено') && has(d3done, 'Ти сказав це'));
  check('д3: трофей — речення користувача', await b.eval(`!!document.querySelector('.trophy__text')`));
  check('д3: метрика не виглядає як оцінка', !/\b\d\s*\/\s*3\b/.test(d3done));
  check('д3: кнопка веде на день 4', has(d3done, 'Далі: день 4'));
  await b.shot(SHOTS + '33-day3-complete.png', { full: true });

  /* ═══════════════════════════════════════════
     ДЕНЬ 4 — розповідь про минуле
     ═══════════════════════════════════════════ */
  await b.eval(clickText('Далі: день 4')); await wait(500);
  check('день 4 відкрився', await b.eval(`window.__SIA__.lesson.day === 4`));
  const d4intro = await b.eval(text());
  check('д4: на вступі повертається збережена фраза', has(d4intro, 'Ти зберіг це в день'));
  check('д4: тема — те, що вже позаду', has(d4intro, 'вже позаду'));
  await b.shot(SHOTS + '35-day4-intro.png', { full: true });

  await b.eval(clickText('Почати')); await wait(250);
  check('д4: запитання про пройдене', has(await b.eval(text()), 'вже пройшов'));
  await b.eval(clickText('Далі')); await wait(250);
  const d4uk = await b.eval(text());
  check('д4: уривок Ісаї 43:2 звірений', has(d4uk, 'Коли переходитимеш через води'));
  check('д4: три джерела звірки', has(d4uk, 'wordproject') && has(d4uk, 'only.bible'));
  await b.eval(clickText('Тепер англійською')); await wait(250);
  check('д4: BSB', has(await b.eval(text()), 'pass through the waters'));
  await b.eval(clickText('Далі')); await wait(250);
  const d4ctx = await b.eval(text());
  check('д4: контекст пояснює «коли», а не «якщо»', has(d4ctx, 'а не «якщо»'));
  check('д4: застереження про те, що води не уникнути', has(d4ctx, 'не обіцяно'));
  await b.shot(SHOTS + '36-day4-context.png', { full: true });

  await walkOpenDay(4, {
    shotPrefix: '37-day4',
    expectCorrection: 'didn\'t have',
    expectInProof: ['hard time', 'better'],
    nextLabel: 'Далі: день 5',
  });

  /* ═══════════════════════════════════════════
     ДЕНЬ 5 — обіцянка на майбутнє
     ═══════════════════════════════════════════ */
  await b.eval(clickText('Далі: день 5')); await wait(500);
  check('день 5 відкрився', await b.eval(`window.__SIA__.lesson.day === 5`));
  await b.eval(clickText('Почати')); await wait(250);
  check('д5: запитання про дію цього тижня', has(await b.eval(text()), 'якби не боявся'));
  await b.eval(clickText('Далі')); await wait(250);
  check('д5: уривок Ісаї 41:10 звірений', has(await b.eval(text()), 'Зміцню Я тебе'));
  await b.eval(clickText('Тепер англійською')); await wait(250);
  check('д5: BSB', has(await b.eval(text()), 'I will strengthen you'));
  await b.eval(clickText('Далі')); await wait(250);
  check('д5: контекст про мужність, а не безстрашність',
    has(await b.eval(text()), 'не відсутність страху'));
  await b.eval(clickText('Далі')); await wait(250);
  check('д5: конструкція even if', has(await b.eval(text()), 'Even if'));
  await b.eval(clickText('Далі')); await wait(250);
  check('д5: приклад відповіді', has(await b.eval(text()), "I'll figure it out"));
  await b.eval(clickText('Я готовий відповідати')); await wait(250);
  await b.eval(clickText('Згоден, далі')); await wait(350);
  check('д5: підказка просить почати з I will', has(await b.eval(text()), 'I will'));
  await b.shot(SHOTS + '38-day5-record.png', { full: true });

  await recordInto('.mic', 2200);
  await b.eval(clickText('Надіслати на розбір'));
  await analysisReady(); await wait(250);
  check('д5: демо-текст саме для дня 5',
    (await b.eval(`window.__SIA__.lesson.transcript.text`)).includes('will to call'));
  await b.eval(clickText('Так, далі')); await wait(350);
  const d5fix = await b.eval(text());
  check('д5: спіймано «will to call»', has(d5fix, 'will call'));
  await b.shot(SHOTS + '39-day5-corrections.png', { full: true });
  await b.eval(clickText('Показати природнішу версію')); await wait(350);
  const d5used = await b.eval(`JSON.stringify(window.__SIA__.lesson.analysis.usedTargets)`);
  check('д5: зараховано дві конструкції з трьох', d5used.includes('iwill') && d5used.includes('figureout'), d5used);
  check('д5: не зараховано ту, що не звучала', !d5used.includes('evenif'));
  await b.shot(SHOTS + '40-day5-improved.png', { full: true });
  await b.eval(clickText('Далі')); await wait(300);
  await b.eval(clickText('Зберегти мою фразу')); await wait(500);
  const d5done = await b.eval(text());
  check('д5: урок завершено', has(d5done, 'День 5 — пройдено'));
  check('д5: далі написаних днів немає — кнопка на головну', has(d5done, 'На головну'));
  await b.shot(SHOTS + '41-day5-complete.png', { full: true });

  /* ═══════════ Маршрут після п'яти днів ═══════════ */
  await b.eval(clickText('На головну')); await wait(400);
  const routeAfter = await b.eval(text());
  check('усі п\'ять днів позначені пройденими',
    await b.eval(`document.querySelectorAll('.day.is-done').length === 5`));
  check('дні 6–7 лишаються закритими', has(routeAfter, 'Ще готується'));
  await b.shot(SHOTS + '42-route-done.png', { full: true });

  /* ═══════════ Перезавантаження ═══════════ */
  await b.goto(URL_BASE); await wait(600);
  const afterReload = await b.eval(text());
  check('після перезавантаження — маршрут, а не лендинг', has(afterReload, 'Твій маршрут на 7 днів'));
  check('прогрес п\'яти днів пережив перезавантаження',
    await b.eval(`window.__SIA__.state.completedDays.length === 5`));
  check('ім\'я збережено', has(afterReload, 'Олег'));

  /* ═══════════ Прогрес ═══════════ */
  await b.eval(clickText('Мій прогрес')); await wait(400);
  const prog = await b.eval(text());
  check('екран прогресу', has(prog, 'із семи днів пройдено'));
  check('прогрес рахує п\'ять днів', has(prog, '5'));
  check('збережені фрази на місці', has(prog, 'Збережені фрази') && !has(prog, 'Поки що порожньо'));
  check('чесно про базу порівняння', has(prog, 'днем 3 і днем 7'));
  await b.shot(SHOTS + '50-progress.png', { full: true });

  /* ═══════════ Кризовий сценарій ═══════════ */
  await b.eval(`location.hash='#/lesson/3'`); await wait(400);
  await b.eval(`window.__SIA__.lesson.step = 7; window.__SIA__.render();`); await wait(250);
  await b.eval(clickText('Не хочу записувати голос')); await wait(300);
  await b.eval(`(() => { const t=document.querySelector('textarea.field'); t.value='I want to kill myself, nothing helps'; t.dispatchEvent(new Event('input',{bubbles:true})); })()`);
  await b.eval(clickText('Надіслати на розбір'));
  await waitFor(`window.__SIA__.lesson.crisis === true`, { label: 'кризовий екран' });
  await wait(250);
  const crisisTxt = await b.eval(text());
  check('кризовий екран спрацював', has(crisisTxt, 'Зупинімося на хвилину'));
  check('є контакти допомоги', has(crisisTxt, '988'));
  check('номер клікабельний', await b.eval(`!!document.querySelector('a[href^="tel:"]')`));
  check('прямо сказано, що це не служба допомоги', has(crisisTxt, 'не служба допомоги'));
  check('AI-розбір НЕ запускався', await b.eval('window.__SIA__.lesson.analysis === null'));
  await b.shot(SHOTS + '51-crisis.png', { full: true });

  /* ═══════════ Текстовий шлях ═══════════ */
  await b.eval(`window.__SIA__.lesson.crisis=false; window.__SIA__.lesson.step=8; window.__SIA__.lesson.textMode=true; window.__SIA__.render();`);
  await wait(300);
  await b.eval(`(() => { const t=document.querySelector('textarea.field'); t.value="This week I very worry about my documents. I not know what will be and I can't stop to think about it in the night."; t.dispatchEvent(new Event('input',{bubbles:true})); })()`);
  await b.shot(SHOTS + '52-text-path.png', { full: true });
  await b.eval(clickText('Надіслати на розбір'));
  await analysisReady(); await wait(250);
  const txtTr = await b.eval(text());
  check('текстовий шлях доходить до транскрипції', has(txtTr, 'Що почув застосунок'));
  check('текстовий шлях НЕ видається за розпізнавання', has(txtTr, 'рівно той текст, який ви написали'));
  check('використано САМЕ текст користувача',
    (await b.eval('window.__SIA__.lesson.transcript.text')).includes('documents'));
  await b.eval(clickText('Так, далі')); await wait(350);
  const myImproved = await b.eval('window.__SIA__.lesson.analysis.improved');
  check('розбір працює на власному тексті',
    myImproved.includes("I'm really worried") && myImproved.includes('stop thinking'), myImproved.slice(0, 70) + '…');

  /* ═══════════ Налаштування й видалення ═══════════ */
  await b.eval(`location.hash='#/settings'`); await wait(400);
  const setTxt = await b.eval(text());
  check('екран налаштувань', has(setTxt, 'Мої дані'));
  check('є показовий режим «відкрити всі дні»', has(setTxt, 'Відкрити всі готові дні'));
  check('є встановлення на головний екран', has(setTxt, 'Додати на головний екран'));
  await b.shot(SHOTS + '53-settings.png', { full: true });
  await b.eval(clickText('Видалити всі мої дані')); await wait(300);
  check('діалог підтвердження', await b.eval(`!!document.querySelector('.sheet')`));
  await b.eval(clickText('Так, видалити все')); await wait(500);
  check('після видалення — лендинг', has(await b.eval(text()), 'Твоя думка'));
  check('localStorage очищено', await b.eval(`localStorage.getItem('sia.v1') === null`));
  const logAfterWipe = await b.eval(`localStorage.getItem('sia.events') || '[]'`);
  check('журнал подій очищено від старих подій',
    !/lesson_completed|phrase_saved|voice_submitted|onboarding_completed|user_data_deleted/.test(logAfterWipe));

  /* ═══════════ Аналітика без вмісту ═══════════ */
  await b.eval(`localStorage.clear()`);
  await b.goto(URL_BASE); await wait(500);
  const evDump = await b.eval(`JSON.stringify(JSON.parse(localStorage.getItem('sia.events')||'[]'))`);
  check('події логуються', evDump.includes('landing_viewed'));
  check('у подіях немає вільного тексту', !/worried|documents|kill|anxious/i.test(evDump));

  /* ═══════════ Адаптивність ═══════════ */
  for (const [w, hgt, label] of [[320, 568, 'iphone-se'], [430, 932, 'iphone-pro-max'], [1280, 900, 'desktop']]) {
    await b.setViewport(w, hgt, 2);
    await b.goto(URL_BASE); await wait(500);
    check(`немає горизонтального скролу @ ${w}px (${label})`,
      await b.eval('document.documentElement.scrollWidth <= window.innerWidth + 1'));
    await b.shot(SHOTS + `60-width-${w}.png`);
  }

  await b.setViewport(390, 844, 2);
  await b.goto(URL_BASE); await wait(400);
  await b.eval(`document.documentElement.style.fontSize='22px'`); await wait(200);
  check('великий системний шрифт не ламає лейаут',
    await b.eval('document.documentElement.scrollWidth <= window.innerWidth + 1'));
  await b.shot(SHOTS + '61-large-font.png');

  /* ═══════════ PWA ═══════════ */
  await b.goto(URL_BASE); await wait(1200);
  const manifest = await b.eval(`fetch('./public/manifest.webmanifest').then(r=>r.ok?r.json():null).then(j=>j?JSON.stringify(j):null)`);
  check('manifest доступний і валідний', !!manifest && manifest.includes('standalone'));
  const swReg = await b.eval(`navigator.serviceWorker.getRegistrations().then(r=>r.length)`);
  check('service worker зареєстровано', swReg > 0, `реєстрацій: ${swReg}`);

  /* ═══════════ Підсумок ═══════════ */
  const FONT_NOISE = /fonts\.(googleapis|gstatic)\.com|ERR_TUNNEL_CONNECTION_FAILED|favicon/i;
  const errs = b.logs.filter(l => l.level === 'error' && !FONT_NOISE.test(l.text));
  check('немає помилок у консолі (крім недоступного Google Fonts у пісочниці)',
    errs.length === 0, errs.map(e => e.text).join(' | ').slice(0, 200));
  check('шрифт має робочий системний фолбек',
    await b.eval(`getComputedStyle(document.body).fontFamily.includes('-apple-system')`));

} catch (e) {
  fail++;
  results.push('FAIL  критична помилка прогону — ' + e.message);
  console.error('\nКРИТИЧНА ПОМИЛКА:', e.message);
} finally {
  await b.close();
}

console.log(`\n────────────────────────────\nPASS: ${pass}   FAIL: ${fail}\n`);
writeFileSync(new URL('../TEST_RESULTS.txt', import.meta.url).pathname,
  `Наскрізний прогін — ${new Date().toISOString()}\nChromium headless, 390×844 @2x\nПройдено всі три написані дні підряд.\n\n` +
  results.join('\n') + `\n\nPASS: ${pass}   FAIL: ${fail}\n`);
process.exit(fail ? 1 : 0);

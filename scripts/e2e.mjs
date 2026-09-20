#!/usr/bin/env node
/**
 * Наскрізний прогін застосунку в headless Chromium + знімки екранів.
 * Проходить усі сім днів маршруту підряд, як це робитиме людина.
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
const strayValues = [];
/** Ловить null/undefined/NaN, що просочилися в текст екрана. */
function sweepStray(where, screenText) {
  const m = String(screenText).match(/(?:^|[\s>])(null|undefined|NaN)(?=[\s<.,:;!?]|$)/g);
  if (m) strayValues.push(`${where}: ${[...new Set(m.map(x => x.trim()))].join(', ')}`);
}
const wait = (ms) => new Promise(r => setTimeout(r, ms));
// innerText враховує text-transform: uppercase, тому порівнюємо без регістру
const has = (hay, needle) => String(hay).toLocaleLowerCase('uk').includes(String(needle).toLocaleLowerCase('uk'));

const b = await launch({ width: 390, height: 844, dsf: 2 });

// Кожен знімок екрана заразом перевіряється на просочені null/undefined/NaN:
// так перевірка їде разом зі знімками й нічого не треба дописувати вручну.
const rawShot = b.shot.bind(b);
b.shot = async (path, opts) => {
  try { sweepStray(path.split('/').pop(), await b.eval(text())); } catch {}
  return rawShot(path, opts);
};

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
  if (o.checkBottomReachable) {
    // Липка панель «Далі» не повинна назавжди ховати останній блок сторінки:
    // прокрутивши до кінця, користувач мусить бачити його повністю.
    const clear = await b.eval(`(() => {
      window.scrollTo(0, document.body.scrollHeight);
      const bar = document.querySelector('.actionbar');
      const cards = [...document.querySelectorAll('.card')];
      const last = cards[cards.length - 1];
      if (!bar || !last) return -1;
      return Math.round(bar.getBoundingClientRect().top - last.getBoundingClientRect().bottom);
    })()`);
    check(`д${day}: прокрутка до кінця показує останній блок над панеллю`, clear >= 0, `запас ${clear}px`);
    await b.eval(`window.scrollTo(0, 0)`); await wait(150);
  }
  if (o.expectUsed || o.expectUnused) {
    const used = await b.eval(`JSON.stringify(window.__SIA__.lesson.analysis.usedTargets)`);
    const list = JSON.parse(used);
    for (const id of (o.expectUsed || [])) {
      check(`д${day}: зараховано «${id}» — воно справді є в сирому тексті`, list.includes(id), list.join(','));
    }
    for (const id of (o.expectUnused || [])) {
      check(`д${day}: НЕ зараховано «${id}» — людина цього не казала`, !list.includes(id), list.join(','));
    }
  }
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
  check('усі 7 днів написані — жодного «готується»', !has(routeTxt, 'Ще готується'));
  check('дні 2–7 замкнені до проходження попередніх',
    await b.eval(`[...document.querySelectorAll('.day')].filter(d => d.disabled).length === 6`));
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
    if (i === 1) {
      // Саме картка ВЛАСНОГО запису, а не програвач диктора: у ній була «null».
      const own = await b.eval(`(() => {
        const p = [...document.querySelectorAll('.player')]
          .find(e => e.innerText.includes('Як це прозвучало в тебе'));
        return p ? p.innerText.replace(/\\n/g, ' ⏎ ') : '(картки запису немає)';
      })()`);
      check('д1: картка власного запису знайдена', !own.startsWith('('), own);
      check('д1: у картці власного запису немає «null»', !/\bnull\b/.test(own), own);
    }
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
  check('д5: кнопка веде на день 6', has(d5done, 'Далі: день 6'));
  await b.shot(SHOTS + '41-day5-complete.png', { full: true });

  /* ═══════════════════════════════════════════
     ДЕНЬ 6 — сказати іншій людині
     ═══════════════════════════════════════════ */
  await b.eval(clickText('Далі: день 6')); await wait(500);
  check('день 6 відкрився', await b.eval(`window.__SIA__.lesson.day === 6`));
  await b.eval(clickText('Почати')); await wait(250);
  check('д6: запитання про те, що носиш сам', has(await b.eval(text()), 'ніхто не просив нести'));
  await b.eval(clickText('Далі')); await wait(250);
  check('д6: уривок 1 Петра 5:7 звірений', has(await b.eval(text()), 'всю вашу журбу'));
  await b.eval(clickText('Тепер англійською')); await wait(250);
  check('д6: BSB', has(await b.eval(text()), 'Cast all your anxiety'));
  await b.eval(clickText('Далі')); await wait(250);
  check('д6: контекст пояснює різкість «cast»', has(await b.eval(text()), 'жбурнути'));
  await b.shot(SHOTS + '42-day6-context.png', { full: true });

  await walkOpenDay(6, {
    shotPrefix: '43-day6',
    expectCorrection: "doesn't",
    expectInProof: ['carrying this alone', 'tell her'],
    nextLabel: 'Далі: день 7',
    expectUsed: ['careabout'],
    expectUnused: ['carrying', 'nothaveto'],
  });

  /* ═══════════════════════════════════════════
     ДЕНЬ 7 — монолог і порівняння
     ═══════════════════════════════════════════ */
  await b.eval(clickText('Далі: день 7')); await wait(500);
  check('день 7 відкрився', await b.eval(`window.__SIA__.lesson.day === 7`));
  const d7intro = await b.eval(text());
  check('д7: це монолог, найдовша відповідь', has(d7intro, 'Монолог 60–90 секунд'));
  check('д7: обіцяє порівняння з днем 3', has(d7intro, 'Порівняння з твоєю відповіддю в день 3'));
  await b.shot(SHOTS + '44-day7-intro.png', { full: true });

  await b.eval(clickText('Почати')); await wait(250);
  check('д7: запитання про тиждень і про завтра', has(await b.eval(text()), 'тиждень тому'));
  await b.eval(clickText('Далі')); await wait(250);
  const d7uk = await b.eval(text());
  check('д7: Псалом звірений', has(d7uk, 'Господь моє світло й спасіння моє'));
  check('д7: показані ОБИДВА номери псалма', has(d7uk, 'Псалом 26 (27)'));
  check('д7: розбіжність нумерації пояснена', has(d7uk, 'нумерацію'));
  await b.shot(SHOTS + '45-day7-scripture.png', { full: true });
  await b.eval(clickText('Тепер англійською')); await wait(250);
  const d7en = await b.eval(text());
  check('д7: BSB Psalm 27', has(d7en, 'my light and my salvation'));
  check('д7: англійське посилання — Psalm 27', has(d7en, 'Psalm 27:1, 3'));
  await b.eval(clickText('Далі')); await wait(250);
  check('д7: контекст про «боюся, але стою»', has(await b.eval(text()), 'боюся, але стою'));

  await walkOpenDay(7, {
    shotPrefix: '46-day7',
    expectCorrection: "couldn't",
    expectInProof: ['A week ago', 'Now I can', 'still working on it'],
    nextLabel: 'До підсумків маршруту',
    expectUsed: ['weekago', 'nowican', 'stillworking'],
    checkBottomReachable: true,
  });

  const d7done = await b.eval(text());
  check('д7: є блок порівняння «День 3 → День 7»', has(d7done, 'День 3 → День 7'));
  check('д7: показані секунди обох днів', has(d7done, 'секунд у день 3') && has(d7done, 'секунд сьогодні'));
  check('д7: є пара речень день 3 ↔ сьогодні',
    await b.eval(`document.querySelectorAll('.thought--original').length >= 1 && document.querySelectorAll('.thought--improved').length >= 1`));
  check('д7: маршрут позначено пройденим повністю', has(d7done, 'Маршрут пройдено повністю'));
  check('д7: усі 7 крапок маршруту засвічені',
    await b.eval(`document.querySelectorAll('.route-dots i.on').length === 7`));
  await b.shot(SHOTS + '47-day7-comparison.png', { full: true });

  /* ═══════════ Маршрут після семи днів ═══════════ */
  await b.eval(clickText('До підсумків маршруту')); await wait(450);
  const routeAfter = await b.eval(text());
  check('усі сім днів позначені пройденими',
    await b.eval(`document.querySelectorAll('.day.is-done').length === 7`));
  check('головна показує стан «маршрут пройдено»', has(routeAfter, 'Маршрут пройдено'));
  check('показано сумарний час мовлення', has(routeAfter, 'Разом ти говорив англійською'));
  check('пройдений день можна відкрити знову',
    await b.eval(`[...document.querySelectorAll('.day')].filter(d => !d.disabled).length === 7`));
  await b.shot(SHOTS + '48-route-complete.png', { full: true });

  /* ═══════════ Перезавантаження ═══════════ */
  await b.goto(URL_BASE); await wait(600);
  const afterReload = await b.eval(text());
  check('після перезавантаження — маршрут, а не лендинг',
    has(afterReload, 'Маршрут пройдено') || has(afterReload, 'Твій маршрут на 7 днів'));
  check('стан завершеного маршруту пережив перезавантаження', has(afterReload, 'Маршрут пройдено'));
  check('прогрес семи днів пережив перезавантаження',
    await b.eval(`window.__SIA__.state.completedDays.length === 7`));
  check('ім\'я збережено', has(afterReload, 'Олег'));

  /* ═══════════ Прогрес ═══════════ */
  await b.eval(clickText('Мій прогрес')); await wait(400);
  const prog = await b.eval(text());
  check('екран прогресу', has(prog, 'із семи днів пройдено'));
  check('прогрес рахує сім днів', has(prog, '7'));
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

  /* ═══════════════════════════════════════════
     ДРУГИЙ МАРШРУТ — «Далеко від дому»
     Фінал сьомого дня має бути дверима, а не глухим кутом. І перехід
     не сміє коштувати людині прогресу першого маршруту.
     ═══════════════════════════════════════════ */
  // Блок стоїть у кінці прогону, тож спершу повертаємося на головну
  // маршруту — до цього моменту застосунок міг лишитися на іншому екрані.
  await b.eval(`location.hash = '#/route'`); await wait(500);
  const routeHome = await b.eval(text());
  check('після фіналу видно іншу тему', has(routeHome, 'Інша тема') && has(routeHome, 'Далеко від дому'));
  check('двері з\'являються ЛИШЕ після завершення',
    await b.eval(`window.__SIA__.state.completedDays.length === 7`));

  await b.eval(clickText('Далеко від дому', '.choice')); await wait(500);
  const r2 = await b.eval(text());
  check('маршрут перемкнувся', await b.eval(`window.__SIA__.state.activeRoute === 'alone-7'`));
  check('другий маршрут має власну обіцянку', has(r2, 'найважче в житті тут'));
  check('прогрес другого маршруту порожній',
    await b.eval(`(window.__SIA__.state.completedDays || []).length === 0`));
  check('прогрес ПЕРШОГО маршруту не втрачено',
    await b.eval(`(window.__SIA__.state.byRoute['fear-7'].completedDays || []).length === 7`));
  check('написані дні доступні, ненаписані — ні',
    await b.eval(`[...document.querySelectorAll('.day')].filter(d => !d.disabled).length === 1`));
  check('усі сім днів другого маршруту написані — жодного «готується»', !has(r2, 'Ще готується'));
  check('усі 7 днів другого маршруту в списку', [1,2,3,4,5,6,7].every(n => has(r2, 'День ' + n)));
  await b.shot(SHOTS + '70-route2-home.png', { full: true });

  await b.eval(clickSel('.day.is-active')); await wait(450);
  check('день 1 другого маршруту відкрився', await b.eval(`window.__SIA__.lesson.day === 1`));
  check('це урок саме другого маршруту', has(await b.eval(text()), 'Ти тут не сам'));
  await b.eval(clickText('Почати')); await wait(250);
  await b.eval(clickText('Далі')); await wait(250);
  const r2uk = await b.eval(text());
  check('уривок Євреїв 13 звірений', has(r2uk, 'Я тебе не покину'));
  await b.eval(clickText('Тепер англійською')); await wait(250);
  check('BSB Hebrews 13', has(await b.eval(text()), 'Never will I leave you'));
  await b.shot(SHOTS + '71-route2-day1-scripture.png', { full: true });

  await b.eval(clickText('Далі')); await wait(250);   // англійська → контекст
  await b.eval(clickText('Далі')); await wait(250);   // контекст → фрази
  await b.eval(clickText('Далі')); await wait(250);   // фрази → згода
  await b.eval(clickText('Згоден, далі')); await wait(350);
  check('д1/м2: екран повторення за диктором', has(await b.eval(text()), 'Фраза 1 з 3'));
  await recordInto('.mic', 1600);
  check('д1/м2: фразу записано',
    await b.eval(`Object.keys(window.__SIA__.lesson.shadowRec).length === 1`));
  await b.shot(SHOTS + '72-route2-day1-shadow.png', { full: true });

  // Дні 2–5 другого маршруту — прохід поспіль, як робитиме людина.
  // Найважливіше тут день 3: з нього рахується прогрес і з ним потім
  // порівнюється сьомий.
  for (let i = 2; i <= 3; i++) {
    await b.eval(clickText('Наступна фраза')); await wait(350);
    await recordInto('.mic', 1400);
  }
  await b.eval(clickText('Завершити')); await wait(600);
  check('д1/м2: урок завершено', has(await b.eval(text()), 'День 1 — пройдено'));

  await b.eval(`location.hash = '#/route'`); await wait(450);
  await b.eval(clickSel('.day.is-active')); await wait(450);
  check('д2/м2: відкрився день 2', await b.eval(`window.__SIA__.lesson.day === 2`));
  await b.eval(clickText('Почати')); await wait(250);
  await b.eval(clickText('Далі')); await wait(250);
  check('д2/м2: Псалом 67 (68) звірений', has(await b.eval(text()), 'Бог самітних уводить до дому'));
  check('д2/м2: пояснено розбіжність у нумерації', has(await b.eval(text()), 'нумерацію') || has(await b.eval(text()), '67 (68)'));
  await b.eval(clickText('Тепер англійською')); await wait(250);
  check('д2/м2: BSB Psalm 68', has(await b.eval(text()), 'God settles the lonely'));
  await b.shot(SHOTS + '73-route2-day2-scripture.png', { full: true });
  await b.eval(clickText('Далі')); await wait(250);   // англійська → контекст
  await b.eval(clickText('Далі')); await wait(250);   // контекст → фрази
  await b.eval(clickText('Далі')); await wait(250);   // фрази → рамка
  const tpl = await b.eval(text());
  // Перевіряємо саме екран рамки, а не наявність фрази: «The hardest part
  // is» стоїть і на екрані конструкцій, тож м'яка перевірка мовчки
  // пропускала помилку в кількості кроків.
  check('д2/м2: екран рамки', has(tpl, 'Збери') && has(tpl, 'Твоє речення'));
  check('д2/м2: варіанти для обох слотів намальовані',
    await b.eval(`document.querySelectorAll('.chip').length >= 8`));
  await b.shot(SHOTS + '74-route2-day2-template.png', { full: true });

  await b.eval(clickText('eating alone', '.chip')); await wait(250);
  await b.eval(clickText('calling home', '.chip')); await wait(250);
  check('д2/м2: речення зібралося',
    has(await b.eval(text()), 'The hardest part is eating alone. What helps is calling home.'));
  await b.eval(clickText('Це моє речення')); await wait(300);
  await b.eval(clickText('Згоден, далі')); await wait(350);
  await recordInto('.mic', 2000);
  await b.eval(clickText('Надіслати на розбір'));
  await analysisReady(); await wait(250);
  check('д2/м2: демо-текст саме другого маршруту',
    (await b.eval(`window.__SIA__.lesson.transcript.text`)).includes('The hardest part is eat alone'));
  await b.eval(clickText('Так, далі')); await wait(350);
  check('д2/м2: спіймано «is eat»', has(await b.eval(text()), 'part is eating'));
  await b.eval(clickText('Показати природнішу версію')); await wait(350);
  await b.eval(clickText('Далі')); await wait(300);
  await b.eval(clickText('Зберегти мою фразу')); await wait(500);
  check('д2/м2: урок завершено', has(await b.eval(text()), 'День 2 — пройдено'));

  /* ───────── День 3 другого маршруту: звідси рахується прогрес ───────── */
  await b.eval(clickText('Далі: день 3')); await wait(500);
  check('д3/м2: день 3 відкрився', await b.eval(`window.__SIA__.lesson.day === 3`));
  await b.eval(clickText('Почати')); await wait(250);
  check('д3/м2: запитання про те, за ким сумуєш', has(await b.eval(text()), 'сумуєш'));
  await b.eval(clickText('Далі')); await wait(250);
  const a3uk = await b.eval(text());
  check('д3/м2: Псалом звірений', has(a3uk, 'Як лине той олень'));
  // Четвертий і найгірший випадок розбіжності: різні видання Огієнка дають
  // цьому рядку різні номери ВІРШІВ. Людина з паперовою Біблією мусить
  // бачити обидві нумерації, інакше просто не знайде місця.
  check('д3/м2: показані обидві нумерації', has(a3uk, '42:1') && has(a3uk, '41 (42)'));
  await b.eval(clickText('Тепер англійською')); await wait(250);
  check('д3/м2: BSB Psalm 42', has(await b.eval(text()), 'As the deer pants'));
  await b.shot(SHOTS + '75-route2-day3-scripture.png', { full: true });
  await b.eval(clickText('Далі')); await wait(250);
  await walkOpenDay(3, {
    shotPrefix: '76-route2-day3',
    expectCorrection: 'really miss',
    expectInProof: ['used to talk', 'knows me'],
    nextLabel: 'Далі: день 4',
    expectUsed: ['weusedto'],
    expectUnused: ['ireallymiss'],
  });
  const secs3 = await b.eval(`window.__SIA__.state.lessons['3'].speechMs`);
  check('д3/м2: тривалість мовлення записана саме в цьому маршруті', secs3 > 0, `${secs3} мс`);

  /* ───────── День 4 ───────── */
  await b.eval(clickText('Далі: день 4')); await wait(500);
  await b.eval(clickText('Почати')); await wait(250);
  check('д4/м2: запитання про перший раз', has(await b.eval(text()), 'вперше відчув'));
  await b.eval(clickText('Далі')); await wait(250);
  check('д4/м2: Вихід 2:22 звірений', has(await b.eval(text()), 'приходьком у чужому краї'));
  await b.eval(clickText('Тепер англійською')); await wait(250);
  check('д4/м2: BSB Exodus 2', has(await b.eval(text()), 'a foreigner in a foreign land'));
  await b.eval(clickText('Далі')); await wait(250);
  await walkOpenDay(4, {
    shotPrefix: '77-route2-day4',
    expectCorrection: "didn't know",
    expectInProof: ['I went to a party', 'everybody laughed'],
    nextLabel: 'Далі: день 5',
    expectUsed: ['firsttime'],
  });

  /* ───────── День 5 ───────── */
  await b.eval(clickText('Далі: день 5')); await wait(500);
  await b.eval(clickText('Почати')); await wait(250);
  await b.eval(clickText('Далі')); await wait(250);
  check('д5/м2: Екклезіяста 4 звірений', has(await b.eval(text()), 'Краще двом, як одному'));
  await b.eval(clickText('Тепер англійською')); await wait(250);
  check('д5/м2: BSB Ecclesiastes 4', has(await b.eval(text()), 'Two are better than one'));
  await b.eval(clickText('Далі')); await wait(250);
  await walkOpenDay(5, {
    shotPrefix: '78-route2-day5',
    expectCorrection: 'will ask',
    expectInProof: ['There is a man', 'could have lunch'],
    nextLabel: 'Далі: день 6',
    expectUsed: ['maybewecould', 'itsawkward'],
  });

  /* ───────── День 6: сказати це іншому ───────── */
  await b.eval(clickText('Далі: день 6')); await wait(500);
  await b.eval(clickText('Почати')); await wait(250);
  check('д6/м2: адресат — інша людина', has(await b.eval(text()), 'приїхала сюди місяць тому'));
  await b.eval(clickText('Далі')); await wait(250);
  check('д6/м2: Левит 19 звірений', has(await b.eval(text()), 'не будете гнобити його'));
  await b.eval(clickText('Тепер англійською')); await wait(250);
  check('д6/м2: BSB Leviticus 19', has(await b.eval(text()), 'When a foreigner resides with you'));
  await b.eval(clickText('Далі')); await wait(250);
  check('д6/м2: контекст про пам\'ять, а не про доброту', has(await b.eval(text()), 'пам'));
  await walkOpenDay(6, {
    shotPrefix: '79-route2-day6',
    expectCorrection: 'tell me',
    expectInProof: ['When I came here', 'It takes time'],
    nextLabel: 'Далі: день 7',
    // Найважливіша перевірка дня: у сирому тексті сказано «you can say me»,
    // «it need time» і «I know how is it». Це помилкові форми всіх трьох
    // цілей — жодна не сміє зарахуватися. Метрика, яка хвалить за несказане,
    // гірша за відсутність метрики.
    expectUnused: ['iknowhow', 'ittakestime', 'youcantell'],
  });
  check('д6/м2: екран чесно каже, що жодна конструкція не прозвучала',
    has(await b.eval(text()), 'жодна з трьох не прозвучала'));

  /* ───────── День 7: монолог і порівняння з днем 3 ───────── */
  await b.eval(clickText('Далі: день 7')); await wait(500);
  const a7intro = await b.eval(text());
  check('д7/м2: це монолог', has(a7intro, 'півтори хвилини') || has(a7intro, 'Монолог'));
  await b.eval(clickText('Почати')); await wait(250);
  check('д7/м2: запитання про дім', has(await b.eval(text()), 'тепер дім'));
  await b.eval(clickText('Далі')); await wait(250);
  check('д7/м2: Євреїв 11 звірений', has(await b.eval(text()), 'не одержавши обітниць'));
  await b.eval(clickText('Тепер англійською')); await wait(250);
  check('д7/м2: BSB Hebrews 11', has(await b.eval(text()), 'died in faith'));
  await b.shot(SHOTS + '80-route2-day7-scripture.png', { full: true });
  await b.eval(clickText('Далі')); await wait(250);
  await walkOpenDay(7, {
    shotPrefix: '81-route2-day7',
    expectCorrection: 'happened',
    expectInProof: ["mother's kitchen", "I'm still learning"],
    nextLabel: 'До підсумків маршруту',
    expectUsed: ['aweekago', 'homeisnow', 'stilllearning'],
    checkBottomReachable: true,
  });

  const a7done = await b.eval(text());
  check('д7/м2: є блок порівняння «День 3 → День 7»', has(a7done, 'День 3 → День 7'));
  check('д7/м2: порівняння взяло дані ДРУГОГО маршруту, а не першого',
    !has(a7done, 'Дані дня 3 не знайдені'));
  check('д7/м2: показані секунди обох днів',
    has(a7done, 'секунд у день 3') && has(a7done, 'секунд сьогодні'));
  check('д7/м2: маршрут пройдено повністю', has(a7done, 'Маршрут пройдено повністю'));
  check('д7/м2: усі 7 крапок засвічені',
    await b.eval(`document.querySelectorAll('.route-dots i.on').length === 7`));
  await b.shot(SHOTS + '82-route2-day7-comparison.png', { full: true });

  await b.eval(clickText('До підсумків маршруту')); await wait(450);
  check('обидва маршрути пройдені й це видно',
    await b.eval(`window.__SIA__.state.byRoute['fear-7'].completedDays.length === 7
      && window.__SIA__.state.byRoute['alone-7'].completedDays.length === 7`));
  const bothDone = await b.eval(text());
  check('пройдена тема не видається за нову',
    !has(bothDone, 'Інша тема') && has(bothDone, 'Пройдені теми'));
  check('видно, що в першій темі вже пройдено сім днів', has(bothDone, 'Пройдено днів: 7'));
  await b.shot(SHOTS + '83-route2-complete.png', { full: true });

  // Повернення до першого маршруту не мусить нічого стерти. Перемикаємося
  // так само, як людина, — карткою теми, а не викликом зсередини.
  await b.eval(clickText('Не бійся говорити', '.choice')); await wait(500);
  check('повернення в перший маршрут зберігає його прогрес',
    await b.eval(`window.__SIA__.state.completedDays.length === 7
      && window.__SIA__.state.activeRoute === 'fear-7'`));
  await b.eval(clickText('Далеко від дому', '.choice')); await wait(500);
  check('і прогрес другого теж на місці',
    await b.eval(`window.__SIA__.state.completedDays.length === 7
      && window.__SIA__.state.activeRoute === 'alone-7'`));

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
  // Найдешевша перевірка на цілий клас помилок: DOM перетворює null на текст
  // «null», і він мовчки з'являється на екрані. Те саме з undefined і NaN.
  check('на жодному пройденому екрані не лишилося «null» / «undefined» / «NaN»',
    !strayValues.length, strayValues.join(' | ') || 'чисто');

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
  `Наскрізний прогін — ${new Date().toISOString()}\nChromium headless, 390×844 @2x\nПройдено всі сім днів маршруту підряд.\n\n` +
  results.join('\n') + `\n\nPASS: ${pass}   FAIL: ${fail}\n`);
process.exit(fail ? 1 : 0);

// Додаткові знімки у в'юпорті (не full-page), щоб було видно реальний вигляд
// з липкою нижньою панеллю.
import { launch } from './cdp.mjs';
const URL_BASE = process.env.SIA_URL || 'http://localhost:5173/index.html';
const S = new URL('../screenshots/', import.meta.url).pathname;
const wait = (ms) => new Promise(r => setTimeout(r, ms));

const SEED = {
  version: 1, onboarded: true, name: 'Олег', region: 'us', comfort: 'few',
  mode: 'christian', reminder: 'morning', activeDay: 3, completedDays: [],
  savedPhrases: [], lessons: {}, consent: { voice: true, at: null },
  privacy: { keepAudio: false }, recordings: {}, createdAt: null,
};

const b = await launch({ width: 390, height: 844, dsf: 2 });
await b.goto(URL_BASE);
await b.eval(`localStorage.setItem('sia.v1', ${JSON.stringify(JSON.stringify(SEED))})`);
await b.goto(URL_BASE);           // повне перезавантаження, щоб стан підхопився
await wait(500);
await b.shot(S + 'v-route.png');

await b.eval(`location.hash = '#/lesson/3'`); await wait(400);
for (const [step, name] of [[0, 'intro'], [5, 'phrases'], [7, 'consent'], [8, 'record']]) {
  await b.eval(`window.__SIA__.lesson.step = ${step}; window.__SIA__.render()`);
  await wait(300);
  await b.shot(S + `v-lesson-${name}.png`);
}

// стан «іде запис»
await b.eval(`window.__SIA__.lesson.step = 8; window.__SIA__.render()`); await wait(250);
await b.eval(`document.querySelector('.mic').click()`); await wait(2000);
await b.shot(S + 'v-recording.png');
await b.eval(`document.querySelector('.mic').click()`); await wait(900);
await b.eval(`document.querySelector('.actionbar button').click()`);
for (let i = 0; i < 60 && !(await b.eval(`window.__SIA__.lesson.analysis !== null`)); i++) await wait(150);
await wait(300);
await b.shot(S + 'v-transcript.png');
await b.eval(`[...document.querySelectorAll('button')].find(x=>x.textContent.includes('Так, далі')).click()`); await wait(400);
await b.shot(S + 'v-corrections.png');
await b.eval(`[...document.querySelectorAll('button')].find(x=>x.textContent.includes('Показати природнішу')).click()`); await wait(400);
await b.shot(S + 'v-improved.png');

// темна тема
await b.eval(`document.documentElement.setAttribute('data-theme','dark')`); await wait(300);
await b.shot(S + 'v-improved-dark.png');
await b.eval(`location.hash='#/route'`); await wait(400);
await b.shot(S + 'v-route-dark.png');

console.log('знімки готові');
await b.close();

// Сторінка статистики для власника. Показує рівно те, заради чого
// збиралися події: скільки людей дійшло до кожного кроку і скільки
// повернулося наступного дня.
//
// Тексту відповідей тут немає й бути не може — його немає в базі.

const esc = (s) => String(s).replace(/[&<>"]/g, c => (
  { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

/** Лійка: кроки в тому порядку, у якому їх проходить людина. */
const FUNNEL = [
  ['landing_viewed', 'Відкрили лендинг'],
  ['onboarding_started', 'Почали онбординг'],
  ['onboarding_completed', 'Пройшли онбординг'],
  ['lesson_started', 'Відкрили урок'],
  ['consent_accepted', 'Дали згоду на голос'],
  ['voice_recording_started', 'Натиснули запис'],
  ['voice_submitted', 'Надіслали на розбір'],
  ['transcription_succeeded', 'Мову розпізнано'],
  ['lesson_completed', 'Завершили урок'],
  ['phrase_saved', 'Зберегли фразу'],
];

export async function statsPage(env) {
  const db = env.DB;
  const one = async (sql, ...args) => {
    const r = await db.prepare(sql).bind(...args).first();
    return r ? Object.values(r)[0] : 0;
  };

  const devices = await one('SELECT COUNT(DISTINCT device) FROM events');
  const total = await one('SELECT COUNT(*) FROM events');

  const rows = [];
  for (const [name, label] of FUNNEL) {
    const n = await one('SELECT COUNT(DISTINCT device) FROM events WHERE name = ?', name);
    rows.push({ label, n, pct: devices ? Math.round((n / devices) * 100) : 0 });
  }

  // Скільки людей завершили урок більш ніж одного дня — це і є повернення.
  const returned = await one(
    'SELECT COUNT(*) FROM (SELECT device FROM events WHERE name = ? ' +
    'GROUP BY device HAVING COUNT(DISTINCT day) > 1)', 'lesson_completed');

  const byDay = await db.prepare(
    'SELECT day, COUNT(DISTINCT device) AS n FROM events ' +
    'WHERE name = ? AND day IS NOT NULL GROUP BY day ORDER BY day'
  ).bind('lesson_completed').all();

  const textPath = await one('SELECT COUNT(DISTINCT device) FROM events WHERE name = ?', 'text_fallback_used');
  const micDenied = await one('SELECT COUNT(DISTINCT device) FROM events WHERE name = ?', 'microphone_permission_denied');
  const failed = await one('SELECT COUNT(*) FROM events WHERE name = ?', 'transcription_failed');

  const bar = (pct) =>
    `<div class="bar"><i style="width:${pct}%"></i></div>`;

  const funnelHtml = rows.map(r => `
    <tr><td>${esc(r.label)}</td><td class="n">${r.n}</td>
    <td class="p">${r.pct}%</td><td class="b">${bar(r.pct)}</td></tr>`).join('');

  const daysHtml = (byDay.results || []).map(r =>
    `<tr><td>День ${esc(r.day)}</td><td class="n">${esc(r.n)}</td></tr>`).join('')
    || '<tr><td colspan="2" class="muted">Ще жодного завершеного дня.</td></tr>';

  return `<!doctype html><html lang="uk"><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>Статистика · Say It Anyway</title>
<style>
  :root { color-scheme: light; }
  body { font: 16px/1.5 -apple-system, system-ui, sans-serif; background:#F5F3EB; color:#2F4C3D;
         margin:0; padding:28px 18px 60px; }
  .wrap { max-width: 640px; margin: 0 auto; }
  h1 { font-size: 1.5rem; font-weight: 560; letter-spacing:-.03em; margin:0 0 4px; }
  h2 { font-size: .78rem; text-transform: uppercase; letter-spacing:.12em; color:#7A8C62;
       margin: 32px 0 10px; font-weight:600; }
  .big { display:flex; gap:26px; margin:18px 0 6px; }
  .big div b { display:block; font-size:2rem; font-weight:560; letter-spacing:-.04em; }
  .big div span { font-size:.8rem; color:#7A8C62; }
  table { width:100%; border-collapse:collapse; }
  td { padding:7px 0; border-bottom:1px solid rgba(47,76,61,.1); vertical-align:middle; }
  td.n { text-align:right; font-variant-numeric:tabular-nums; width:52px; font-weight:560; }
  td.p { text-align:right; font-variant-numeric:tabular-nums; width:52px; color:#7A8C62; font-size:.85rem; }
  td.b { width:110px; padding-left:14px; }
  .bar { background:rgba(47,76,61,.1); height:7px; border-radius:4px; overflow:hidden; }
  .bar i { display:block; height:100%; background:#7A8C62; }
  .muted { color:#7A8C62; }
  .note { margin-top:34px; font-size:.82rem; color:#7A8C62; border-top:1px solid rgba(47,76,61,.12);
          padding-top:14px; }
</style>
<div class="wrap">
  <h1>Статистика</h1>
  <p class="muted" style="margin:0">Оновлюється при кожному відкритті сторінки.</p>

  <div class="big">
    <div><b>${devices}</b><span>людей</span></div>
    <div><b>${returned}</b><span>повернулися на другий день</span></div>
    <div><b>${total}</b><span>подій</span></div>
  </div>

  <h2>Шлях людини</h2>
  <table>${funnelHtml}</table>

  <h2>Завершені дні</h2>
  <table>${daysHtml}</table>

  <h2>Проблеми</h2>
  <table>
    <tr><td>Пішли текстом замість голосу</td><td class="n">${textPath}</td></tr>
    <tr><td>Заборонили мікрофон</td><td class="n">${micDenied}</td></tr>
    <tr><td>Розпізнавання впало</td><td class="n">${failed}</td></tr>
  </table>

  <p class="note">Тут немає й не може бути тексту відповідей, транскрипцій,
  імен чи аудіо — цих даних немає в базі. Зберігаються тільки назва події
  з білого списку, номер дня, час і анонімний ідентифікатор пристрою.</p>
</div></html>`;
}

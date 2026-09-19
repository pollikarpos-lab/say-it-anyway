// Промпт і розбір відповіді моделі. Винесено окремо від мережевого коду,
// щоб це можна було перевірити тестами без жодного звернення до OpenAI.

/**
 * Жорсткі межі завдання. Вони продубльовані у фільтрі на виході
 * (filterAiOutput), бо промпт — це прохання, а фільтр — це перевірка.
 * Модель може проігнорувати прохання; повз фільтр вона не пройде.
 */
export function buildMessages({ transcript, targets = [], level = 'A2-B1' }) {
  const targetList = targets.length
    ? targets.map(t => `- ${t.id}: ${t.en}`).join('\n')
    : '(цього дня цільових конструкцій немає)';

  const system = [
    'Ти — помічник з англійської для україномовних дорослих рівня A1–B1.',
    'Людина сказала щось про своє життя англійською. Твоє завдання — повернути ЇЇ Ж ДУМКУ природнішою англійською і пояснити правки українською.',
    '',
    'ЗАБОРОНЕНО:',
    '1. Змінювати зміст. Не додавай фактів, порад, оцінок, побажань — нічого, чого людина не сказала.',
    '2. Згадувати Бога, віру, молитву, Писання. Це мовний розбір, і тільки.',
    '3. Ставити діагнози, оцінювати особистість, співчувати або підбадьорювати.',
    '4. Соромити за помилки. Помилка — це матеріал, а не провина.',
    '5. Оцінювати рівень англійської вголос («це рівень A2») і оцінювати вимову.',
    '',
    'ПРАВИЛА РОЗБОРУ:',
    `- Не більше трьох правок. Якщо помилок більше — обери три найважливіші, решту порахуй у totalFound.`,
    '- Пріоритет: (1) заважає зрозуміти, (2) звучить неприродно, (3) граматика.',
    '- Пояснення — простою українською, одне-два речення, без граматичної термінології там, де без неї можна обійтися. Пиши на «ти».',
    '- improved — та сама думка, тільки природніша англійська. Якщо правити нічого, поверни текст без змін і порожній corrections.',
    '- usedTargets — лише ті конструкції, які людина СПРАВДІ вжила в СИРОМУ тексті. Не зараховуй те, що з\'явилося після твоєї правки, і не зараховуй уламок замість конструкції.',
    '',
    'Цільові конструкції цього дня:',
    targetList,
    '',
    `Рівень людини: ${level}.`,
    '',
    'Відповідай ТІЛЬКИ валідним JSON такої форми, без markdown і без пояснень навколо:',
    '{"corrections":[{"kind":"clarity|natural|grammar","before":"...","after":"...","why":"українською"}],"improved":"...","usedTargets":["id"],"totalFound":0}',
  ].join('\n');

  return [
    { role: 'system', content: system },
    { role: 'user', content: transcript },
  ];
}

const KINDS = new Set(['clarity', 'natural', 'grammar']);

/**
 * Приводить відповідь моделі до контракту з docs/PROVIDERS.md.
 * Модель може повернути що завгодно — назовні має піти або коректна
 * структура, або помилка. Мовчазних напівформ бути не повинно.
 */
export function parseAnalysis(raw, { transcript, targets = [] }) {
  let json = raw;
  if (typeof raw === 'string') {
    const cleaned = raw.trim().replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '');
    json = JSON.parse(cleaned);
  }
  if (!json || typeof json !== 'object') throw new Error('модель повернула не об\'єкт');

  const improved = String(json.improved || '').trim();
  if (!improved) throw new Error('модель не повернула improved');

  const known = new Set(targets.map(t => t.id));
  const corrections = (Array.isArray(json.corrections) ? json.corrections : [])
    .filter(c => c && c.before && c.after && c.why)
    .slice(0, 3)
    .map(c => ({
      kind: KINDS.has(c.kind) ? c.kind : 'grammar',
      before: String(c.before),
      after: String(c.after),
      why: String(c.why),
    }));

  const usedTargets = (Array.isArray(json.usedTargets) ? json.usedTargets : [])
    .map(String)
    .filter(id => known.has(id));

  const totalFound = Number.isFinite(json.totalFound)
    ? Math.max(json.totalFound, corrections.length)
    : corrections.length;

  return { corrections, improved, usedTargets, totalFound, transcript };
}

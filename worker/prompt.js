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


/**
 * Витягує текст відповіді, не знаючи заздалегідь, який саме інтерфейс
 * відповів. OpenAI має два: старий /chat/completions і новіший
 * /responses, і форми відповіді в них різні. Кутись гадати, який із них
 * доступний на конкретному акаунті, — марно: краще розуміти обидва.
 */
export function extractText(data) {
  if (!data || typeof data !== 'object') return '';

  // /v1/responses — зручне поле, якщо є
  if (typeof data.output_text === 'string' && data.output_text.trim()) {
    return data.output_text;
  }
  // /v1/responses — повна форма: output[].content[].text
  if (Array.isArray(data.output)) {
    const parts = [];
    for (const item of data.output) {
      for (const c of (item && Array.isArray(item.content) ? item.content : [])) {
        if (c && typeof c.text === 'string') parts.push(c.text);
      }
    }
    if (parts.length) return parts.join('');
  }
  // /v1/chat/completions — стара форма
  const msg = data.choices && data.choices[0] && data.choices[0].message;
  if (msg && typeof msg.content === 'string') return msg.content;

  return '';
}

/** Тіло запиту під той інтерфейс, який насправді доступний. */
export function buildRequestBody({ path, model, messages, maxTokens = 900 }) {
  const isChat = String(path).includes('chat/completions');
  if (isChat) {
    return {
      model, messages,
      temperature: 0.2,
      response_format: { type: 'json_object' },
      max_tokens: maxTokens,
    };
  }
  // /v1/responses: системна частина йде окремо в instructions
  const system = messages.find(m => m.role === 'system');
  const user = messages.find(m => m.role === 'user');
  return {
    model,
    instructions: system ? system.content : undefined,
    input: user ? user.content : '',
    max_output_tokens: maxTokens,
  };
}

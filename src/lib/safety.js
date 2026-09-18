// Два незалежні запобіжники.
//
// 1) detectCrisis() — сканує ВІДПОВІДЬ КОРИСТУВАЧА. Якщо є ознаки кризи,
//    жоден AI-текст не генерується: показується статичний екран допомоги.
// 2) filterAiOutput() — сканує ВИХІД AI. Заборонені формулювання не
//    «просяться» в промпті, а блокуються кодом перед показом.
//
// ВАЖЛИВО: у JavaScript \b працює тільки для [A-Za-z0-9_], тому для
// кирилиці межі слова будуються через \P{L} / (?!\p{L}) з прапорцем `u`.
// Lookbehind свідомо НЕ використовується — його немає в Safari до 16.4,
// а падіння на цьому модулі зламало б увесь застосунок на старих iPhone.

const S = '(?:^|\\P{L})';      // початок або не-літера
const E = '(?!\\p{L})';        // далі не літера
const AP = "['’ʼ]";  // ' ’ ʼ

const uk = (body) => new RegExp(S + body + E, 'iu');
const en = (body) => new RegExp('\\b' + body + '\\b', 'i');

const CRISIS_PATTERNS = [
  // українська
  uk('не\\s+хочу\\s+(?:більше\\s+)?жити'),
  uk('хочу\\s+(?:по)?мерти'),
  uk('краще\\s+б\\s+я\\s+помер'),
  uk('покінчити\\s+з\\s+соб[оі]ю?'),
  uk('заподіяти\\s+собі'),
  uk('(?:ріж|різа)[а-яіїєґ]*\\s+себе'),
  uk('самогубств[а-яіїєґ]*'),
  uk('суїцид[а-яіїєґ]*'),
  uk('мене\\s+б' + AP + '?є(?:ть)?'),
  uk('б' + AP + '?є\\s+мене'),
  uk('боюся\\s+за\\s+своє\\s+життя'),
  uk('немає\\s+сенсу\\s+жити'),
  uk('не\\s+бачу\\s+сенсу\\s+жити'),
  // англійська (\b тут коректний)
  en('kill\\s+my\\s?self'),
  en('killing\\s+my\\s?self'),
  en('want\\s+to\\s+die'),
  en('wanna\\s+die'),
  en('end\\s+my\\s+life'),
  en('suicid\\w*'),
  en('self[-\\s]?harm'),
  en('cut(?:ting)?\\s+my\\s?self'),
  en('hurt\\s+my\\s?self'),
  en('(?:he|she|they)\\s+(?:hits?|beats?)\\s+me'),
  en('being\\s+abused'),
  en('not\\s+safe\\s+at\\s+home'),
  en('afraid\\s+for\\s+my\\s+life'),
  en('no\\s+reason\\s+to\\s+live'),
];

/** @returns {{crisis:boolean, matched:string|null}} */
export function detectCrisis(text) {
  const t = String(text || '');
  for (const re of CRISIS_PATTERNS) {
    if (re.test(t)) return { crisis: true, matched: re.source };
  }
  return { crisis: false, matched: null };
}

// Формулювання, які AI не має права показати. Перевірка на ВИХОДІ.
const FORBIDDEN = [
  { re: uk('(?:бог|господь)\\s+(?:сказав|каже|говорить|показує|показав|хоче)[^.!?]{0,20}?\\s+(?:тобі|вам|тебе)'), why: 'мовлення від імені Бога' },
  { re: en('God\\s+(?:is\\s+)?(?:telling|saying|showing)\\s+you'), why: 'мовлення від імені Бога' },
  { re: en('the\\s+Lord\\s+(?:is\\s+)?(?:telling|showing)\\s+you'), why: 'мовлення від імені Бога' },
  { re: uk('це\\s+(?:твій\\s+)?знак(?:\\s+(?:від\\s+бога|згори))?'), why: 'тлумачення знаків' },
  { re: uk('бог\\s+(?:зцілить|обов' + AP + '?язково\\s+дасть|дасть\\s+тобі\\s+гроші)'), why: 'обіцянка результату' },
  { re: uk('(?:ти|у\\s+тебе)\\s+слабк[аиійо]+\\s+вір[аи]'), why: 'оцінка віри людини' },
  { re: uk('тво[яє]\\s+віра\\s+(?:слабка|недостатня|мала)'), why: 'оцінка віри людини' },
  { re: uk('у\\s+тебе\\s+(?:депресія|тривожний\\s+розлад|панічн[аі][^\\s]*)'), why: 'психологічний діагноз' },
  { re: en('you\\s+have\\s+(?:depression|anxiety\\s+disorder|PTSD)'), why: 'психологічний діагноз' },
  { re: uk('ти\\s+(?:будеш\\s+)?зцілен[аийо]*'), why: 'обіцянка зцілення' },
  { re: uk('гарантую'), why: 'гарантія результату' },
  { re: uk('тві[йя]\\s+статус\\s+(?:буде|вирішиться|схвалять)'), why: 'обіцянка імміграційного результату' },
];

/**
 * @returns {{ok:boolean, violations:{why:string}[], text:string}}
 * Якщо є порушення — текст НЕ показується; повертається безпечна заглушка.
 */
export function filterAiOutput(text) {
  const t = String(text || '');
  const violations = FORBIDDEN.filter(f => f.re.test(t)).map(f => ({ why: f.why }));
  if (violations.length) {
    return {
      ok: false,
      violations,
      text: 'Розбір не показано: відповідь помічника не пройшла перевірку безпеки. Спробуйте ще раз.',
    };
  }
  return { ok: true, violations: [], text: t };
}

/** Контакти допомоги для кризового екрана. Статичні, без AI. */
export const CRISIS_RESOURCES = [
  { region: 'США / Канада', name: '988 Suicide & Crisis Lifeline', contact: 'Зателефонувати 988', tel: '988', note: 'Цілодобово, є підтримка інших мов. Можна також написати SMS на 988.' },
  { region: 'США', name: 'Crisis Text Line', contact: 'SMS: HOME на 741741', note: 'Цілодобово, англійською' },
  { region: 'Україна', name: 'Lifeline Ukraine', contact: 'Зателефонувати 7333', tel: '7333', note: 'Цілодобово, безкоштовно' },
  { region: 'Європа', name: 'Єдиний номер екстреної допомоги', contact: 'Зателефонувати 112', tel: '112', note: 'Працює в усіх країнах ЄС' },
];

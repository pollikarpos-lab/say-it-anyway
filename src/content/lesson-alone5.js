// Маршрут «Далеко від дому», день 5 — «Одна людина». Майбутній час.
// Як і в першому маршруті, п'ятий день — єдиний, після якого лишається
// справа поза застосунком. І справа тут конкретна: одна людина, одне
// повідомлення.

export const LESSON_ALONE5 = {
  route: 'alone-7',
  day: 5,
  kind: 'open',
  passageId: 'ecc4.9-10',
  title: 'Одна людина',
  steps: ['intro', 'question', 'scripture-uk', 'scripture-en', 'context', 'phrases', 'sample',
          'consent', 'record', 'review', 'processing', 'transcript', 'corrections', 'improved',
          'save-phrase', 'complete'],

  intro: {
    christian: 'Учора про те, що вже було. Сьогодні про те, чого ще не було: одна людина тут, до якої ти підійдеш цього тижня. Не друг на все життя — просто перший крок.',
    open: 'Учора про те, що вже було. Сьогодні про те, чого ще не було: одна людина тут, до якої ти підійдеш цього тижня. Не друг на все життя — просто перший крок.',
  },

  lifeQuestion: 'Хто тут міг би стати своїм — і що ти йому скажеш цього тижня?',
  lifeQuestionNote: 'Не треба шукати ідеального кандидата. Досить того, з ким уже вітаєшся.',

  targets: [
    {
      id: 'iwillask', en: 'I will ask…', uk: 'Я запитаю…',
      note: 'Після will дієслово в початковій формі: I will ask, I will invite. Не «will asked».',
      example: 'I will ask him if he wants to have coffee.',
      match: [/\bi\s+will\s+ask\b/i, /\bi(?:'|’)?ll\s+ask\b/i],
    },
    {
      id: 'maybewecould', en: 'Maybe we could…', uk: 'Можливо, ми могли б…',
      note: 'Could — м’якша форма, ніж can: не наполягаєш, а пропонуєш. Після нього теж початкова форма.',
      example: 'Maybe we could go for a walk sometime.',
      match: [/\bmaybe\s+we\s+could\b/i],
    },
    {
      id: 'itsawkward', en: "It's a bit awkward, but…", uk: 'Трохи незручно, але…',
      note: 'Awkward — саме те слово для цього відчуття: не «страшно» й не «соромно», а незручно. Носії вживають його постійно.',
      example: "It's a bit awkward, but I'll ask anyway.",
      match: [/\ba\s+bit\s+awkward\b/i, /\bit(?:'|’)?s\s+awkward\b/i],
    },
  ],

  sampleAnswer: {
    text: "There is a man at my work, we always say hello but nothing more. It's a bit awkward, but this week I will ask him about his family. Maybe we could have lunch together one day.",
    level: 'A2–B1',
    note: 'Хто → чому досі не → що зробиш. Останнє речення має бути про дію, а не про намір.',
  },

  voicePrompt: {
    christian: 'Скажи вголос, що саме ти зробиш. Назване вголос робиться частіше за задумане подумки.',
    open: 'Скажи вголос, що саме ти зробиш. Назване вголос робиться частіше за задумане подумки.',
  },

  practice: {
    christian: {
      title: 'Коротка молитва',
      body: 'Екклезіяст каже прямо: хто впаде сам, той лишиться лежати. Попроси не про настрій, а про конкретне — про цю одну людину.',
    },
    open: {
      title: 'Хвилина для себе',
      body: 'Уяви цю розмову до кінця. Найгірше, що станеться, — вона буде короткою.',
    },
  },

  step: {
    christian: 'Це єдиний день, після якого лишається справа. Підійди до цієї людини цього тижня. Не «колись».',
    open: 'Це єдиний день, після якого лишається справа. Підійди до цієї людини цього тижня. Не «колись».',
  },

  encouragement: [
    'Ти назвав конкретну людину й конкретну дію.',
    'Залишилося зробити. Це вже не про англійську.',
  ],

  // Демо для mock-режиму: типові помилки в майбутньому часі й модальних.
  demoTranscript: 'There is man at my work, we say hello but nothing more. Is a bit awkward, but this week I will asked him about his family. Maybe we could to have lunch.',
};

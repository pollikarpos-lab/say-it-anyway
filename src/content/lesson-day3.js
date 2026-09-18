// Урок дня 3 — «Тривога про майбутнє». Повністю реалізований наскрізно.

export const LESSON_DAY3 = {
  day: 3,
  kind: 'open',
  passageId: 'php4.6-7',
  title: 'Тривога про майбутнє',
  steps: ['intro', 'question', 'scripture-uk', 'scripture-en', 'context', 'phrases', 'sample',
          'consent', 'record', 'review', 'processing', 'transcript', 'corrections', 'improved',
          'save-phrase', 'complete'],

  intro: {
    // Різний тон для двох режимів. Контент один — рамка різна.
    christian: 'Сьогодні коротко: один уривок, три живі англійські конструкції — і твоя власна відповідь уголос. Говорити будеш про те, що справді є, а не про вигадану ситуацію з підручника.',
    open: 'Сьогодні коротко: один текст, три живі англійські конструкції — і твоя власна відповідь уголос. Говорити будеш про те, що справді є, а не про вигадану ситуацію з підручника.',
  },

  lifeQuestion: 'Про що ти найбільше хвилюєшся цього тижня?',
  lifeQuestionNote: 'Одна річ. Не список. Те, що справді повертається в голову.',

  targets: [
    {
      id: 'worried',
      en: "I'm worried about…",
      uk: 'Я хвилююся через…',
      note: 'Після about іде іменник або дієслово на -ing: I\'m worried about money. I\'m worried about losing my job.',
      example: "I'm worried about my daughter's school.",
      // регекси для чесного підрахунку «використані конструкції»
      match: [/\bi(?:'|’)?m\s+worried\s+about\b/i, /\bi\s+am\s+worried\s+about\b/i],
    },
    {
      id: 'cantstop',
      en: "I can't stop thinking about…",
      uk: 'Я не можу перестати думати про…',
      note: 'Після stop іде -ing, не to. Не «stop to think», а «stop thinking».',
      example: "I can't stop thinking about the interview.",
      match: [/\bcan(?:'|’)?t\s+stop\s+thinking\s+about\b/i, /\bcannot\s+stop\s+thinking\s+about\b/i],
    },
    {
      id: 'outofhands',
      en: "It's out of my hands.",
      uk: 'Це від мене не залежить.',
      note: 'Сталий вислів. Саме of, не from. Кажуть, коли рішення ухвалює хтось інший.',
      example: "I did everything I could. Now it's out of my hands.",
      match: [/\bit(?:'|’)?s\s+out\s+of\s+my\s+hands\b/i, /\bout\s+of\s+my\s+hands\b/i],
    },
  ],

  // Приклад відповіді рівня A2–B1 — навмисно простий, з помилками не буває.
  sampleAnswer: {
    text: "This week I'm worried about my work. My manager said there will be changes in our team, and I don't know if my job is safe. I can't stop thinking about it at night. I sent my CV to two other places, so now it's out of my hands.",
    level: 'A2–B1',
    note: 'Три речення — цього достатньо. Не треба красиво. Треба чесно.',
  },

  voicePrompt: {
    christian: 'Скажи англійською, про що ти хвилюєшся цього тижня. До 60 секунд. Якщо забракне слова — скажи українською і йди далі, це нормально.',
    open: 'Скажи англійською, про що ти хвилюєшся цього тижня. До 60 секунд. Якщо забракне слова — скажи українською і йди далі, це нормально.',
  },

  practice: {
    christian: {
      title: 'Коротка молитва',
      body: 'Скажи Богові одним реченням те, що щойно сказав уголос англійською. Своїми словами — українською або англійською, як зручніше.',
    },
    open: {
      title: 'Хвилина для себе',
      body: 'Сформулюй одним реченням: що з цієї тривоги ти можеш змінити сьогодні, а що — ні. Не треба нікому це надсилати.',
    },
  },

  step: {
    christian: 'Випиши те, що турбує, у два стовпчики: «залежить від мене» і «не залежить». Сьогодні зроби одну дію з першого стовпчика.',
    open: 'Випиши те, що турбує, у два стовпчики: «залежить від мене» і «не залежить». Сьогодні зроби одну дію з першого стовпчика.',
  },

  encouragement: [
    'Ти сказав це англійською. Тиждень тому цього речення не існувало.',
    'Не ідеально — і це саме те, що треба на цьому етапі.',
    'Головне вже сталося: ти не промовчав.',
  ],

  // Демонстраційна транскрипція для mock-режиму. Чесно позначена в UI.
  demoTranscript:
    "This week I'm worried about my work. My manager say there will be changes in team, and I not know if my job is safe. I can't stop to think about it in the night. I send my CV to two other place, so now it out from my hands.",
};

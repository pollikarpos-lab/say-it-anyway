// Маршрут «Далеко від дому», день 7 — «Де тепер дім». Монолог.
// День результату: та сама відкрита відповідь, що в день 3, через тиждень.
// Порівнюються саме ці два дні — обидва вільні, обидва про те саме.

export const LESSON_ALONE7 = {
  route: 'alone-7',
  day: 7,
  kind: 'monologue',
  passageId: 'heb11.13-16',
  title: 'Де тепер дім',
  steps: ['intro', 'question', 'scripture-uk', 'scripture-en', 'context', 'phrases', 'sample',
          'consent', 'record', 'review', 'processing', 'transcript', 'corrections', 'improved',
          'save-phrase', 'complete'],

  intro: {
    christian: 'Останній день. Говоритимеш довше за всі попередні — півтори хвилини замість тридцяти секунд. І це буде та сама відкрита відповідь, що в день 3, тільки через тиждень.',
    open: 'Останній день. Говоритимеш довше за всі попередні — півтори хвилини замість тридцяти секунд. І це буде та сама відкрита відповідь, що в день 3, тільки через тиждень.',
  },

  lifeQuestion: 'Що для тебе тепер дім — і що змінилося за цей тиждень?',
  lifeQuestionNote: 'Три частини: як було тиждень тому, що ти зробив, де ти тепер. Не поспішай — сьогодні можна говорити довго.',

  targets: [
    {
      id: 'aweekago', en: 'A week ago I…', uk: 'Тиждень тому я…',
      note: 'Рамка всієї розповіді. Після неї дієслова в минулому: a week ago I was, I couldn’t, I didn’t.',
      example: "A week ago I couldn't say the word «lonely» out loud.",
      match: [/\ba\s+week\s+ago\b/i, /\bweek\s+ago\s+i\b/i],
    },
    {
      id: 'homeisnow', en: 'Home is…', uk: 'Дім — це…',
      note: 'Після is — іменник або -ing: home is my family, home is being understood. Головне речення дня.',
      example: 'Home is not a place for me anymore. Home is my people.',
      match: [/\bhome\s+is\b/i],
    },
    {
      id: 'stilllearning', en: "I'm still learning, but…", uk: 'Я ще вчуся, але…',
      note: 'Чесне закінчення, яке не обіцяє більше, ніж є. Still — «досі», без відтінку скарги.',
      example: "I'm still learning how to live here, but I stopped waiting.",
      match: [/\bstill\s+learning\b/i],
    },
  ],

  sampleAnswer: {
    text: "A week ago I couldn't say out loud that I feel alone here. I said it on the first day and nothing bad happened. This week I asked a man at work about his family, and we had lunch. Home is still my mother's kitchen, but it is also this place now. I'm still learning, but I don't feel like a guest every day.",
    level: 'A2–B1',
    note: 'Як було → що ти зробив → де ти тепер. Три частини, і жодна не обов’язково весела.',
  },

  voicePrompt: {
    christian: 'Говори довго. Це остання відповідь маршруту, і ніхто тебе не перерве.',
    open: 'Говори довго. Це остання відповідь маршруту, і ніхто тебе не перерве.',
  },

  practice: {
    christian: {
      title: 'Коротка молитва',
      body: 'У тексті сказано, що вони померли, так і не одержавши обіцяного, і що Бог не соромиться зватися їхнім Богом. Скажи одним реченням, чого ти ще не одержав — і лишися з цим, не просячи пояснень.',
    },
    open: {
      title: 'Хвилина для себе',
      body: 'Ті люди могли повернутися — час був — і не повернулися. Подумай хвилину, чи це про тебе, і не поспішай із відповіддю.',
    },
  },

  step: {
    christian: 'Маршрут закінчено. Зроби одну річ, яка робить це місце трохи більше твоїм — будь-яку, найменшу.',
    open: 'Маршрут закінчено. Зроби одну річ, яка робить це місце трохи більше твоїм — будь-яку, найменшу.',
  },

  encouragement: [
    'Тиждень тому цієї розмови не було.',
    'Ти сказав це англійською — і сказав про себе правду.',
  ],

  // Демо для mock-режиму: довша відповідь із помилками, типовими для
  // монологу — минулий час, третя особа, артиклі.
  demoTranscript: "A week ago I couldn't say out loud that I feel alone here. I say it on first day and nothing bad happen. This week I ask a man at work about his family and we have lunch. Home is still my mother kitchen, but is also this place now. I'm still learning, but I don't feel like guest every day.",
};

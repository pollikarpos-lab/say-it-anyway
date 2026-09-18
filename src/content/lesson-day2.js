// День 2 — «Мир усередині тривоги». Режим template.
// Людина ще не говорить вільно: вона збирає власне речення з готової рамки
// і промовляє його. Це місток між повторенням (день 1) і відкритою
// відповіддю (день 3).

export const LESSON_DAY2 = {
  day: 2,
  kind: 'template',
  passageId: 'jhn14.27',
  title: 'Мир усередині тривоги',
  steps: ['intro', 'question', 'scripture-uk', 'scripture-en', 'context', 'phrases', 'template',
          'consent', 'record', 'review', 'processing', 'transcript', 'corrections', 'improved',
          'save-phrase', 'complete'],

  intro: {
    christian: 'Сьогодні ти вже скажеш власне речення — але не з порожнього аркуша. Збереш його з готової рамки і промовиш уголос. Завтра рамки вже не буде.',
    open: 'Сьогодні ти вже скажеш власне речення — але не з порожнього аркуша. Збереш його з готової рамки і промовиш уголос. Завтра рамки вже не буде.',
  },

  lifeQuestion: 'Що ти робиш, коли всередині шумно, а ззовні треба бути в порядку?',
  lifeQuestionNote: 'У кожного є свій спосіб. Навіть якщо він виглядає дрібним.',

  targets: [
    {
      id: 'minute', en: 'I need a minute.', uk: 'Мені треба хвилинку.',
      note: 'Найкоротший спосіб сказати «зачекайте, я не готовий» — без виправдань.',
      example: "Sorry, I need a minute.",
      match: [/\bneed\s+a\s+minute\b/i],
    },
    {
      id: 'breath', en: 'Let me catch my breath.', uk: 'Дай мені віддихатися.',
      note: 'Catch my breath — буквально «спіймати дихання». Кажуть і після сходів, і після важкої розмови.',
      example: "Give me a second, let me catch my breath.",
      match: [/\bcatch\s+my\s+breath\b/i],
    },
    {
      id: 'okay', en: "I'm okay — just tired.", uk: 'Я нормально — просто втомився.',
      note: 'Just тут пом\'якшує: «просто», «всього лише». Так відповідають, коли не хочуть розгортати тему.',
      example: "— Are you alright? — I'm okay, just tired.",
      match: [/\bjust\s+tired\b/i],
    },
  ],

  // Рамка речення. Людина обирає два слоти — виходить її власна фраза.
  template: {
    title: 'Збери своє речення',
    lead: 'Обери те, що справді про тебе. Ніхто цього не побачить, крім тебе.',
    frame: [
      { type: 'text', value: 'When I feel ' },
      { type: 'slot', id: 'feel' },
      { type: 'text', value: ', I ' },
      { type: 'slot', id: 'do' },
      { type: 'text', value: '. It helps a little.' },
    ],
    slots: {
      feel: {
        label: 'Коли я почуваюся…',
        options: [
          { en: 'anxious', uk: 'тривожно' },
          { en: 'tired', uk: 'втомлено' },
          { en: 'alone', uk: 'самотньо' },
          { en: 'lost', uk: 'розгублено' },
          { en: 'angry', uk: 'сердито' },
          { en: 'afraid', uk: 'злякано' },
        ],
      },
      do: {
        label: '…я роблю ось що',
        options: [
          { en: 'pray', uk: 'молюся' },
          { en: 'go for a walk', uk: 'іду прогулятися' },
          { en: 'call someone I trust', uk: 'дзвоню тому, кому довіряю' },
          { en: 'put on music', uk: 'вмикаю музику' },
          { en: 'write it down', uk: 'записую це' },
          { en: 'just breathe', uk: 'просто дихаю' },
        ],
      },
    },
    hint: 'Це вже твоє речення, а не вправа з підручника. Завтра ти скажеш таке саме без рамки.',
  },

  voicePrompt: {
    christian: 'Скажи це речення вголос англійською. Не поспішай — можна двічі вдихнути перед тим, як почати.',
    open: 'Скажи це речення вголос англійською. Не поспішай — можна двічі вдихнути перед тим, як почати.',
  },

  sampleAnswer: {
    text: 'When I feel anxious, I go for a walk. It helps a little.',
    level: 'A2',
    note: 'Одне речення. Цього сьогодні досить.',
  },

  practice: {
    christian: {
      title: 'Коротка молитва',
      body: 'Попроси одним реченням про той мир, про який сьогоднішній текст. Своїми словами, українською або англійською.',
    },
    open: {
      title: 'Хвилина для себе',
      body: 'Згадай один випадок, коли всередині було шумно, а ти все одно впорався. Він був.',
    },
  },

  step: {
    christian: 'Сьогодні знайди одну хвилину, коли ти нічого не робиш — і не бери в руки телефон.',
    open: 'Сьогодні знайди одну хвилину, коли ти нічого не робиш — і не бери в руки телефон.',
  },

  encouragement: [
    'Це вже було твоє речення, а не чуже.',
    'Завтра рамки не буде — і ти впораєшся.',
  ],

  // Демонстраційна транскрипція для mock-режиму: типове читання рамки з двома
  // помилками рівня A2. Чесно позначена в UI як демо.
  demoTranscript: 'When I feel anxious I go for walk. It help a little.',
};

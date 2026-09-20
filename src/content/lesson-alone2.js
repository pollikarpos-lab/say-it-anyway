// Маршрут «Далеко від дому», день 2 — «Самітних — до дому». Режим template.
//
// Рамка тут вчить конструкцію, яка сама по собі варта дня: «The hardest
// part is…» / «What helps is…». Після is іде -ing, і саме на цьому
// спотикаються майже всі — кажуть «The hardest part is eat alone».
//
// Другий сенс рамки: вона змушує назвати найважче КОНКРЕТНО. «Мені важко»
// — це туман. «Найважче — їсти на самоті» — це вже щось, що можна сказати
// іншій людині.

export const LESSON_ALONE2 = {
  route: 'alone-7',
  day: 2,
  kind: 'template',
  passageId: 'psa67.7',
  title: 'Самітних — до дому',
  steps: ['intro', 'question', 'scripture-uk', 'scripture-en', 'context', 'phrases', 'template',
          'consent', 'record', 'review', 'processing', 'transcript', 'corrections', 'improved',
          'save-phrase', 'complete'],

  intro: {
    christian: 'Учора ти сказав, що тобі тут самотньо. Сьогодні назвеш, що саме найважче — і це вже буде твоє речення, а не повторення за диктором.',
    open: 'Учора ти сказав, що тобі тут самотньо. Сьогодні назвеш, що саме найважче — і це вже буде твоє речення, а не повторення за диктором.',
  },

  lifeQuestion: 'Що в житті тут найважче — не взагалі, а конкретно?',
  lifeQuestionNote: 'Не «все важко». Одна конкретна річ. Вона завжди є, і вона завжди дрібніша, ніж здається.',

  targets: [
    {
      id: 'hardest', en: 'The hardest part is…', uk: 'Найважче — це…',
      note: 'Після is іде дієслово з -ing: the hardest part is eating, is waiting, is not knowing. Це найчастіша помилка в цій конструкції.',
      example: 'The hardest part is eating alone every evening.',
      match: [/\bthe\s+hardest\s+part\s+is\b/i],
    },
    {
      id: 'whathelps', en: 'What helps is…', uk: 'Допомагає ось що…',
      note: 'Дивна на вигляд, але дуже вживана конструкція. Дослівно «те, що допомагає, — це…». Після is знову -ing.',
      example: 'What helps is calling my sister on Sundays.',
      match: [/\bwhat\s+helps\s+is\b/i],
    },
    {
      id: 'notonly', en: "I'm not the only one.", uk: 'Я не один такий.',
      note: 'The only one — єдиний. Заперечення тут важливіше за граматику: у сьогоднішньому вірші самітні стоять у множині.',
      example: "Everyone here came from somewhere. I'm not the only one.",
      match: [/\bnot\s+the\s+only\s+one\b/i],
    },
  ],

  template: {
    title: 'Збери своє речення',
    lead: 'Обери те, що справді про тебе. Ніхто цього не побачить, крім тебе.',
    frame: [
      { type: 'text', value: 'The hardest part is ' },
      { type: 'slot', id: 'hard' },
      { type: 'text', value: '. What helps is ' },
      { type: 'slot', id: 'helps' },
      { type: 'text', value: '.' },
    ],
    slots: {
      hard: {
        label: 'Найважче — це…',
        options: [
          { en: 'eating alone', uk: 'їсти на самоті' },
          { en: 'not understanding people', uk: 'не розуміти людей' },
          { en: 'having no one to call', uk: 'не мати кому подзвонити' },
          { en: 'holidays here', uk: 'свята тут' },
          { en: 'being the new person', uk: 'бути новим серед усіх' },
          { en: 'the silence in the evening', uk: 'тиша ввечері' },
        ],
      },
      helps: {
        label: '…а допомагає ось що',
        options: [
          { en: 'calling home', uk: 'дзвонити додому' },
          { en: 'cooking our food', uk: 'готувати нашу їжу' },
          { en: 'walking outside', uk: 'гуляти надворі' },
          { en: 'texting one friend', uk: 'написати одному другу' },
          { en: 'praying', uk: 'молитися' },
          { en: 'keeping busy', uk: 'не сидіти без діла' },
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
    text: 'The hardest part is eating alone. What helps is calling home on Sundays.',
    level: 'A2',
    note: 'Два речення. Перше — правда, друге — те, що з цим робиш.',
  },

  practice: {
    christian: {
      title: 'Коротка молитва',
      body: 'Сьогоднішній вірш каже, що Бог уводить самітних до дому — до людей. Попроси не про настрій, а про це: про своїх людей тут.',
    },
    open: {
      title: 'Хвилина для себе',
      body: 'Подумай, хто тут міг би стати своїм. Не другом на все життя — просто тим, кому можна написати без приводу.',
    },
  },

  step: {
    christian: 'Сьогодні скажи комусь тут одну фразу, яка не про справи. Про погоду теж годиться — важливо, що не по роботі.',
    open: 'Сьогодні скажи комусь тут одну фразу, яка не про справи. Про погоду теж годиться — важливо, що не по роботі.',
  },

  encouragement: [
    'Ти назвав найважче конкретно. Це вже не туман.',
    'Завтра рамки не буде — і ти впораєшся.',
  ],

  // Демо для mock-режиму: типове читання рамки з двома помилками рівня A2 —
  // пропущене -ing після is і зайвий артикль.
  demoTranscript: 'The hardest part is eat alone. What helps is to call the home.',
};

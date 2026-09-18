// День 5 — «Мужність діяти». Режим відкритої відповіді.
// Відмінність: людина говорить про МАЙБУТНЄ і бере на себе зобов'язання.
// Мовно це will; по суті — перший раз, коли відповідь має наслідок поза
// застосунком.

export const LESSON_DAY5 = {
  day: 5,
  kind: 'open',
  passageId: 'isa41.10',
  title: 'Мужність діяти',
  steps: ['intro', 'question', 'scripture-uk', 'scripture-en', 'context', 'phrases', 'sample',
          'consent', 'record', 'review', 'processing', 'transcript', 'corrections', 'improved',
          'save-phrase', 'complete'],

  intro: {
    christian: 'Учора — про те, що позаду. Сьогодні — про те, що попереду, і це єдиний день, після якого лишається справа. Ти назвеш одну річ, яку зробиш цього тижня, хоч тобі страшно.',
    open: 'Учора — про те, що позаду. Сьогодні — про те, що попереду, і це єдиний день, після якого лишається справа. Ти назвеш одну річ, яку зробиш цього тижня, хоч тобі страшно.',
  },

  lifeQuestion: 'Що б ти зробив цього тижня, якби не боявся?',
  lifeQuestionNote: 'Одна конкретна дія. Не «вивчити англійську», а «написати тому менеджеру».',

  targets: [
    {
      id: 'iwill', en: 'I will call them this week.', uk: 'Я зателефоную їм цього тижня.',
      note: 'Will — про рішення, яке ти ухвалюєш зараз, у цю мить. Саме тому воно й звучить як обіцянка.',
      example: "I don't know how it will go, but I will call them this week.",
      match: [/\bi\s+will\b/i, /\bi(?:'|’)?ll\b/i],
    },
    {
      id: 'figureout', en: "I'll figure it out.", uk: 'Я розберуся.',
      note: 'Figure out — зрозуміти, дати раду. Кажуть тоді, коли плану ще немає, але ти все одно береш це на себе.',
      example: "I don't have all the answers yet, but I'll figure it out.",
      match: [/\bfigure\s+it\s+out\b/i],
    },
    {
      id: 'evenif', en: "Even if I'm scared, I'll still do it.", uk: 'Навіть якщо мені страшно, я все одно це зроблю.',
      note: 'Even if — «навіть якщо». Ця конструкція тримає разом дві правди: страшно І роблю.',
      example: "Even if I'm scared, I'll still go to the interview.",
      match: [/\beven\s+if\b/i],
    },
  ],

  sampleAnswer: {
    text: "This week I will talk to my manager about more hours. I'm afraid he will say no. I don't know what I will say if he asks difficult questions, but I'll figure it out. Even if I'm scared, I'll still do it.",
    level: 'A2–B1',
    note: 'Що зроблю → чого боюся → все одно зроблю. Три кроки.',
  },

  voicePrompt: {
    christian: 'Скажи англійською одну річ, яку ти зробиш цього тижня, хоч тобі страшно. Почни з «I will…». До 60 секунд.',
    open: 'Скажи англійською одну річ, яку ти зробиш цього тижня, хоч тобі страшно. Почни з «I will…». До 60 секунд.',
  },

  practice: {
    christian: {
      title: 'Коротка молитва',
      body: 'Назви Богові те, що щойно пообіцяв уголос. Не проси, щоб стало нестрашно — проси сили зробити це зі страхом.',
    },
    open: {
      title: 'Хвилина для себе',
      body: 'Признач цій справі день і час. Не «цього тижня», а конкретний день. Невизначене не робиться.',
    },
  },

  step: {
    christian: 'Зроби сьогодні найменший перший рух до того, що ти назвав. Знайти номер. Відкрити лист. Одну дію.',
    open: 'Зроби сьогодні найменший перший рух до того, що ти назвав. Знайти номер. Відкрити лист. Одну дію.',
  },

  encouragement: [
    'Ти сказав це вголос — тепер воно існує поза твоєю головою.',
    'Обіцянка англійською — це все одно обіцянка.',
  ],

  demoTranscript:
    "This week I will to call my manager about the new position. I am afraid he will say no, but I will try anyway. If he say no, I will figure it out.",
};

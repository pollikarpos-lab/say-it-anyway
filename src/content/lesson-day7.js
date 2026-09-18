// День 7 — «Скажи вголос». Режим монологу.
// Це день результату. Відповідь довша за всі попередні, і саме її
// порівнюють із днем 3 — двома однаковими відкритими відповідями.

export const LESSON_DAY7 = {
  day: 7,
  kind: 'monologue',
  passageId: 'psa26.1-3',
  title: 'Скажи вголос',
  steps: ['intro', 'question', 'scripture-uk', 'scripture-en', 'context', 'phrases', 'sample',
          'consent', 'record', 'review', 'processing', 'transcript', 'corrections', 'improved',
          'save-phrase', 'complete'],

  intro: {
    christian: 'Останній день маршруту. Сьогодні ти говоритимеш довше, ніж усі попередні дні — півтори хвилини замість тридцяти секунд. І це буде та сама відкрита відповідь, що в день 3, тільки через тиждень.',
    open: 'Останній день маршруту. Сьогодні ти говоритимеш довше, ніж усі попередні дні — півтори хвилини замість тридцяти секунд. І це буде та сама відкрита відповідь, що в день 3, тільки через тиждень.',
  },

  lifeQuestion: 'Чого ти боявся тиждень тому — і що скажеш собі завтра?',
  lifeQuestionNote: 'Три частини: як було, що змінилося, що далі. Не поспішай — сьогодні можна говорити довго.',

  targets: [
    {
      id: 'weekago', en: 'A week ago I…', uk: 'Тиждень тому я…',
      note: 'Час у минулому задає рамку всій розповіді. Після нього дієслово теж у минулому: a week ago I was, I couldn\'t, I didn\'t.',
      example: "A week ago I couldn't say two sentences out loud.",
      match: [/\ba\s+week\s+ago\b/i, /\bweek\s+ago\s+i\b/i],
    },
    {
      id: 'nowican', en: 'Now I can…', uk: 'Тепер я можу…',
      note: 'Точка повороту в розповіді. Now протиставляється тому, що було — саме на цьому контрасті тримається свідчення.',
      example: "Now I can say what I feel, even if it's not perfect.",
      match: [/\bnow\s+i\s+can\b/i],
    },
    {
      id: 'stillworking', en: "I'm still working on it, but…", uk: 'Я ще працюю над цим, але…',
      note: 'Чесне закінчення, яке не обіцяє більше, ніж є. Still — «досі», але без відтінку скарги.',
      example: "I'm still working on it, but I don't stay silent anymore.",
      match: [/\bstill\s+working\s+on\s+it\b/i],
    },
  ],

  sampleAnswer: {
    text: "A week ago I was afraid to speak English with anyone at work. I understood almost everything, but I stayed quiet. Now I can say one or two sentences about how I feel, and people understand me. I'm still working on it, but I don't wait for the perfect words anymore. Tomorrow I will ask my manager the question I've been avoiding for a month.",
    level: 'A2–B1',
    note: 'Як було → що змінилося → чесне «ще працюю» → одна конкретна дія. Приблизно 60 секунд уголос.',
  },

  voicePrompt: {
    christian: 'Розкажи англійською 60–90 секунд: чого ти боявся тиждень тому, що змінилося і що зробиш завтра. Це найдовша відповідь маршруту — говори спокійно, паузи нормальні.',
    open: 'Розкажи англійською 60–90 секунд: чого ти боявся тиждень тому, що змінилося і що зробиш завтра. Це найдовша відповідь маршруту — говори спокійно, паузи нормальні.',
  },

  practice: {
    christian: {
      title: 'Коротка молитва',
      body: 'Подякуй за тиждень — не за результат, а за те, що ти не кинув на третьому дні.',
    },
    open: {
      title: 'Хвилина для себе',
      body: 'Послухай свій запис із дня 3 і сьогоднішній поспіль. Різницю чути краще, ніж видно в цифрах.',
    },
  },

  step: {
    christian: 'Надішли свій сьогоднішній запис одній людині, яка тебе підтримує. Без пояснень — просто надішли.',
    open: 'Надішли свій сьогоднішній запис одній людині, яка тебе підтримує. Без пояснень — просто надішли.',
  },

  encouragement: [
    'Сім днів тому цієї розповіді не існувало.',
    'Ти пройшов увесь маршрут — і говорив у кожному дні.',
  ],

  // Помилок менше, ніж у попередніх днях — це навмисно: прогрес видно й тут.
  demoTranscript:
    "A week ago I was afraid to speak English with people at work. I could understand them but I not could answer. Now I can say two or three sentences about how I feel. I'm still working on it, but I don't stay silent anymore. Tomorrow I will call about the job I was afraid to call about.",
};

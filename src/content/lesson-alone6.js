// Маршрут «Далеко від дому», день 6 — «Ти теж не сам».
// Адресат змінюється: не Бог і не ти сам, а інша людина — така сама
// новоприбула. Підстава сказати їй щось не в тому, що ти кращий, а в
// тому, що ти був на її місці. Саме це й говорить сьогоднішній текст.

export const LESSON_ALONE6 = {
  route: 'alone-7',
  day: 6,
  kind: 'open',
  passageId: 'lev19.33-34',
  title: 'Ти теж не сам',
  steps: ['intro', 'question', 'scripture-uk', 'scripture-en', 'context', 'phrases', 'sample',
          'consent', 'record', 'review', 'processing', 'transcript', 'corrections', 'improved',
          'save-phrase', 'complete'],

  intro: {
    christian: 'П’ять днів ти говорив про себе. Сьогодні — до когось іншого: до людини, якій тут так само, як було тобі спочатку. І підстава сказати це в тебе одна: ти там був.',
    open: 'П’ять днів ти говорив про себе. Сьогодні — до когось іншого: до людини, якій тут так само, як було тобі спочатку. І підстава сказати це в тебе одна: ти там був.',
  },

  lifeQuestion: 'Що б ти сказав людині, яка приїхала сюди місяць тому?',
  lifeQuestionNote: 'Не поради. Просто те, що тобі самому хотілося почути в перший місяць — і ніхто не сказав.',

  targets: [
    {
      id: 'iknowhow', en: 'I know how it feels.', uk: 'Я знаю, як це.',
      note: 'How it feels — «як воно відчувається». Найкоротший спосіб сказати «я був на твоєму місці», не розповідаючи всієї історії.',
      example: "You don't have to explain. I know how it feels.",
      match: [/\bi\s+know\s+how\s+it\s+feels\b/i],
    },
    {
      id: 'ittakestime', en: 'It takes time.', uk: 'Це потребує часу.',
      note: 'Безособове it takes — про те, скільки чогось треба. Не «it needs time».',
      example: 'It takes time. For me it was almost two years.',
      match: [/\bit\s+takes\s+time\b/i],
    },
    {
      id: 'youcantell', en: 'You can tell me.', uk: 'Мені можна сказати.',
      note: 'Tell вимагає адресата: tell me, tell him. Say — ні: say it, але не «say me».',
      example: "If it gets hard, you can tell me. I won't be surprised.",
      match: [/\byou\s+can\s+tell\s+me\b/i],
    },
  ],

  sampleAnswer: {
    text: "When I came here, nobody told me that the first year is the hardest. I know how it feels to smile and understand nothing. It takes time — for me it was almost two years. If it gets hard, you can tell me.",
    level: 'A2–B1',
    note: 'Що з тобою було → що ти знаєш → скільки це тривало → пропозиція. Без порад.',
  },

  voicePrompt: {
    christian: 'Скажи це так, ніби ця людина стоїть перед тобою. Звертайся до неї, не до себе.',
    open: 'Скажи це так, ніби ця людина стоїть перед тобою. Звертайся до неї, не до себе.',
  },

  practice: {
    christian: {
      title: 'Коротка молитва',
      body: 'Текст каже: будеш любити приходька, бо сам був приходьком. Подякуй за те, що ти вже не в першому місяці — і попроси за того, хто в ньому зараз.',
    },
    open: {
      title: 'Хвилина для себе',
      body: 'Згадай, що тобі самому хотілося почути в перші тижні тут. Найчастіше це виявляється дуже простим.',
    },
  },

  step: {
    christian: 'Сьогодні скажи це комусь насправді. Тому, хто тут недавно, — хоч одне речення з того, що ти щойно проговорив.',
    open: 'Сьогодні скажи це комусь насправді. Тому, хто тут недавно, — хоч одне речення з того, що ти щойно проговорив.',
  },

  encouragement: [
    'Сьогодні ти говорив не про себе, а до когось. Це інша англійська.',
    'Завтра останній день.',
  ],

  // Демо для mock-режиму: типові помилки — say замість tell, need замість
  // take, третя особа й пропущений підмет.
  demoTranscript: 'When I come here, nobody say me that first year is hardest. I know how is it. It need time, for me was almost two years. If it get hard, you can say me.',
};

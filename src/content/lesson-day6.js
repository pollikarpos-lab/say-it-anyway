// День 6 — «Не неси все сам». Режим відкритої відповіді.
// Відмінність: відповідь адресована ІНШІЙ людині, а не собі. Це перший
// день, коли людина промовляє щось, що потім справді комусь скаже.

export const LESSON_DAY6 = {
  day: 6,
  kind: 'open',
  passageId: '1pe5.7',
  title: 'Не неси все сам',
  steps: ['intro', 'question', 'scripture-uk', 'scripture-en', 'context', 'phrases', 'sample',
          'consent', 'record', 'review', 'processing', 'transcript', 'corrections', 'improved',
          'save-phrase', 'complete'],

  intro: {
    christian: 'Учора ти назвав те, що зробиш. Сьогодні — те, що носиш сам. І скажеш це вголос не собі, а іншій людині.',
    open: 'Учора ти назвав те, що зробиш. Сьогодні — те, що носиш сам. І скажеш це вголос не собі, а іншій людині.',
  },

  lifeQuestion: 'Що ти носиш, чого тебе ніхто не просив нести?',
  lifeQuestionNote: 'Часто це те, про що вдома навіть не знають. Не тому, що приховуєш — просто не казав.',

  targets: [
    {
      id: 'carrying', en: "I've been carrying this alone.", uk: 'Я ношу це сам.',
      note: 'Have been + -ing — про те, що почалося раніше й триває досі. Саме тому ця фраза звучить важко: у ній чути тривалість.',
      example: "I've been carrying this alone for almost a year.",
      match: [/\b(?:i(?:'|’)?ve|i\s+have)\s+been\s+carrying\b/i],
    },
    {
      id: 'nothaveto', en: "You don't have to carry this alone.", uk: 'Тобі не треба нести це самому.',
      note: 'Don\'t have to — «не мусиш», а не «не можна». Різниця велика: це дозвіл, а не заборона.',
      example: "Whatever happens, you don't have to carry this alone.",
      match: [/\bdon(?:'|’)?t\s+have\s+to\s+carry\b/i, /\bcarry\s+this\s+alone\b/i],
    },
    {
      id: 'careabout', en: 'I care about you.', uk: 'Ти мені небайдужий.',
      note: 'Care about — «мені не байдуже». Care for — радше «піклуюся, доглядаю». У вірші стоїть саме cares for.',
      example: "I'm not asking to fix it. I just care about you.",
      match: [/\bcare\s+about\s+(?:you|him|her|them)\b/i],
    },
  ],

  sampleAnswer: {
    text: "I want to tell my wife that I've been carrying this alone for months. I didn't say anything because I didn't want her to worry. But she doesn't have to carry it alone either. I care about her, and I think she needs to know.",
    level: 'A2–B1',
    note: 'Кому → що носиш → чому мовчав → що скажеш. Чотири речення.',
  },

  voicePrompt: {
    christian: 'Скажи вголос англійською те, що ти сказав би цій людині. Не про неї — саме їй, наче вона поруч. До 60 секунд.',
    open: 'Скажи вголос англійською те, що ти сказав би цій людині. Не про неї — саме їй, наче вона поруч. До 60 секунд.',
  },

  practice: {
    christian: {
      title: 'Коротка молитва',
      body: 'Назви Богові одним реченням те, що носиш. Не проси поки що нічого — просто перестань удавати, що ноші немає.',
    },
    open: {
      title: 'Хвилина для себе',
      body: 'Подумай, чому ти досі не сказав цього вголос. Часто причина виявляється меншою, ніж здавалося.',
    },
  },

  step: {
    christian: 'Скажи це тій людині насправді — англійською чи українською, байдуже. Сьогодні або завтра.',
    open: 'Скажи це тій людині насправді — англійською чи українською, байдуже. Сьогодні або завтра.',
  },

  encouragement: [
    'Ти сказав уголос те, що досі носив мовчки.',
    'Найважче в цій фразі — не англійська.',
  ],

  demoTranscript:
    "I carry this alone for two years. My wife don't know how hard it is. I want tell her but I am afraid she will worry. Maybe this week I will say her.",
};

// Маршрут «Далеко від дому», день 4 — «День, коли ти зрозумів».
// Минулий час. Як і в першому маршруті, четвертий день навмисно легший
// емоційно за третій: те, що вже позаду, менш вразливе. Мовно ж навпаки —
// з'являється минулий час, а це головна зона помилок.

export const LESSON_ALONE4 = {
  route: 'alone-7',
  day: 4,
  kind: 'open',
  passageId: 'exo2.22',
  title: 'День, коли ти зрозумів',
  steps: ['intro', 'question', 'scripture-uk', 'scripture-en', 'context', 'phrases', 'sample',
          'consent', 'record', 'review', 'processing', 'transcript', 'corrections', 'improved',
          'save-phrase', 'complete'],

  intro: {
    christian: 'Учора — про теперішнє. Сьогодні про те, що вже позаду: про день, коли до тебе дійшло, що ти тут чужий. Це розповідати легше, бо воно минуло.',
    open: 'Учора — про теперішнє. Сьогодні про те, що вже позаду: про день, коли до тебе дійшло, що ти тут чужий. Це розповідати легше, бо воно минуло.',
  },

  lifeQuestion: 'Коли ти вперше відчув, що тут чужий? Що саме тоді сталося?',
  lifeQuestionNote: 'Майже завжди це дрібниця, а не подія: жарт, якого ти не зрозумів; черга, де всі знали, що робити; форма, у якій не було твого варіанта.',

  targets: [
    {
      id: 'firsttime', en: 'The first time I…', uk: 'Коли я вперше…',
      note: 'Рамка для історії. Після неї все дієслова в минулому: the first time I came, I felt…',
      example: 'The first time I went to the store, I could not read anything.',
      match: [/\bthe\s+first\s+time\s+i\b/i],
    },
    {
      id: 'realized', en: 'That was when I realized…', uk: 'Саме тоді я зрозумів…',
      note: 'Realize — зрозуміти раптово, дійти до тебе. Не «understand», яке про знання взагалі.',
      example: 'That was when I realized I was not at home anymore.',
      match: [/\bi\s+realized\b/i, /\bi\s+realised\b/i],
    },
    {
      id: 'didntknow', en: "I didn't know what to say.", uk: 'Я не знав, що сказати.',
      note: 'Після didn’t дієслово повертається в початкову форму: didn’t know, а не didn’t knew.',
      example: 'Everyone laughed and I didn’t know what to say.',
      match: [/\bdidn(?:'|’)?t\s+know\s+what\s+to\b/i],
    },
  ],

  sampleAnswer: {
    text: 'The first time I went to a birthday party here, everyone was laughing at a joke. I understood all the words but not the joke. That was when I realized I was a stranger. I didn’t know what to say, so I smiled.',
    level: 'A2–B1',
    note: 'Одна конкретна сцена, а не роздуми взагалі. Сцену легше і згадати, і розповісти.',
  },

  voicePrompt: {
    christian: 'Розкажи це як історію, а не як висновок. Що сталося, де ти був, що ти відчув.',
    open: 'Розкажи це як історію, а не як висновок. Що сталося, де ти був, що ти відчув.',
  },

  practice: {
    christian: {
      title: 'Коротка молитва',
      body: 'Мойсей назвав сина іменем, яке щодня нагадувало про чужину — і прожив так сорок років. Скажи Богові одним реченням, скільки вже ти це носиш.',
    },
    open: {
      title: 'Хвилина для себе',
      body: 'Полічи, скільки часу минуло від того дня. Іноді виявляється, що менше, ніж здавалося. Іноді — що набагато більше.',
    },
  },

  step: {
    christian: 'Сьогодні зроби одну дрібницю по-тутешньому — те, чого досі уникав, бо незручно чи незвично.',
    open: 'Сьогодні зроби одну дрібницю по-тутешньому — те, чого досі уникав, бо незручно чи незвично.',
  },

  encouragement: [
    'Ти розповів історію англійською. Не речення — історію.',
    'Те, що назване, перестає бути безформним.',
  ],

  // Демо для mock-режиму: типові помилки в минулому часі.
  demoTranscript: 'The first time I go to a party here, everybody laugh and I didn’t knew what to say. That was when I realize I am stranger here.',
};

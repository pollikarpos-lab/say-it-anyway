// День 4 — «Коли проходиш через воду». Режим відкритої відповіді.
// Відмінність від дня 3: людина говорить про МИНУЛЕ. Це легше емоційно
// (те, що вже позаду, менш вразливе) і складніше мовно — з'являється
// минулий час. Заодно це репетиція свідчення для дня 7.

export const LESSON_DAY4 = {
  day: 4,
  kind: 'open',
  passageId: 'isa43.2',
  title: 'Коли проходиш через воду',
  steps: ['intro', 'question', 'scripture-uk', 'scripture-en', 'context', 'phrases', 'sample',
          'consent', 'record', 'review', 'processing', 'transcript', 'corrections', 'improved',
          'save-phrase', 'complete'],

  intro: {
    christian: 'Учора ти говорив про те, що є зараз. Сьогодні — про те, що вже позаду. Розповідати про пройдене легше: ти вже знаєш, чим воно скінчилося.',
    open: 'Учора ти говорив про те, що є зараз. Сьогодні — про те, що вже позаду. Розповідати про пройдене легше: ти вже знаєш, чим воно скінчилося.',
  },

  lifeQuestion: 'Через що важке ти вже пройшов — і вийшов з іншого боку?',
  lifeQuestionNote: 'Не обов\'язково велике. Достатньо того, що тоді здавалося нестерпним, а зараз позаду.',

  targets: [
    {
      id: 'goingthrough', en: "I'm going through a lot right now.", uk: 'Мені зараз дуже непросто.',
      note: 'Go through — проходити крізь щось важке. Найприродніший спосіб сказати про це англійською, без драми.',
      example: "Don't take it personally, he's going through a lot right now.",
      match: [/\bgo(?:ing)?\s+through\s+a\s+lot\b/i, /\bgoing\s+through\b/i],
    },
    {
      id: 'gotthrough', en: 'I got through it.', uk: 'Я це пережив.',
      note: 'Get through — витримати до кінця. У минулому — got through. Про завершене.',
      example: 'It took two years, but I got through it.',
      match: [/\bg(?:et|ot)\s+through\s+it\b/i, /\bgot\s+through\b/i],
    },
    {
      id: 'madeit', en: 'I made it through.', uk: 'Я дійшов до кінця.',
      note: 'Make it through — трохи тепліше за got through: у ньому чути, що було непросто.',
      example: 'That winter was hard, but we made it through.',
      match: [/\bmade\s+it\s+through\b/i, /\bmake\s+it\s+through\b/i],
    },
  ],

  sampleAnswer: {
    text: "When we moved here, the first year was very hard. I didn't have a job and I didn't speak English. I was scared almost every day. But I got through it, and now it's better.",
    level: 'A2–B1',
    note: 'Було важко → що саме → як почувався → чим скінчилося. Чотири речення.',
  },

  voicePrompt: {
    christian: 'Розкажи англійською про щось, через що ти вже пройшов. До 60 секунд. Минулий час — це сьогоднішня складність, і помилки в ньому очікувані.',
    open: 'Розкажи англійською про щось, через що ти вже пройшов. До 60 секунд. Минулий час — це сьогоднішня складність, і помилки в ньому очікувані.',
  },

  practice: {
    christian: {
      title: 'Коротка молитва',
      body: 'Подякуй одним реченням за те, що вже позаду. Не за урок із цього, а просто за те, що воно скінчилося.',
    },
    open: {
      title: 'Хвилина для себе',
      body: 'Згадай, ким ти був до того, як це почалося. Порівняй із тим, ким ти є зараз. Не оцінюй — просто зауваж різницю.',
    },
  },

  step: {
    christian: 'Сьогодні напиши одній людині, яка зараз проходить через щось важке. Не порада — просто «я поруч».',
    open: 'Сьогодні напиши одній людині, яка зараз проходить через щось важке. Не порада — просто «я поруч».',
  },

  encouragement: [
    'Ти щойно розповів історію англійською. Це вже не окремі фрази.',
    'Минулий час дається найважче — і ти в ньому говорив.',
  ],

  demoTranscript:
    "Two years ago it was very hard time for me. I didn't had a job and my family was still in Ukraine. I was scared almost every day. But I got through it, and now is better.",
};

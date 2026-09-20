// Маршрут «Далеко від дому», день 3 — «За ким ти сумуєш». Перша відкрита
// відповідь. Саме з цього дня рахується прогрес і саме з ним порівнюється
// день 7 — тому запитання має бути таким, на яке можна відповісти і
// сьогодні, і через тиждень, отримавши різні відповіді.

export const LESSON_ALONE3 = {
  route: 'alone-7',
  day: 3,
  kind: 'open',
  passageId: 'psa41.1-4',
  title: 'За ким ти сумуєш',
  steps: ['intro', 'question', 'scripture-uk', 'scripture-en', 'context', 'phrases', 'sample',
          'consent', 'record', 'review', 'processing', 'transcript', 'corrections', 'improved',
          'save-phrase', 'complete'],

  intro: {
    christian: 'Сьогодні рамки не буде. Просто скажеш своїми словами, за ким або за чим сумуєш — двома-трьома реченнями. Саме з цього дня рахується твій прогрес: у сьомий день ти скажеш те саме й почуєш різницю.',
    open: 'Сьогодні рамки не буде. Просто скажеш своїми словами, за ким або за чим сумуєш — двома-трьома реченнями. Саме з цього дня рахується твій прогрес: у сьомий день ти скажеш те саме й почуєш різницю.',
  },

  lifeQuestion: 'За ким ти сумуєш найбільше — і що саме ти з ним робив?',
  lifeQuestionNote: 'Друга половина питання важливіша за першу. Не просто «за мамою», а що саме зникло разом з нею: телефонні розмови ні про що, спільна кухня, її голос уранці.',

  targets: [
    {
      id: 'ireallymiss', en: 'I really miss…', uk: 'Я дуже сумую за…',
      note: 'Really перед дієсловом підсилює його. Не «very miss» — так не кажуть.',
      example: 'I really miss my mother’s voice in the morning.',
      match: [/\bi\s+really\s+miss\b/i],
    },
    {
      id: 'weusedto', en: 'We used to…', uk: 'Ми колись…',
      note: 'Used to — про те, що було звичним і минуло. Після нього дієслово в початковій формі: we used to talk, we used to walk.',
      example: 'We used to talk every evening after work.',
      match: [/\bwe\s+used\s+to\b/i, /\bi\s+used\s+to\b/i],
    },
    {
      id: 'nooneknows', en: 'No one here knows me.', uk: 'Мене тут ніхто не знає.',
      note: 'No one — одна людина за граматикою, тому knows із -s. Найчастіша помилка: «no one here know me».',
      example: 'People are polite, but no one here knows me.',
      match: [/\bno\s+one\s+here\s+knows\b/i],
    },
  ],

  sampleAnswer: {
    text: 'I really miss my sister. We used to talk every evening, even about nothing. Here I have good neighbours, but no one here knows me — not the way she does.',
    level: 'A2–B1',
    note: 'Хто → що ви робили разом → чим це відрізняється від теперішнього. Три речення.',
  },

  voicePrompt: {
    christian: 'Скажи це вголос англійською. Не поспішай і не добирай красивих слів — головне, щоб це було правдою.',
    open: 'Скажи це вголос англійською. Не поспішай і не добирай красивих слів — головне, щоб це було правдою.',
  },

  practice: {
    christian: {
      title: 'Коротка молитва',
      body: 'Псалом не соромиться сліз і не пояснює їх. Скажи Богові ім’я людини, за якою сумуєш. Просто ім’я — цього досить.',
    },
    open: {
      title: 'Хвилина для себе',
      body: 'Назви подумки ім’я людини, за якою сумуєш найбільше. Не думай про це довго — просто назви.',
    },
  },

  step: {
    christian: 'Сьогодні надішли цій людині голосове повідомлення. Не текст — саме голос, щоб вона почула тебе.',
    open: 'Сьогодні надішли цій людині голосове повідомлення. Не текст — саме голос, щоб вона почула тебе.',
  },

  encouragement: [
    'Ти щойно сказав англійською те, про що зазвичай мовчать.',
    'Це перша відповідь своїми словами. Далі буде легше.',
  ],

  // Демо для mock-режиму: типова відповідь A2 з помилками, які роблять
  // україномовні — третя особа без -s, «very» замість «really», used to з -ed.
  demoTranscript: 'I very miss my sister. We used to talked every evening about everything. Now no one here know me like she know me.',
};

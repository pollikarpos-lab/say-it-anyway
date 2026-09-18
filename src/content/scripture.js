// ВЕРИФІКОВАНИЙ біблійний текст. Ніколи не генерується AI.
// Кожен запис зберігає, з чим саме звірено і коли.

export const TRANSLATIONS = {
  BSB: {
    code: 'BSB',
    title: 'Berean Standard Bible',
    licence: 'Public domain (CC0)',
    licenceUrl: 'https://bsb.freely.giving/',
    note: 'Дозволено комерційне використання без роялті й без обов\'язкової атрибуції.',
  },
  OHIENKO: {
    code: 'UBIO',
    title: 'Біблія в перекладі Івана Огієнка',
    licence: 'CC BY-SA — за дозволом Українського Біблійного Товариства (видання до 1991 р.)',
    licenceUrl: 'https://blog.wikimedia.org.ua/2013/11/27/otrymano-dozvil-bibliyi-pereklad-ogiyenka/',
    note: 'Пряма ліцензія від УБТ для цифрового комерційного продукту ще НЕ отримана — запит надіслано. Див. docs/LICENCES.md.',
  },
};

/**
 * status: 'verified' — текст звірено щонайменше з двома незалежними джерелами.
 *         'unverified' — показується як позначений placeholder, без вигаданого тексту.
 */
export const PASSAGES = {
  'php4.6-7': {
    id: 'php4.6-7',
    refUk: 'До Филип\'ян 4:6–7',
    refEn: 'Philippians 4:6–7',
    uk: {
      status: 'verified',
      translation: 'OHIENKO',
      verses: [
        { n: 6, text: 'Ні про що не турбуйтесь, а в усьому нехай виявляються Богові ваші бажання молитвою й проханням з подякою.' },
        { n: 7, text: 'І мир Божий, що вищий від усякого розуму, хай береже серця ваші та ваші думки у Христі Ісусі.' },
      ],
      verifiedAgainst: [
        { source: 'parafia.org.ua — Біблія за Огієнком', date: '2026-09-16' },
        { source: 'bible.com, переклад UBIO (Огієнко)', date: '2026-09-16' },
      ],
      verifiedNote: 'Обидва джерела дали ідентичний текст. Книга «Божі обітниці» використана лише як тематична карта, а не як джерело цитати.',
    },
    en: {
      status: 'verified',
      translation: 'BSB',
      verses: [
        { n: 6, text: 'Be anxious for nothing, but in everything, by prayer and petition, with thanksgiving, present your requests to God.' },
        { n: 7, text: 'And the peace of God, which surpasses all understanding, will guard your hearts and your minds in Christ Jesus.' },
      ],
      verifiedAgainst: [{ source: 'biblehub.com/bsb — Philippians 4', date: '2026-09-14' }],
      verifiedNote: 'Звірено дослівно.',
    },
    // Контекст пише ЛЮДИНА-редактор. Це не Писання і не вихід AI.
    context: {
      author: 'Редакторський коментар (людина)',
      body: 'Павло пише цей лист із-під варти, чекаючи на вирок. «Не турбуйтесь» — це не порада людини, у якої все склалося добре. Це слова людини, яка сама сидить у невизначеності й не знає, чим усе закінчиться. Тому текст говорить не про те, щоб перестати думати про майбутнє, а про те, куди подіти тривогу, коли вона вже є.',
      caution: 'Текст не обіцяє, що обставини зміняться. Він говорить про внутрішній стан усередині незмінених обставин.',
    },
  },
};


/* ── День 1 ── */
PASSAGES['2ti1.7'] = {
  id: '2ti1.7',
  refUk: 'II до Тимофія 1:7',
  refEn: '2 Timothy 1:7',
  uk: {
    status: 'verified',
    translation: 'OHIENKO',
    verses: [
      { n: 7, text: 'Бо не дав нам Бог духа страху, але сили, і любови, і здорового розуму.' },
    ],
    verifiedAgainst: [
      { source: 'bible.com, переклад UBIO (Огієнко)', date: '2026-09-17' },
      { source: 'only.bible — Біблія в пер. Івана Огієнка', date: '2026-09-17' },
    ],
    verifiedNote: 'Обидва джерела дали ідентичний текст.',
  },
  en: {
    status: 'verified',
    translation: 'BSB',
    verses: [
      { n: 7, text: 'For God has not given us a spirit of fear, but of power, love, and self-control.' },
    ],
    verifiedAgainst: [{ source: 'biblehub.com/bsb — 2 Timothy 1', date: '2026-09-14' }],
    verifiedNote: 'Звірено дослівно.',
  },
  context: {
    author: 'Редакторський коментар (людина)',
    body: 'Павло пише це з-під варти молодому Тимофію, якому страшно очолювати громаду. Це не гасло на стіну — це лист старшого до переляканого хлопця, який хоче все кинути. «Дух страху» тут не про боягузтво характеру, а про той параліч, коли людина не робить навіть того, що добре вміє.',
    caution: 'Текст не обіцяє, що страх зникне. Він говорить про те, звідки страх НЕ приходить — і що поруч зі страхом є ще три речі.',
  },
};

/* ── День 2 ── */
PASSAGES['jhn14.27'] = {
  id: 'jhn14.27',
  refUk: 'Від Івана 14:27',
  refEn: 'John 14:27',
  uk: {
    status: 'verified',
    translation: 'OHIENKO',
    verses: [
      { n: 27, text: 'Зоставляю вам мир, мир Свій вам даю! Я даю вам не так, як дає світ. Серце ваше нехай не тривожиться, ані не лякається!' },
    ],
    verifiedAgainst: [
      { source: 'bible.com, переклад UBIO (Огієнко)', date: '2026-09-17' },
      { source: 'wordproject.org — Біблія за Огієнком', date: '2026-09-17' },
    ],
    verifiedNote: 'Обидва джерела дали ідентичний текст; третє (only.bible) підтвердило першу половину вірша дослівно.',
  },
  en: {
    status: 'verified',
    translation: 'BSB',
    verses: [
      { n: 27, text: 'Peace I leave with you; My peace I give to you. I do not give to you as the world gives. Do not let your hearts be troubled; do not be afraid.' },
    ],
    verifiedAgainst: [{ source: 'biblehub.com/bsb — John 14', date: '2026-09-14' }],
    verifiedNote: 'Звірено дослівно.',
  },
  context: {
    author: 'Редакторський коментар (людина)',
    body: 'Це останній вечір перед арештом. Ісус говорить ці слова людям, які за кілька годин розбіжаться від страху — і Він це знає. Тобто мир обіцяно не замість кризи, а всередині неї, і не тим, хто добре тримається, а тим, хто зараз не втримається.',
    caution: 'Це не обіцянка, що стане спокійно. Це про те, звідки береться спокій тоді, коли спокійно не стає.',
  },
};


/* ── День 4 ── */
PASSAGES['isa43.2'] = {
  id: 'isa43.2',
  refUk: 'Ісаї 43:2',
  refEn: 'Isaiah 43:2',
  uk: {
    status: 'verified',
    translation: 'OHIENKO',
    verses: [
      { n: 2, text: 'Коли переходитимеш через води, Я буду з тобою, а через річки не затоплять тебе, коли будеш огонь переходити, не попечешся, і не буде палити тебе його полум\'я.' },
    ],
    verifiedAgainst: [
      { source: 'bible.com, переклад UBIO (Огієнко)', date: '2026-09-18' },
      { source: 'wordproject.org — Біблія за Огієнком', date: '2026-09-18' },
      { source: 'only.bible — Біблія в пер. Івана Огієнка', date: '2026-09-18' },
    ],
    verifiedNote: 'Усі три джерела дали ідентичний текст. Увага: у книзі «Божі обітниці» цей вірш надруковано в іншій редакції — ще одна причина не брати цитат із неї.',
  },
  en: {
    status: 'verified',
    translation: 'BSB',
    verses: [
      { n: 2, text: 'When you pass through the waters, I will be with you; and when you go through the rivers, they will not overwhelm you. When you walk through the fire, you will not be scorched; the flames will not set you ablaze.' },
    ],
    verifiedAgainst: [{ source: 'biblehub.com/bsb — Isaiah 43', date: '2026-09-14' }],
    verifiedNote: 'Звірено дослівно.',
  },
  context: {
    author: 'Редакторський коментар (людина)',
    body: 'Це сказано народові у вавилонському полоні — людям, які вже втратили дім, храм і країну. Не тим, у кого попереду випробування, а тим, хто вже всередині нього. І сказано «коли переходитимеш», а не «якщо».',
    caution: 'Тут не обіцяно, що води не буде. Обіцяно, що через неї не доведеться йти самому. Це різні речі, і плутати їх — означає готувати собі розчарування.',
  },
};

/* ── День 5 ── */
PASSAGES['isa41.10'] = {
  id: 'isa41.10',
  refUk: 'Ісаї 41:10',
  refEn: 'Isaiah 41:10',
  uk: {
    status: 'verified',
    translation: 'OHIENKO',
    verses: [
      { n: 10, text: 'не бійся, з тобою бо Я, і не озирайсь, бо Я Бог твій! Зміцню Я тебе, і тобі поможу, і правицею правди Своєї тебе Я підтримаю.' },
    ],
    verifiedAgainst: [
      { source: 'bible.com, переклад UBIO (Огієнко)', date: '2026-09-18' },
      { source: 'wordproject.org — Біблія за Огієнком', date: '2026-09-18' },
    ],
    verifiedNote: 'Обидва джерела дали ідентичний текст. Вірш починається з малої літери, бо в оригіналі це продовження речення — так він і надрукований.',
  },
  en: {
    status: 'verified',
    translation: 'BSB',
    verses: [
      { n: 10, text: 'Do not fear, for I am with you; do not be afraid, for I am your God. I will strengthen you; I will surely help you; I will uphold you with My righteous right hand.' },
    ],
    verifiedAgainst: [{ source: 'biblehub.com/bsb — Isaiah 41', date: '2026-09-14' }],
    verifiedNote: 'Звірено дослівно.',
  },
  context: {
    author: 'Редакторський коментар (людина)',
    body: 'Той самий полон, той самий адресат, що й учора. Але тут інша інтонація: чотири обіцянки поспіль — буду з тобою, зміцню, поможу, підтримаю. Це не «перестань боятися», а «роби, і поки ти робиш — я тримаю».',
    caution: 'Текст не каже, що страх зникне. Він каже, що страх не мусить бути останнім словом. Мужність тут — не відсутність страху, а дія попри нього.',
  },
};


/* ── День 6 ── */
PASSAGES['1pe5.7'] = {
  id: '1pe5.7',
  refUk: 'І Петра 5:7',
  refEn: '1 Peter 5:7',
  uk: {
    status: 'verified',
    translation: 'OHIENKO',
    verses: [
      { n: 7, text: 'Покладіть на Нього всю вашу журбу, бо Він опікується вами!' },
    ],
    verifiedAgainst: [
      { source: 'bible.com, переклад UBIO (Огієнко)', date: '2026-09-18' },
      { source: 'only.bible — Біблія в пер. Івана Огієнка', date: '2026-09-18' },
    ],
    verifiedNote: 'Обидва джерела дали ідентичний текст.',
  },
  en: {
    status: 'verified',
    translation: 'BSB',
    verses: [
      { n: 7, text: 'Cast all your anxiety on Him, because He cares for you.' },
    ],
    verifiedAgainst: [{ source: 'biblehub.com/bsb — 1 Peter 5', date: '2026-09-14' }],
    verifiedNote: 'Звірено дослівно.',
  },
  context: {
    author: 'Редакторський коментар (людина)',
    body: 'Петро пише християнам, які живуть під переслідуванням — людям, у яких є реальні підстави триматися й не скаржитися. Англійське «cast» тут різке й фізичне: жбурнути з себе, а не акуратно передати з рук у руки. Українське «покладіть» звучить м\'якше, ніж в оригіналі.',
    caution: 'Це не про те, щоб перестати відповідати за своє життя. Це про те, що нести все самому — не чеснота, а звичка, якої ніхто від тебе не вимагав.',
  },
};

/* ── День 7 ── */
PASSAGES['psa26.1-3'] = {
  id: 'psa26.1-3',
  refUk: 'Псалом 26 (27):1, 3',
  refEn: 'Psalm 27:1, 3',
  uk: {
    status: 'verified',
    translation: 'OHIENKO',
    verses: [
      { n: 1, text: 'Давидів. Господь моє світло й спасіння моє, кого буду боятись? Господь то твердиня мого життя, кого буду лякатись?' },
      { n: 3, text: 'Коли проти мене розложиться табір, то серце моє не злякається, коли проти мене повстане війна, я надіятись буду на те, на поміч Його!' },
    ],
    verifiedAgainst: [
      { source: 'bible.com, UBIO — «ПСАЛОМ 26 (27)»', date: '2026-09-18' },
      { source: 'wordproject.org — Псалом 27', date: '2026-09-18' },
      { source: 'only.bible — Псалом 27 (вірш 1)', date: '2026-09-18' },
    ],
    verifiedNote: 'Увага на нумерацію: видання Огієнка нумерують псалми по-різному. bible.com друкує «ПСАЛОМ 26 (27)» — септуагінтна нумерація з масоретською в дужках; only.bible і wordproject подають той самий текст як Псалом 27. Тому в застосунку показані обидва номери. Текст вірша 1 звірено з трьома джерелами, вірша 3 — з двома.',
  },
  en: {
    status: 'verified',
    translation: 'BSB',
    verses: [
      { n: 1, text: 'The LORD is my light and my salvation — whom shall I fear? The LORD is the stronghold of my life — whom shall I dread?' },
      { n: 3, text: 'Though an army encamps around me, my heart will not fear; though a war breaks out against me, I will be confident.' },
    ],
    verifiedAgainst: [{ source: 'biblehub.com/bsb — Psalm 27', date: '2026-09-14' }],
    verifiedNote: 'Звірено дослівно.',
  },
  context: {
    author: 'Редакторський коментар (людина)',
    body: 'Давид пише це не з безпечного місця. «Табір», «війна» — не метафори з красивого вірша, а те, що з ним справді відбувалося. І питання «кого буду боятись?» тут не означає, що страху немає. Воно означає, що страх більше не вирішує, що робити далі.',
    caution: 'Цей текст не обіцяє, що табору не буде. Він про те, ким ти стоїш перед ним. Різниця між «не боюся» і «боюся, але стою» — і є весь цей маршрут.',
  },
};

export function getPassage(id) { return PASSAGES[id]; }

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

/* ═══════════════════════════════════════════════════════════════
   МАРШРУТ 2 — «Далеко від дому»
   ═══════════════════════════════════════════════════════════════ */

PASSAGES['heb13.5'] = {
  id: 'heb13.5',
  refUk: 'До євреїв 13:5–6',
  refEn: 'Hebrews 13:5–6',
  uk: {
    status: 'verified',
    translation: 'OHIENKO',
    verses: [
      { n: 5, text: 'Будьте життям не грошолюбні, задовольняйтеся тим, що маєте. Сам бо сказав: Я тебе не покину, ані не відступлюся від тебе!' },
      { n: 6, text: 'Тому то ми сміливо говоримо: Господь мені помічник, і я не злякаюсь нікого: що зробить людина мені?' },
    ],
    verifiedAgainst: [
      { source: 'bible.com, переклад UBIO (Огієнко 1962)', date: '2026-09-19' },
      { source: 'wordproject.org — український Огієнко', date: '2026-09-19' },
    ],
    verifiedNote: 'Обидва джерела дали ідентичний текст, символ у символ.',
  },
  en: {
    status: 'verified',
    translation: 'BSB',
    verses: [
      { n: 5, text: 'Keep your lives free from the love of money and be content with what you have, for God has said: “Never will I leave you, never will I forsake you.”' },
      { n: 6, text: 'So we say with confidence: “The Lord is my helper; I will not be afraid. What can man do to me?”' },
    ],
    verifiedAgainst: [{ source: 'biblehub.com/bsb — Hebrews 13', date: '2026-09-19' }],
    verifiedNote: 'Звірено дослівно.',
  },
  context: {
    author: 'Редакторський коментар (людина)',
    body: 'Перша половина вірша — про гроші, і це не випадкова сусідка. Лист написаний людям, які втратили майно й опинилися без опори; у них не лишилося ні дому, ні статків, ні впевненості в завтрашньому дні. Обіцянка «не покину» стоїть саме тут, поруч із порожнім гаманцем, а не серед благополуччя.',
    caution: 'Тут не сказано, що самотність — це неправда чи що її не буде. Сказано інше: що присутність не залежить від того, чи ти її зараз відчуваєш.',
  },
};

PASSAGES['psa67.7'] = {
  id: 'psa67.7',
  refUk: 'Псалом 67 (68):7',
  refEn: 'Psalm 68:6',
  uk: {
    status: 'verified',
    translation: 'OHIENKO',
    verses: [
      { n: 7, text: 'Бог самітних уводить до дому, витягує в’язнів з кайданів, тільки відступники мешкати будуть у спаленій сонцем землі!' },
    ],
    verifiedAgainst: [
      { source: 'bible.com, переклад UBIO (Огієнко 1962)', date: '2026-09-19' },
      { source: 'wordproject.org — український Огієнко', date: '2026-09-19' },
    ],
    verifiedNote: 'Текст ідентичний в обох джерелах. Знову розбіжність у НОМЕРІ псалма, як і з Псалмом 26 (27): bible.com друкує «ПСАЛОМ 67 (68)» — септуагінтна нумерація з масоретською в дужках, wordproject подає той самий текст як Псалом 68. Номер вірша в обох — 7. В англійських перекладах це Псалом 68, вірш 6: там інакше рахується надписання. Тому показані обидва номери.',
  },
  en: {
    status: 'verified',
    translation: 'BSB',
    verses: [
      { n: 6, text: 'God settles the lonely in families; He leads the prisoners out to prosperity, but the rebellious dwell in a sun-scorched land.' },
    ],
    verifiedAgainst: [{ source: 'biblehub.com/bsb — Psalm 68', date: '2026-09-19' }],
    verifiedNote: 'Звірено дослівно. Український вірш 7 = англійський вірш 6.',
  },
  context: {
    author: 'Редакторський коментар (людина)',
    body: '«Самітні» тут — не просто люди в поганому настрої. У мові оригіналу це ті, хто лишився без роду: без сім’ї, без клану, без тих, хто за тебе заступиться. У стародавньому світі це означало не смуток, а беззахисність. І сказано не «Бог утішає самітних», а «уводить до дому» — тобто дає їм те, чого бракує: своїх людей.',
    caution: 'Вірш закінчується різко — згадкою про відступників і спалену сонцем землю. Ми не прибрали цього рядка, хоч він і не про нашу тему: показувати половину вірша, а другу ховати, було б нечесно. Псалми часто такі: втіха й суд в одному реченні.',
  },
};

PASSAGES['psa41.1-4'] = {
  id: 'psa41.1-4',
  refUk: 'Псалом 42:1, 3–4  (в інших виданнях 41 (42):2, 4–5)',
  refEn: 'Psalm 42:1, 3–4',
  uk: {
    status: 'verified',
    translation: 'OHIENKO',
    verses: [
      { n: 1, text: 'Як лине той олень до водних потоків, так лине до Тебе, о Боже, душа моя,' },
      { n: 3, text: 'Сльоза моя стала для мене поживою вдень та вночі, коли кажуть мені цілий день: Де твій Бог?' },
      { n: 4, text: 'Як про це пригадаю, то душу свою виливаю, як я многолюдді ходив, і водив їх до Божого дому, із голосом співу й подяки святкового натовпу...' },
    ],
    verifiedAgainst: [
      { source: 'bible.com, переклад UBIO (Огієнко 1962)', date: '2026-09-20' },
      { source: 'wordproject.org — український Огієнко', date: '2026-09-20' },
    ],
    verifiedNote: 'Текст ідентичний в обох джерелах. Але тут розбіжність складніша за попередні: різняться не лише номери ПСАЛМА, а й номери ВІРШІВ. bible.com друкує «ПСАЛОМ 41 (42)» і рахує надписання як вірш 1, тому наші рядки там — 2, 4 і 5. wordproject подає це як Псалом 42 і починає відлік із самого тексту, тому ті самі рядки — 1, 3 і 4. Англійські переклади рахують як wordproject. Ми взяли нумерацію, що збігається з англійською, і в посиланні показали обидві: інакше людина відкриє свою Біблію й не знайде рядка. Слова «як я многолюдді ходив» наведені точно як надруковано — прийменник відсутній в обох джерелах, тож це текст видання, а не наша помилка.',
  },
  en: {
    status: 'verified',
    translation: 'BSB',
    verses: [
      { n: 1, text: 'As the deer pants for streams of water, so my soul longs after You, O God.' },
      { n: 3, text: 'My tears have been my food both day and night, while men ask me all day long, “Where is your God?”' },
      { n: 4, text: 'These things come to mind as I pour out my soul: how I walked with the multitude, leading the festive procession to the house of God with shouts of joy and praise.' },
    ],
    verifiedAgainst: [{ source: 'biblehub.com/bsb — Psalm 42', date: '2026-09-20' }],
    verifiedNote: 'Звірено дослівно.',
  },
  context: {
    author: 'Редакторський коментар (людина)',
    body: 'Це писала людина далеко від дому. Не в пригніченому настрої — фізично не там, де лишилося все своє. Найточніший рядок тут третій: найбільше болить не сама відсутність, а спогад про те, як було. Людина згадує, як ішла в натовпі до храму — зі співом, зі своїми — і саме від цього спогаду «виливає душу». Туга за домом майже завжди приходить не порожнечею, а згадкою про повноту.',
    caution: 'Псалом не закінчується розрадою й не дає поради. Він просто називає стан і ставить питання, на яке в тексті немає відповіді.',
  },
};

PASSAGES['exo2.22'] = {
  id: 'exo2.22',
  refUk: 'Вихід 2:22',
  refEn: 'Exodus 2:22',
  uk: {
    status: 'verified',
    translation: 'OHIENKO',
    verses: [
      { n: 22, text: 'І породила вона сина, а він назвав ім’я йому: Ґершом, бо сказав: Я став приходьком у чужому краї.' },
    ],
    verifiedAgainst: [
      { source: 'bible.com, переклад UBIO (Огієнко 1962)', date: '2026-09-20' },
      { source: 'wordproject.org — український Огієнко', date: '2026-09-20' },
    ],
    verifiedNote: 'Обидва джерела дали ідентичний текст.',
  },
  en: {
    status: 'verified',
    translation: 'BSB',
    verses: [
      { n: 22, text: 'And she gave birth to a son, and Moses named him Gershom, saying, “I have become a foreigner in a foreign land.”' },
    ],
    verifiedAgainst: [{ source: 'biblehub.com/bsb — Exodus 2', date: '2026-09-20' }],
    verifiedNote: 'Звірено дослівно.',
  },
  context: {
    author: 'Редакторський коментар (людина)',
    body: 'Мойсей утік із Єгипту й прожив у Мідіяні сорок років — одружився, працював, ростив дітей. І назвав первістка іменем, яке щодня нагадувало: я тут чужий. Не «ми влаштувалися», не «все добре» — а «я став приходьком». Людина може прожити на новому місці півжиття й досі носити це в собі. Текст не вважає це слабкістю й не пропонує з цим боротися.',
    caution: 'Це не обіцянка, а констатація. Історія Мойсея закінчилася поверненням, але з тексту цього ще не видно — і ми не робимо вигляду, що видно.',
  },
};

PASSAGES['ecc4.9-10'] = {
  id: 'ecc4.9-10',
  refUk: 'Екклезіяста 4:9–10',
  refEn: 'Ecclesiastes 4:9–10',
  uk: {
    status: 'verified',
    translation: 'OHIENKO',
    verses: [
      { n: 9, text: 'Краще двом, як одному, бо мають хорошу заплату за труд свій,' },
      { n: 10, text: 'і якби вони впали, підійме одне свого друга! Та горе одному, як він упаде, й нема другого, щоб підвести його...' },
    ],
    verifiedAgainst: [
      { source: 'bible.com, переклад UBIO (Огієнко 1962)', date: '2026-09-20' },
      { source: 'wordproject.org — український Огієнко', date: '2026-09-20' },
    ],
    verifiedNote: 'Обидва джерела дали ідентичний текст.',
  },
  en: {
    status: 'verified',
    translation: 'BSB',
    verses: [
      { n: 9, text: 'Two are better than one, because they have a good return for their labor.' },
      { n: 10, text: 'For if one falls down, his companion can lift him up; but pity the one who falls without another to help him up!' },
    ],
    verifiedAgainst: [{ source: 'biblehub.com/bsb — Ecclesiastes 4', date: '2026-09-20' }],
    verifiedNote: 'Звірено дослівно.',
  },
  context: {
    author: 'Редакторський коментар (людина)',
    body: 'Екклезіяст — найтверезіша книга Біблії, вона рідко втішає. І саме тому цей рядок вагомий: тут не сказано «удвох приємніше». Сказано практичне — той, хто впаде сам, лишиться лежати. Це не про дружбу як прикрасу життя, а про те, що людині без інших людей фізично важче встати.',
    caution: 'Текст не каже, як знайти цю другу людину. Він лише називає ціну її відсутності.',
  },
};

PASSAGES['lev19.33-34'] = {
  id: 'lev19.33-34',
  refUk: 'Левит 19:33–34',
  refEn: 'Leviticus 19:33–34',
  uk: {
    status: 'verified',
    translation: 'OHIENKO',
    verses: [
      { n: 33, text: 'А коли мешкатиме з тобою приходько в вашім Краї, то не будете гнобити його.' },
      { n: 34, text: 'Як тубілець із вас буде для вас приходько, що мешкає з вами, і ти будеш любити його, як самого себе, бо приходьки були ви в єгипетськім краї. Я Господь, Бог ваш!' },
    ],
    verifiedAgainst: [
      { source: 'bible.com, переклад UBIO (Огієнко 1962)', date: '2026-09-20' },
      { source: 'wordproject.org — український Огієнко', date: '2026-09-20' },
    ],
    verifiedNote: 'Обидва джерела дали ідентичний текст. Перший витяг із bible.com обірвався на «в єгипетськім краї» — повторна перевірка показала, що вірш закінчується словами «Я Господь, Бог ваш!», як і в wordproject.',
  },
  en: {
    status: 'verified',
    translation: 'BSB',
    verses: [
      { n: 33, text: 'When a foreigner resides with you in your land, you must not oppress him.' },
      { n: 34, text: 'You must treat the foreigner living among you as native-born and love him as yourself, for you were foreigners in the land of Egypt. I am the LORD your God.' },
    ],
    verifiedAgainst: [{ source: 'biblehub.com/bsb — Leviticus 19', date: '2026-09-20' }],
    verifiedNote: 'Звірено дослівно.',
  },
  context: {
    author: 'Редакторський коментар (людина)',
    body: 'Підстава тут не в доброті, а в пам’яті: «бо приходьки були ви в єгипетськім краї». Тобто ти маєш що сказати новому не тому, що ти кращий, а тому, що ти був на його місці й пам’ятаєш, як воно. Це найпряміша відповідь на питання, навіщо взагалі розповідати комусь про свою самотність.',
    caution: 'Закон говорить до народу, а не до окремої людини, і це не порада психолога. Ми беремо звідси одну думку — про пам’ять як підставу — і не видаємо її за все, що в цьому тексті є.',
  },
};

PASSAGES['heb11.13-16'] = {
  id: 'heb11.13-16',
  refUk: 'До євреїв 11:13–16',
  refEn: 'Hebrews 11:13–16',
  uk: {
    status: 'verified',
    translation: 'OHIENKO',
    verses: [
      { n: 13, text: 'Усі вони повмирали за вірою, не одержавши обітниць, але здалека бачили їх, і повітали, і вірували в них, та визнавали, що вони на землі чужаниці й приходьки.' },
      { n: 14, text: 'Бо ті, що говорять таке, виявляють, що шукають батьківщини.' },
      { n: 15, text: 'І коли б вони пам’ятали ту, що вийшли з неї, то мали б були час повернутись.' },
      { n: 16, text: 'Та бажають вони тепер кращої, цебто небесної, тому й Бог не соромиться їх, щоб звати Себе їхнім Богом, бо Він приготував їм місто.' },
    ],
    verifiedAgainst: [
      { source: 'bible.com, переклад UBIO (Огієнко 1962)', date: '2026-09-20' },
      { source: 'wordproject.org — український Огієнко', date: '2026-09-20' },
    ],
    verifiedNote: 'Обидва джерела дали ідентичний текст, символ у символ.',
  },
  en: {
    status: 'verified',
    translation: 'BSB',
    verses: [
      { n: 13, text: 'All these people died in faith, without having received the things they were promised. However, they saw them and welcomed them from afar. And they acknowledged that they were strangers and exiles on the earth.' },
      { n: 14, text: 'Now those who say such things show that they are seeking a country of their own.' },
      { n: 15, text: 'If they had been thinking of the country they had left, they would have had opportunity to return.' },
      { n: 16, text: 'Instead, they were longing for a better country, a heavenly one. Therefore God is not ashamed to be called their God, for He has prepared a city for them.' },
    ],
    verifiedAgainst: [{ source: 'biblehub.com/bsb — Hebrews 11', date: '2026-09-20' }],
    verifiedNote: 'Звірено дослівно.',
  },
  context: {
    author: 'Редакторський коментар (людина)',
    body: 'Тринадцятий вірш — найчесніший рядок про еміграцію в усій Біблії: люди померли, так і не отримавши обіцяного, і бачили його тільки здалека. Не «все склалося», не «вони дочекалися». І при цьому текст не називає їхнє життя невдалим. П’ятнадцятий вірш пояснює чому: вони могли повернутися — час був — і не повернулися.',
    caution: 'Тут прямо сказано, що шукана батьківщина — небесна. Ми не перетворюємо це на пораду «не сумуй за домом» і не обіцяємо, що туга мине. Текст говорить про інше: що можна жити приходьком і не вважати своє життя змарнованим.',
  },
};

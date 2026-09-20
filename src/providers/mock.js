import { CORRECTION_KINDS as K } from './types.js';

/* ============================================================
   MOCK STT — НЕ розпізнає голос. Повертає підготовлений
   демонстраційний текст. Прапорець isDemo:true веде в UI-плашку.
   ============================================================ */
export function createMockStt(demoByDay) {
  const pick = (day, routeId) =>
    (typeof demoByDay === 'function' ? demoByDay(day, routeId) : demoByDay) || '';
  return {
    id: 'mock-stt',
    label: 'Демо-розпізнавання (без AI)',
    async transcribe(blob, opts = {}) {
      await delay(900 + Math.random() * 700);
      return {
        text: pick(opts.day, opts.routeId),
        isDemo: true,
        confidence: 'unknown',
        provider: 'mock-stt',
        durationMs: opts.durationMs || 0,
      };
    },
  };
}

/* ============================================================
   RULE-BASED ANALYZER — не AI, а детермінований набір правил під
   типові помилки україномовних A2–B1. Він РЕАЛЬНО працює з
   текстом користувача: що напишете/скажете, те й розбирає.
   ============================================================ */

const THIRD_PERSON = {
  know: 'knows', like: 'likes', love: 'loves', want: 'wants', need: 'needs',
  say: 'says', think: 'thinks', make: 'makes', take: 'takes', work: 'works',
  live: 'lives', come: 'comes', go: 'goes', help: 'helps', call: 'calls',
  ask: 'asks', look: 'looks', seem: 'seems', talk: 'talks', laugh: 'laughs',
  see: 'sees', understand: 'understands',
};

const ING_FORMS = {
  eat: 'eating', call: 'calling', cook: 'cooking', walk: 'walking', wait: 'waiting',
  talk: 'talking', speak: 'speaking', work: 'working', live: 'living', sit: 'sitting',
  stay: 'staying', go: 'going', write: 'writing', think: 'thinking', know: 'knowing',
  find: 'finding', meet: 'meeting', learn: 'learning', ask: 'asking', sleep: 'sleeping',
  drive: 'driving', read: 'reading', listen: 'listening', watch: 'watching',
  come: 'coming', make: 'making', take: 'taking', get: 'getting', give: 'giving',
};

const BASE_FORMS = {
  told: 'tell', went: 'go', saw: 'see', said: 'say', did: 'do', made: 'make',
  took: 'take', gave: 'give', got: 'get', came: 'come', knew: 'know',
  thought: 'think', felt: 'feel', found: 'find', left: 'leave', met: 'meet',
  paid: 'pay', ran: 'run', sent: 'send', spoke: 'speak', wrote: 'write',
  began: 'begin', brought: 'bring', bought: 'buy', built: 'build',
  chose: 'choose', drove: 'drive', ate: 'eat', fell: 'fall', flew: 'fly',
  forgot: 'forget', heard: 'hear', held: 'hold', kept: 'keep', lost: 'lose',
  slept: 'sleep', sat: 'sit', won: 'win', wore: 'wear', tried: 'try',
  stopped: 'stop',
};

const PAST_MARKER = /\b(yesterday|last\s+(?:night|week|month|year)|ago|back\s+then|when\s+I\s+was|used\s+to|in\s+(?:19|20)\d\d)\b/i;

const PAST_FORMS = {
  go: 'went', come: 'came', see: 'saw', say: 'said', tell: 'told', make: 'made',
  take: 'took', have: 'had', do: 'did', feel: 'felt', think: 'thought',
  know: 'knew', get: 'got',
};

/** @type {{id:string,re:RegExp,fix:(m:string[])=>string,kind:string,why:string,weight:number,skipIf?:(t:string)=>boolean}[]} */
const RULES = [
  { id: 'very-worry', re: /\bI\s+very\s+worry\b/gi, fix: () => "I'm really worried",
    kind: K.CLARITY, weight: 10,
    why: '«I very worry» — так не кажуть. Worry тут має бути прикметником: I\'m worried. А «дуже» англійською ставлять як really, а не very перед дієсловом.' },

  { id: 'am-worry', re: /\bI\s+am\s+worry\b/gi, fix: () => "I'm worried",
    kind: K.GRAMMAR, weight: 9,
    why: 'Після I am потрібна форма worried, а не worry. Worried — про стан, worry — про дію.' },

  { id: 'i-worry-about', re: /\bI\s+worry\s+about\b/gi, fix: () => "I'm worried about",
    kind: K.NATURAL, weight: 6,
    why: 'I worry about — це про звичку взагалі. Коли йдеться про зараз, природніше I\'m worried about.' },

  { id: 'stop-to-think', re: /\bstop\s+to\s+think\b/gi, fix: () => 'stop thinking',
    kind: K.GRAMMAR, weight: 10,
    why: 'Після stop іде -ing: stop thinking. «Stop to think» означає протилежне — зупинитися, щоб подумати.' },

  { id: 'out-from-hands', re: /\bout\s+from\s+my\s+hands\b/gi, fix: () => 'out of my hands',
    kind: K.NATURAL, weight: 8,
    why: 'Сталий вислів — саме out of my hands. З from він не читається як ідіома.' },

  { id: 'it-out', re: /\bit\s+out\s+of\s+my\s+hands\b/gi, fix: () => "it's out of my hands",
    kind: K.GRAMMAR, weight: 7,
    why: 'Пропущене дієслово to be: it\'s, не it.' },

  { id: 'manager-say', re: /\b(manager|boss|teacher|doctor|friend|husband|wife)\s+say\b/gi,
    fix: (m) => `${m[1]} said`, kind: K.CLARITY, weight: 9,
    why: 'Подія вже сталася — потрібен минулий час: said.' },

  { id: 'i-not-know', re: /\bI\s+not\s+know\b/gi, fix: () => "I don't know",
    kind: K.CLARITY, weight: 10,
    why: 'Заперечення в теперішньому часі будується через don\'t: I don\'t know.' },

  { id: 'i-not-have', re: /\bI\s+not\s+have\b/gi, fix: () => "I don't have",
    kind: K.CLARITY, weight: 10,
    why: 'Заперечення через don\'t: I don\'t have.' },

  { id: 'in-the-night', re: /\bin\s+the\s+night\b/gi, fix: () => 'at night',
    kind: K.NATURAL, weight: 6,
    why: 'Англійською кажуть at night. In the night звучить книжно й дивно.' },

  { id: 'in-this-week', re: /\bin\s+this\s+(week|month|year)\b/gi, fix: (m) => `this ${m[1]}`,
    kind: K.NATURAL, weight: 6,
    why: 'Перед this week прийменник не потрібен: this week.' },

  { id: 'i-send', re: /\bI\s+send\s+my\b/gi, fix: () => 'I sent my',
    kind: K.GRAMMAR, weight: 7,
    why: 'Дія вже завершена — минулий час: sent.' },

  { id: 'in-team', re: /\bin\s+team\b/gi, fix: () => 'in our team',
    kind: K.NATURAL, weight: 4,
    why: 'Перед team потрібен артикль або присвійне: in our team / in the team.' },

  { id: 'two-place', re: /\b(two|three|four|five|many|several)\s+(other\s+|more\s+|new\s+|different\s+)?(place|job|company|school|friend|thing|problem|paper|document|interview)\b/gi,
    fix: (m) => `${m[1]} ${m[2] || ''}${m[3]}s`, kind: K.GRAMMAR, weight: 6,
    why: 'Після числівника більше одного іменник стає множиною: two places.' },

  { id: 'much-problems', re: /\bmuch\s+(problems|people|things|questions|documents)\b/gi,
    fix: (m) => `a lot of ${m[1]}`, kind: K.GRAMMAR, weight: 6,
    why: 'Much не вживають із злічуваними у множині. Безпечний варіант — a lot of.' },

  { id: 'i-afraid', re: /\bI\s+afraid\b/gi, fix: () => "I'm afraid",
    kind: K.CLARITY, weight: 9,
    why: 'Пропущене to be: I\'m afraid.' },

  { id: 'i-nervous', re: /\bI\s+(nervous|tired|scared|anxious|sure)\b/gi, fix: (m) => `I'm ${m[1]}`,
    kind: K.CLARITY, weight: 9,
    why: 'Перед прикметником стану потрібне I\'m.' },

  { id: 'feel-me', re: /\bfeel\s+my ?self\s+(bad|good|tired)\b/gi, fix: (m) => `feel ${m[1]}`,
    kind: K.NATURAL, weight: 5,
    why: 'Англійською просто I feel bad, без myself.' },

  { id: 'informations', re: /\binformations\b/gi, fix: () => 'information',
    kind: K.GRAMMAR, weight: 4, why: 'Information — незлічуване, форми informations немає.' },

  { id: 'advices', re: /\badvices\b/gi, fix: () => 'advice',
    kind: K.GRAMMAR, weight: 4, why: 'Advice — незлічуване, без -s.' },

  { id: 'all-time', re: /\ball\s+time\b/gi, fix: () => 'all the time',
    kind: K.NATURAL, weight: 5, why: 'Сталий вислів — all the time, з артиклем.' },

  { id: 'depend-from', re: /\bdepends?\s+from\b/gi, fix: () => 'depends on',
    kind: K.NATURAL, weight: 6, why: 'Depend завжди з on: it depends on.' },

  // ── типові помилки в розповіді про минуле (день 4) ──
  { id: 'didnt-had', re: /\bdidn(?:'|’)?t\s+had\b/gi, fix: () => "didn't have",
    kind: K.GRAMMAR, weight: 10,
    why: 'Після didn\'t дієслово повертається в початкову форму: didn\'t have, не didn\'t had.' },

  { id: 'was-hard-time', re: /\b(was|is)\s+(very\s+|really\s+)?(hard|difficult|good|bad)\s+time\b/gi,
    fix: (m) => `${m[1]} a ${m[2] || ''}${m[3]} time`, kind: K.GRAMMAR, weight: 8,
    why: 'Перед злічуваним іменником потрібен артикль: it was a hard time.' },

  { id: 'now-is', re: /\b(now|today|then)\s+is\s+(better|easier|harder|fine|ok|okay)\b/gi,
    fix: (m) => `${m[1]} it's ${m[2]}`, kind: K.CLARITY, weight: 9,
    why: 'В англійському реченні має бути підмет: now it\'s better, а не now is better.' },

  { id: 'come-out-from', re: /\bcome\s+out\s+from\s+it\b/gi, fix: () => 'came out of it',
    kind: K.NATURAL, weight: 8,
    why: 'Come out of — саме of. І якщо це вже позаду, то came, у минулому.' },

  // ── типові помилки в розповіді про себе (дні 6–7) ──
  { id: 'not-could', re: /\bI\s+not\s+(could|can|would|should|did)\b/gi,
    fix: (m) => ({ could: "I couldn't", can: "I can't", would: "I wouldn't",
                   should: "I shouldn't", did: "I didn't" })[m[1].toLowerCase()],
    kind: K.CLARITY, weight: 10,
    why: 'Заперечення приєднується до самого модального: I couldn\'t, а не I not could.' },

  { id: 'singular-dont',
    re: /\b(my\s+(?:wife|husband|mother|father|mom|dad|son|daughter|manager|boss|friend|brother|sister|teacher)|he|she|it)\s+don(?:'|’)?t\b/gi,
    fix: (m) => `${m[1]} doesn't`, kind: K.GRAMMAR, weight: 9,
    why: 'Коли підмет один — he, she, my wife — заперечення через doesn\'t, не don\'t.' },

  { id: 'want-bare-verb',
    re: /\b(want|need|try|hope|decide|plan|forget|promise)\s+(tell|say|go|call|talk|ask|do|write|speak|start|help|learn)\b/gi,
    fix: (m) => `${m[1]} to ${m[2]}`, kind: K.GRAMMAR, weight: 8,
    why: 'Після want, need, try, hope друге дієслово йде з to: I want to tell her.' },

  { id: 'say-someone', re: /\bsay\s+(her|him|them|me|us)\b/gi,
    fix: (m) => `tell ${m[1]}`, kind: K.NATURAL, weight: 8,
    why: 'Say щось — але tell комусь. I will tell her, не I will say her.' },

  { id: 'present-for-duration',
    re: /\bI\s+(carry|live|work|wait|study|learn|save|look)\s+([^.!?]{0,50}?)for\s+(\w+)\s+(years?|months?|weeks?|days?)\b/gi,
    fix: (m) => {
      const ING = { carry: 'carrying', live: 'living', work: 'working', wait: 'waiting',
                    study: 'studying', learn: 'learning', save: 'saving', look: 'looking' };
      return `I've been ${ING[m[1].toLowerCase()]} ${m[2]}for ${m[3]} ${m[4]}`;
    },
    kind: K.GRAMMAR, weight: 9,
    why: 'Коли дія почалася раніше й триває досі, англійською кажуть have been + -ing: I\'ve been carrying this for two years.' },

  // ── типові помилки в обіцянках (день 5) ──
  { id: 'will-to', re: /\bwill\s+to\s+(\w+)/gi, fix: (m) => `will ${m[1]}`,
    kind: K.GRAMMAR, weight: 10,
    why: 'Після will дієслово йде без to: I will call, не I will to call.' },

  { id: 'for-walk', re: /\bfor\s+walk\b/gi, fix: () => 'for a walk',
    kind: K.NATURAL, weight: 7,
    why: 'Go for a walk — сталий вислів, артикль обов\'язковий.' },

  { id: 'past-narrative-bare', re: /\b(everybody|everyone|nobody|somebody|he|she|they|we)\s+(laugh|smile|look|talk|walk|ask|answer|call|help|watch|listen|work|say|tell|have|come|go|see|know|make|take|get|happen|feel|think)\b(?!\s*(?:-|ing))/gi,
    fix: (m) => {
      const v = m[2].toLowerCase();
      return `${m[1]} ${PAST_FORMS[v] || (/e$/.test(v) ? v + 'd' : v + 'ed')}`;
    },
    kind: K.CLARITY, weight: 9,
    skipIf: (t) => !PAST_MARKER.test(t) && !/\bthe\s+first\s+time\b/i.test(t)
      && !/\bwhen\s+i\s+(came|come|arrived|arrive|moved|move)\b/i.test(t),
    why: 'Розповідь про минуле — і дієслова мають бути в минулому: nobody told, everybody laughed.' },

  // Для «I» це правило спрацьовує ЛИШЕ після явної вказівки на минуле
  // («this week I ask», «last year I go»). Спокуса застосувати його й
  // після крапки була, і я їй піддався — в результаті «I know how it
  // feels» перетворилося на «I knew», тобто розбір вчив неправильного.
  // У тексті, де минула розповідь сусідить із теперішнім твердженням,
  // правила не можуть вгадати час. Пропущена правка нешкідлива; хибна
  // псує саме те, чого людина прийшла вчитися.
  { id: 'past-narrative-i', re: /\b(this\s+week|last\s+\w+|yesterday|\w+\s+ago)\s+(i)\s+(say|ask|have|go|come|tell|see|get|make|take|call|walk|work)\b(?!\s*(?:-|ing))/gi,
    fix: (m) => {
      const v = m[3].toLowerCase();
      return `${m[1].toLowerCase()} I ${PAST_FORMS[v] || (/e$/.test(v) ? v + 'd' : v + 'ed')}`;
    },
    kind: K.CLARITY, weight: 9,
    why: 'Вказівка на минуле вимагає й дієслова в минулому: this week I asked, last year I went.' },

  { id: 'my-english', re: /\bmy\s+english\b/g, fix: () => 'my English',
    kind: K.GRAMMAR, weight: 2, why: 'Назви мов пишуть із великої літери: English.' },

  /* ---- знайдено 18.09.2026 на справжньому реченні користувача ----
     «I worried about my owner» не ловилося взагалі, хоча I'm worried about —
     це цільова конструкція самого дня 3. Правил на найчастіші помилки
     україномовних бракує; нижче — перша партія. ---- */

  { id: 'i-worried-about', re: /\bI\s+worried\s+about\b/gi, fix: () => "I'm worried about",
    kind: K.CLARITY, weight: 10,
    skipIf: (t) => PAST_MARKER.test(t),
    why: 'Про те, що турбує зараз, кажуть I\'m worried about. «I worried» — це минулий час: турбувався тоді, а вже ні.' },

  { id: 'i-was-worry', re: /\bI\s+was\s+worry\b/gi, fix: () => 'I was worried',
    kind: K.GRAMMAR, weight: 9,
    why: 'Після was потрібна форма worried.' },

  { id: 'past-marker-present', re: /\b(yesterday|last\s+(?:night|week|month|year))\s+I\s+(go|come|see|say|tell|make|take|have|do|feel|think|know|get)\b/gi,
    fix: (m) => `${m[1]} I ${PAST_FORMS[m[2].toLowerCase()]}`,
    kind: K.CLARITY, weight: 10,
    why: 'Слово про минуле вимагає й дієслова в минулому: yesterday I went, last week I saw.' },

  { id: 'in-hospital', re: /\bin\s+hospital\b/gi, fix: () => 'in the hospital',
    kind: K.NATURAL, weight: 4,
    why: 'В американській англійській кажуть in the hospital, з артиклем. Без артикля — британський варіант, теж правильний, але в США звучить незвично.' },

  { id: 'i-am-agree', re: /\bI\s+am\s+agree\b/gi, fix: () => 'I agree',
    kind: K.GRAMMAR, weight: 9,
    why: 'Agree — це дієслово, тому без am: I agree.' },

  { id: 'i-feel-myself', re: /\bI\s+feel\s+myself\b/gi, fix: () => 'I feel',
    kind: K.NATURAL, weight: 8,
    why: 'Англійською просто I feel tired. «Feel myself» звучить дивно й може прозвучати непристойно.' },

  { id: 'i-have-not', re: /\bI\s+have\s+not\s+(?!been\b|got\b)([a-z]+)\b/gi,
    fix: (m) => `I don't have ${m[1]}`,
    kind: K.CLARITY, weight: 8,
    why: 'Коли have означає «мати», заперечення будується через don\'t have.' },

  { id: 'much-people', re: /\b(much)\s+(people|friends|things|words|days)\b/gi,
    fix: (m) => `many ${m[2]}`, kind: K.GRAMMAR, weight: 7,
    why: 'Many — з тим, що рахується (people, friends). Much — з тим, що ні (time, money).' },

  /* ---- знайдено 18.09.2026, знову на справжньому реченні ----
     «I will called them this week» проходило без зауважень і
     пропонувалося зберегти на згадку. Will — це цільова конструкція
     дня 5, і саме на ній розбір мовчав. ---- */

  { id: 'will-past-form',
    re: /\b(will|'ll|’ll)\s+(called|worked|talked|tried|asked|told|went|saw|said|did|made|took|gave|got|came|knew|thought|felt|found|left|met|paid|ran|sent|spoke|wrote|began|brought|bought|built|chose|drove|ate|fell|flew|forgot|heard|held|kept|learned|lost|wanted|started|finished|decided|moved|opened|played|showed|stopped|turned|visited|waited|walked|watched|helped|looked|liked|lived|happened|wrote|slept|sat|won|wore)\b/gi,
    fix: (m) => `${m[1]} ${BASE_FORMS[m[2].toLowerCase()] || m[2].toLowerCase().replace(/ed$/, '')}`,
    kind: K.GRAMMAR, weight: 10,
    why: 'Після will дієслово стоїть у початковій формі: I will call, а не I will called. Will уже показує, що це майбутнє — минулий час тут зайвий.' },

  /* ---- маршрут «Далеко від дому» ----
     Обидві конструкції дня 2 вимагають -ing після is, і саме на цьому
     спотикається більшість: «the hardest part is eat alone». ---- */

  { id: 'is-bare-verb', re: /\b(part|thing|helps|helped)\s+is\s+(eat|call|cook|walk|wait|talk|speak|work|live|sit|stay|go|write|think|know|find|meet|learn|ask|sleep|drive|read|listen|watch)\b/gi,
    fix: (m) => `${m[1]} is ${ING_FORMS[m[2].toLowerCase()] || m[2].toLowerCase() + 'ing'}`,
    kind: K.GRAMMAR, weight: 10,
    why: 'Після «is» у таких реченнях дієслово стоїть із -ing: the hardest part is eating, what helps is calling.' },

  { id: 'is-to-verb', re: /\b(part|thing|helps|helped)\s+is\s+to\s+([a-z]+)\b/gi,
    fix: (m) => `${m[1]} is ${ING_FORMS[m[2].toLowerCase()] || m[2].toLowerCase() + 'ing'}`,
    kind: K.NATURAL, weight: 8,
    why: 'Тут природніше -ing, а не «to»: what helps is calling, а не what helps is to call. З «to» речення звучить як інструкція.' },

  { id: 'the-home', re: /\b(call|calling|go|going|come|coming|drive|driving|walk|walking)\s+the\s+home\b/gi,
    fix: (m) => `${m[1]} home`,
    kind: K.NATURAL, weight: 7,
    why: 'Home у значенні «додому» вживається без артикля: call home, go home, drive home.' },

  { id: 'miss-after', re: /\bmiss\s+(?:after|for|about)\s+/gi, fix: () => 'miss ',
    kind: K.GRAMMAR, weight: 8,
    why: 'Miss вживається без прийменника: I miss home, I miss my mother.' },

  { id: 'i-am-lonely-here', re: /\bi\s+am\s+alone\s+feel\b/gi, fix: () => 'I feel alone',
    kind: K.CLARITY, weight: 9,
    why: 'Порядок слів: I feel alone. Спершу підмет і дієслово, потім те, як саме.' },

  /* ---- маршрут «Далеко від дому», дні 3–5 ----
     Помилки тут інші, ніж у маршруті страху: більше минулого часу,
     більше третьої особи, більше артиклів перед професіями й людьми. ---- */

  { id: 'very-verb', re: /\b(i|we|they|you)\s+very\s+(miss|like|want|need|love|hope|enjoy)\b/gi,
    fix: (m) => `${m[1]} really ${m[2]}`,
    kind: K.NATURAL, weight: 9,
    why: 'Very не ставлять перед дієсловом. «Дуже сумую» — це I really miss.' },

  { id: 'used-to-past', re: /\bused\s+to\s+([a-z]+)\b/gi,
    fix: (m) => {
      const w = m[1].toLowerCase();
      const base = BASE_FORMS[w] || (/ed$/.test(w) ? w.replace(/ed$/, '') : w);
      return `used to ${base}`;
    },
    kind: K.GRAMMAR, weight: 9,
    why: 'Після used to дієслово в початковій формі: we used to talk, а не used to talked.' },

  { id: 'noone-know', re: /\bno\s+one\s+(here\s+)?(know|like|want|need|say|think|see|understand)\b/gi,
    fix: (m) => `no one ${m[2] ? '' : ''}${m[1] || ''}${m[2].toLowerCase()}s`.replace(/\s+/g, ' '),
    kind: K.GRAMMAR, weight: 9,
    why: 'No one за граматикою — одна особа, тому дієслово з -s: no one knows me.' },

  // id навмисно інший: правило нижче вже зветься third-person-s, а два
  // однакові id ламають відбір правок — одна з них мовчки зникає.
  // Це ширше: покриває everybody/nobody і не виключає «she know me».
  { id: 'third-person-s-wide', re: /\b(she|he|it|everybody|everyone|nobody|somebody)\s+(know|like|love|want|need|say|think|make|take|work|live|come|go|help|call|ask|look|seem|talk|laugh)\b/gi,
    fix: (m) => `${m[1]} ${THIRD_PERSON[m[2].toLowerCase()] || m[2].toLowerCase() + 's'}`,
    kind: K.GRAMMAR, weight: 8,
    why: 'З he, she, everybody дієслово в теперішньому часі має -s: she knows, everybody laughs.' },

  { id: 'third-person-s', re: /\b(it|he|she)\s+(help|make|take|work|feel|seem|look|need|want|mean|come|go|say|tell|know|think)\b(?!\s+(?:to\b|me\b|you\b|us\b))/gi,
    fix: (m) => `${m[1]} ${m[2]}s`, kind: K.GRAMMAR, weight: 8,
    why: 'Після it, he, she в теперішньому часі дієслово отримує -s: it helps.' },

  { id: 'firsttime-present', re: /\b(the\s+first\s+time\s+i)\s+(go|come|see|say|tell|make|take|have|do|feel|think|know|get|walk|call|try|meet)\b/gi,
    fix: (m) => `${m[1]} ${PAST_FORMS[m[2].toLowerCase()] || m[2].toLowerCase() + 'ed'}`,
    kind: K.CLARITY, weight: 10,
    why: '«The first time I…» — це про минуле, тож дієслово теж у минулому: the first time I went.' },

  { id: 'was-when-present', re: /\bwas\s+when\s+i\s+(realize|understand|know|see|feel|decide)\b/gi,
    fix: (m) => `was when I ${PAST_FORMS[m[1].toLowerCase()] || m[1].toLowerCase() + 'd'}`,
    kind: K.GRAMMAR, weight: 9,
    why: 'Was уже поставив речення в минуле — друге дієслово має бути там само: that was when I realized.' },

  { id: 'realized-am', re: /\b(realized|realised|knew|understood|felt|saw)\s+(that\s+)?i\s+(am|'m|\u2019m)\b/gi,
    fix: (m) => `${m[1].toLowerCase()} ${m[2] || ''}I was`.replace(/\s+/g, ' '),
    kind: K.GRAMMAR, weight: 8,
    why: 'Коли головне дієслово в минулому, друге теж зсувається назад: I realized I was a stranger.' },

  { id: 'didnt-past', re: /\bdidn(?:'|’)?t\s+(knew|had|went|saw|said|made|took|came|got|felt|thought|told|found|left)\b/gi,
    fix: (m) => `didn't ${BASE_FORMS[m[1].toLowerCase()] || m[1].toLowerCase()}`,
    kind: K.GRAMMAR, weight: 10,
    why: 'Після didn’t дієслово повертається в початкову форму: didn’t know, didn’t go.' },

  { id: 'modal-to', re: /\b(could|would|should|can|must|may|might)\s+to\s+([a-z]+)\b/gi,
    fix: (m) => `${m[1]} ${m[2]}`,
    kind: K.GRAMMAR, weight: 9,
    why: 'Після could, would, should «to» не ставлять: we could have lunch.' },

  { id: 'there-is-noart', re: /\bthere\s+(is|was)\s+(man|woman|guy|girl|person|boy|friend|neighbour|neighbor)\b/gi,
    fix: (m) => `there ${m[1].toLowerCase()} a ${m[2].toLowerCase()}`,
    kind: K.GRAMMAR, weight: 8,
    why: 'Перед злічуваним іменником в однині потрібен артикль: there is a man.' },

  { id: 'am-noart', re: /\b(i\s+am|i(?:'|’)m|was|is)\s+(stranger|foreigner|student|teacher|doctor|nurse|driver|guest)\b/gi,
    fix: (m) => `${m[1]} a ${m[2].toLowerCase()}`,
    kind: K.GRAMMAR, weight: 8,
    why: 'Перед професією чи роллю в однині ставлять артикль: I am a stranger, she is a nurse.' },

  { id: 'sentence-is', re: /(^|[.!?]\s+)Is\s+(a|very|not|quite|too)\b/g,
    fix: (m) => `${m[1]}It's ${m[2]}`,
    kind: K.CLARITY, weight: 10,
    why: 'Речення не може починатися з Is у розповіді — бракує підмета: It’s a bit awkward.' },

  /* ---- маршрут «Далеко від дому», дні 6–7 ---- */

  { id: 'when-i-come', re: /\bwhen\s+i\s+(come|arrive|move|start|first\s+come)\b/gi,
    fix: (m) => `when I ${PAST_FORMS[m[1].toLowerCase()] || m[1].toLowerCase() + 'd'}`,
    kind: K.CLARITY, weight: 10,
    why: '«When I came here» — про те, що вже сталося, тож дієслово в минулому.' },

  { id: 'it-need-time', re: /\bit\s+needs?\s+time\b/gi, fix: () => 'it takes time',
    kind: K.NATURAL, weight: 7,
    why: 'Сталий вислів — it takes time. «It needs time» звучить як переклад дослівно.' },

  { id: 'know-how-is-it', re: /\b(know|knew|see|saw|understand|understood|remember|remembered|imagine)\s+how\s+is\s+it\b/gi,
    fix: (m) => `${m[1].toLowerCase()} how it is`,
    kind: K.GRAMMAR, weight: 9,
    why: 'Це не питання, а частина речення — тому звичайний порядок слів: I know how it is.' },

  { id: 'for-me-was', re: /\bfor\s+me\s+(was|is)\b/gi, fix: (m) => `for me it ${m[1].toLowerCase()}`,
    kind: K.CLARITY, weight: 8,
    why: 'Бракує підмета: for me it was almost two years.' },

  { id: 'but-is', re: /\b(but|and|so)\s+is\s+(also|still|not|very|already)\b/gi,
    fix: (m) => `${m[1].toLowerCase()} it is ${m[2].toLowerCase()}`,
    kind: K.CLARITY, weight: 9,
    why: 'Після but потрібен новий підмет: but it is also this place now.' },

  { id: 'possessive-s', re: /\bmy\s+(mother|father|sister|brother|wife|husband|friend|son|daughter|parents)\s+(kitchen|house|home|voice|car|room|name|family|words|hands)\b/gi,
    fix: (m) => `my ${m[1].toLowerCase()}'s ${m[2].toLowerCase()}`,
    kind: K.GRAMMAR, weight: 8,
    why: 'Належність показують через ’s: my mother’s kitchen.' },

  { id: 'nothing-happen', re: /\bnothing\s+(bad\s+|good\s+|strange\s+)?happen\b/gi,
    fix: (m) => `nothing ${m[1] || ''}happened`,
    kind: K.GRAMMAR, weight: 9,
    why: 'Розповідь про те, що вже сталося: nothing bad happened.' },

  { id: 'like-noart', re: /\blike\s+(a\s+)?(guest|stranger|foreigner|tourist|child|baby|fool)\b/gi,
    fix: (m) => `like a ${m[2].toLowerCase()}`,
    kind: K.GRAMMAR, weight: 7,
    why: 'Перед злічуваним іменником в однині потрібен артикль: I feel like a guest.' },

  { id: 'if-it-get', re: /\bif\s+it\s+(get|become|seem|feel|look|happen)\b/gi,
    fix: (m) => `if it ${THIRD_PERSON[m[1].toLowerCase()] || m[1].toLowerCase() + 's'}`,
    kind: K.GRAMMAR, weight: 8,
    why: 'Після it у теперішньому часі дієслово з -s: if it gets hard.' },

  { id: 'ordinal-noart', re: /\b(on|in|at|that|since|during)\s+(first|second|last|hardest|easiest)\s+(year|day|week|month|time|part)\b/gi,
    fix: (m) => `${m[1].toLowerCase()} the ${m[2].toLowerCase()} ${m[3].toLowerCase()}`,
    kind: K.GRAMMAR, weight: 7,
    why: 'Перед порядковим числівником і найвищим ступенем ставлять the: on the first day.' },

  { id: 'is-superlative', re: /\bis\s+(hardest|easiest|best|worst|longest|shortest)\b/gi,
    fix: (m) => `is the ${m[1].toLowerCase()}`,
    kind: K.GRAMMAR, weight: 7,
    why: 'Найвищий ступінь вживається з the: the first year is the hardest.' },
];

function applyRules(text) {
  const found = [];
  // Правила застосовуються ПОСЛІДОВНО до вже виправленого тексту:
  // інакше виправлення, що залежить від попереднього, не спрацює.
  let improved = text;

  for (const rule of RULES) {
    // skipIf дає правилу право промовчати, коли контекст його спростовує:
    // «I worried about it yesterday» — законний минулий час, не помилка.
    if (rule.skipIf && rule.skipIf(improved)) continue;
    // Шукаємо перше входження, яке правило СПРАВДІ змінює. Більшість правил
    // написані широко (`like (a )?guest`, `used to (\w+)`), тому вони ловлять
    // і вже правильну форму й «виправляють» її саму в себе. Без цієї
    // перевірки людина бачила «used to talk → used to talk»: розбір, який
    // нічого не каже, але виглядає як знайдена помилка. Це підриває довіру
    // до всіх інших правок на екрані.
    const probe = new RegExp(rule.re.source, rule.re.flags.includes('g')
      ? rule.re.flags : rule.re.flags + 'g');
    let m = null;
    for (let hit = probe.exec(improved); hit; hit = probe.exec(improved)) {
      if (hit[0] === '') { probe.lastIndex++; continue; }
      if (rule.fix(hit) !== hit[0]) { m = hit; break; }
    }
    if (!m) continue;
    found.push({
      id: rule.id, kind: rule.kind,
      before: m[0], after: rule.fix(m),
      why: rule.why, weight: rule.weight,
    });
    improved = improved.replace(new RegExp(rule.re.source, rule.re.flags), (...a) => rule.fix(a));
  }
  return { found, improved };
}

/** Прибирає дрібні технічні шорсткості, не чіпаючи зміст. */
function tidy(text) {
  let t = text.replace(/\s+/g, ' ').trim();
  t = t.replace(/\s+([,.!?])/g, '$1');
  // велика літера на початку кожного речення
  t = t.replace(/(^|[.!?]\s+)([a-z])/g, (_, p, c) => p + c.toUpperCase());
  if (t && !/[.!?]$/.test(t)) t += '.';
  return t;
}

export function detectTargets(text, targets) {
  return targets.filter(t => t.match.some(re => re.test(text))).map(t => t.id);
}

export function createMockLlm() {
  return {
    id: 'rule-based',
    label: 'Демо-розбір за правилами (без AI)',
    async analyze({ transcript, targets = [] }) {
      await delay(700 + Math.random() * 600);
      const { found, improved } = applyRules(transcript);

      // Максимум 3. Спершу беремо по одній із кожної категорії (щоб розбір не
      // перетворився на три граматичні дрібниці), потім добираємо до трьох
      // найважливішими з решти — інакше слоти пропадали б даремно.
      const ranked = found.slice().sort((a, b) => b.weight - a.weight);
      const byKind = { [K.CLARITY]: [], [K.NATURAL]: [], [K.GRAMMAR]: [] };
      for (const f of ranked) byKind[f.kind].push(f);

      const corrections = [];
      for (const kind of [K.CLARITY, K.NATURAL, K.GRAMMAR]) {
        if (byKind[kind][0]) corrections.push(byKind[kind][0]);
      }
      for (const f of ranked) {
        if (corrections.length >= 3) break;
        if (!corrections.includes(f)) corrections.push(f);
      }
      corrections.sort((a, b) => b.weight - a.weight);
      corrections.length = Math.min(corrections.length, 3);

      return {
        corrections,
        improved: tidy(improved),
        usedTargets: detectTargets(transcript, targets),
        totalFound: found.length,
        isDemo: true,
        provider: 'rule-based',
      };
    },
  };
}

/* ============================================================
   TTS — справжнє озвучення голосом браузера (Web Speech API).
   Це НЕ мок: звук реальний. Але голос і якість залежать від
   пристрою, тому в UI підписано «голос браузера».
   ============================================================ */
export function createBrowserTts() {
  let current = null;
  const ok = typeof window !== 'undefined' && 'speechSynthesis' in window;

  function pickVoice() {
    try {
      const vs = window.speechSynthesis.getVoices() || [];
      return vs.find(v => /^en[-_]US/i.test(v.lang) && /natural|premium|enhanced|samantha|ava/i.test(v.name))
          || vs.find(v => /^en[-_]US/i.test(v.lang))
          || vs.find(v => /^en/i.test(v.lang)) || null;
    } catch { return null; }
  }

  return {
    id: 'browser-tts',
    label: 'Озвучення голосом браузера',
    available: () => ok,
    stop() { if (ok) { try { window.speechSynthesis.cancel(); } catch {} } current = null; },
    speak(text, { rate = 0.92, onend } = {}) {
      if (!ok) { onend && onend(); return false; }
      try {
        window.speechSynthesis.cancel();
        const u = new SpeechSynthesisUtterance(text);
        u.lang = 'en-US'; u.rate = rate; u.pitch = 1;
        const v = pickVoice(); if (v) u.voice = v;
        u.onend = () => { current = null; onend && onend(); };
        u.onerror = () => { current = null; onend && onend(); };
        current = u;
        window.speechSynthesis.speak(u);
        return true;
      } catch { onend && onend(); return false; }
    },
  };
}

function delay(ms) { return new Promise(r => setTimeout(r, ms)); }

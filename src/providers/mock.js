import { CORRECTION_KINDS as K } from './types.js';

/* ============================================================
   MOCK STT — НЕ розпізнає голос. Повертає підготовлений
   демонстраційний текст. Прапорець isDemo:true веде в UI-плашку.
   ============================================================ */
export function createMockStt(demoByDay) {
  const pick = (day) => (typeof demoByDay === 'function' ? demoByDay(day) : demoByDay) || '';
  return {
    id: 'mock-stt',
    label: 'Демо-розпізнавання (без AI)',
    async transcribe(blob, opts = {}) {
      await delay(900 + Math.random() * 700);
      return {
        text: pick(opts.day),
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

  { id: 'third-person-s', re: /\b(it|he|she)\s+(help|make|take|work|feel|seem|look|need|want|mean|come|go|say|tell|know|think)\b(?!\s+(?:to\b|me\b|you\b|us\b))/gi,
    fix: (m) => `${m[1]} ${m[2]}s`, kind: K.GRAMMAR, weight: 8,
    why: 'Після it, he, she в теперішньому часі дієслово отримує -s: it helps.' },

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
    const probe = new RegExp(rule.re.source, rule.re.flags.replace('g', ''));
    const m = probe.exec(improved);
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

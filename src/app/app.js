import { h, mount } from '../lib/dom.js';
import * as store from '../lib/storage.js';
import { track } from '../lib/analytics.js';
import { getProviders, textAsTranscript } from '../providers/index.js';
import { detectTargets } from '../providers/mock.js';
import { detectCrisis } from '../lib/safety.js';
import { LandingScreen } from '../screens/landing.js';
import { OnboardingScreen, ModeScreen, ONBOARDING_QUESTIONS, ONBOARDING_TOTAL } from '../screens/onboarding.js';
import { RouteScreen } from '../screens/route-home.js';
import { LessonScreen, stepsOf, splitSentences } from '../screens/lesson.js';
import { CrisisScreen } from '../screens/crisis.js';
import { SettingsScreen, PrivacyScreen, ProgressScreen } from '../screens/settings.js';
import { getLesson, isDayUnlocked, nextDay, BUILT_DAYS, routeComplete } from '../content/lessons.js';

const root = document.getElementById('root');
const providers = getProviders();

let state = store.load();
let draft = { name: state.name, region: state.region, comfort: state.comfort, reminder: state.reminder };
let obIndex = 0;

/** Ефемерний стан уроку. Аудіо живе ТІЛЬКИ тут, у пам'яті вкладки. */
let ls = freshLesson();
function freshLesson() {
  return {
    day: 1, step: 0, audioBlob: null, durationMs: 0, transcript: null, analysis: null,
    retakes: 0, savedPhrase: null, pickedPhrase: null, textMode: false, textDraft: '',
    micError: null, processingNote: '', crisis: false,
    shadowIndex: 0, shadowDone: [], shadowRec: {}, shadowMs: 0,
    templateSlots: {}, templateSentence: '',
  };
}

function persist() { store.save(state); }
function go(hash) { if (location.hash !== hash) location.hash = hash; else render(); }
export function rerender() { render(); }

/* ---------------- router ---------------- */

function render() {
  const hash = location.hash || '#/';
  const [, route, param] = hash.split('/');

  // Захист: не пускати в урок без онбордингу
  if ((route === 'lesson' || route === 'route' || route === 'progress' || route === 'settings') && !state.onboarded) {
    return go('#/');
  }

  switch (route) {
    case '':
    case undefined:
      return mount(root, state.onboarded ? routeHome() : LandingScreen({
        providerMode: providers.mode,
        onStart: () => { obIndex = 0; go('#/onboarding'); },
        onPrivacy: () => go('#/privacy'),
      }));

    case 'onboarding':
      return mount(root, OnboardingScreen({
        draft, index: obIndex, total: ONBOARDING_TOTAL,
        onChange: (k, v) => { draft[k] = v; },
        onBack: () => { if (obIndex === 0) go('#/'); else { obIndex--; render(); } },
        onDone: () => {
          if (obIndex < ONBOARDING_QUESTIONS.length - 1) { obIndex++; render(); }
          else go('#/mode');
        },
      }));

    case 'mode':
      return mount(root, ModeScreen({
        value: state.mode, index: ONBOARDING_TOTAL - 1, total: ONBOARDING_TOTAL,
        onPick: (v) => { state.mode = v; render(); },
        onBack: () => { obIndex = ONBOARDING_QUESTIONS.length - 1; go('#/onboarding'); },
        onDone: () => {
          Object.assign(state, draft, { onboarded: true, activeDay: nextDay(state.completedDays) });
          persist();
          track('onboarding_completed', { mode: state.mode });
          go('#/route');
        },
      }));

    case 'route':
      return mount(root, routeHome());

    case 'lesson': {
      const day = Number(param) || nextDay(state.completedDays);
      const lesson = getLesson(day);
      if (!lesson || !isDayUnlocked(day, state.completedDays, state.unlockAll)) return go('#/route');
      if (ls.day !== day) { ls = freshLesson(); ls.day = day; }
      if (ls.crisis) {
        return mount(root, CrisisScreen({
          region: state.region,
          onBack: () => { ls.crisis = false; ls.step = stepsOf(lesson).indexOf('record'); render(); },
          onExit: () => { ls = freshLesson(); go('#/route'); },
        }));
      }
      return mount(root, LessonScreen(lessonCtx(lesson)));
    }

    case 'progress':
      return mount(root, ProgressScreen({ state, onBack: () => go('#/route') }));

    case 'settings':
      return mount(root, SettingsScreen({
        state, providerMode: providers.mode,
        hasRecording: !!ls.audioBlob,
        onBack: () => go('#/route'),
        onChangeMode: (v) => { state.mode = v; persist(); render(); },
        unlockAll: !!state.unlockAll,
        onToggleUnlock: () => { state.unlockAll = !state.unlockAll; persist(); render(); },
        onDeleteRecording: () => { deleteRecording(); render(); },
        onRestart: () => {
          const mode = state.mode, name = state.name, region = state.region;
          state = { ...store.DEFAULT_STATE, onboarded: true, mode, name, region, activeDay: 1, createdAt: new Date().toISOString() };
          ls = freshLesson(); persist(); go('#/route');
        },
        onWipe: () => {
          // Подію фіксуємо ДО стирання: інакше вона сама лишиться в сховищі
          // після «видалити все» — що прямо суперечить обіцянці.
          track('user_data_deleted');
          store.wipe();
          state = store.load(); ls = freshLesson(); draft = {}; obIndex = 0;
          go('#/');
        },
      }));

    case 'privacy':
      return mount(root, PrivacyScreen({
        standalone: !state.onboarded,
        onBack: () => go(state.onboarded ? '#/settings' : '#/'),
      }));

    default:
      return go('#/');
  }
}

function routeHome() {
  return RouteScreen({
    state,
    onOpenDay: (d) => {
      if (!isDayUnlocked(d, state.completedDays, state.unlockAll)) return;
      ls = freshLesson(); ls.day = d;
      track('lesson_started', { day: d, mode: state.mode });
      go('#/lesson/' + d);
    },
    onSettings: () => go('#/settings'),
    onProgress: () => go('#/progress'),
  });
}

/* ---------------- lesson controller ---------------- */

function deleteRecording() {
  ls.audioBlob = null; ls.durationMs = 0;
  if (state.recordings) delete state.recordings[String(ls.day)];
  persist();
  track('recording_deleted', { day: ls.day });
}

function lessonCtx(lesson) {
  const SEQ = stepsOf(lesson);
  const done = state.completedDays || [];
  const upcoming = BUILT_DAYS.find(d => d > lesson.day);
  return {
    ls, lesson, mode: state.mode || 'open', tts: providers.tts, providerMode: providers.mode,
    rerender: render,
    completedDays: done,
    savedPhrases: state.savedPhrases || [],
    lessonsState: state.lessons || {},
    routeNote: upcoming
      ? `Пройдено ${new Set([...done, lesson.day]).size} із 7 днів. Наступний — день ${upcoming}.`
      : `Маршрут пройдено повністю — усі 7 днів.`,
    nextDayLabel: upcoming ? `Далі: день ${upcoming}` : 'До підсумків маршруту',
    onFinish: () => {
      providers.tts.stop();
      if (upcoming) { ls = freshLesson(); ls.day = upcoming; track('lesson_started', { day: upcoming, mode: state.mode }); go('#/lesson/' + upcoming); }
      else go('#/route');
    },

    goStep: (i) => {
      ls.step = Math.max(0, Math.min(SEQ.length - 1, i));
      if (SEQ[ls.step] === 'complete') completeLesson(lesson);
      render();
    },

    onExit: () => { providers.tts.stop(); go('#/route'); },

    acceptConsent: () => {
      state.consent = { voice: true, at: new Date().toISOString() };
      persist();
    },

    useTextMode: () => {
      ls.textMode = true; ls.micError = null;
      const i = SEQ.indexOf('record');
      if (i >= 0) ls.step = i;
      render();
    },

    setTemplateSentence: (text) => { ls.templateSentence = text; persist(); },
    useVoiceMode: () => { ls.textMode = false; render(); },

    setMicError: (kind) => { ls.micError = kind; render(); },

    setRecording: (blob, durationMs) => {
      ls.audioBlob = blob; ls.durationMs = durationMs;
      state.recordings = state.recordings || {};
      state.recordings[String(ls.day)] = { createdAt: Date.now(), durationMs };
      persist();
      ls.step = SEQ.indexOf('review');
      render();
    },

    deleteRecording: () => { deleteRecording(); ls.step = SEQ.indexOf('record'); render(); },

    retake: () => {
      ls.retakes += 1;
      ls.audioBlob = null; ls.durationMs = 0; ls.transcript = null; ls.analysis = null;
      track('retry_started', { day: ls.day, count: ls.retakes });
      ls.step = SEQ.indexOf('record');
      render();
    },

    submitVoice: async () => {
      track('voice_submitted', { day: ls.day, durationMs: ls.durationMs });
      ls.processingNote = providers.mode === 'mock'
        ? 'Демо-режим: справжнє розпізнавання не підключене.'
        : 'Надсилаю аудіо на розпізнавання…';
      ls.step = SEQ.indexOf('processing');
      render();
      try {
        const t = await providers.stt.transcribe(ls.audioBlob, { durationMs: ls.durationMs, lang: 'en', day: ls.day });
        // Аудіо більше не потрібне — видаляємо одразу, як і обіцяно.
        ls.audioBlob = null;
        track('transcription_succeeded', { day: ls.day, provider: t.provider });
        await afterTranscript(t, lesson);
      } catch (err) {
        track('transcription_failed', { day: ls.day, reason: (err && err.name) || 'error' });
        ls.processingNote = '';
        ls.transcript = null;
        ls.step = SEQ.indexOf('review');
        render();
        alert('Не вдалося розпізнати запис. Спробуйте ще раз або пройдіть урок текстом.');
      }
    },

    submitText: async (text) => {
      ls.processingNote = 'Розбираю текст…';
      ls.step = SEQ.indexOf('processing');
      render();
      await new Promise(r => setTimeout(r, 450));
      await afterTranscript(textAsTranscript(text), lesson);
    },

    savePhrase: (text) => {
      ls.savedPhrase = text;
      state.savedPhrases = state.savedPhrases || [];
      if (!state.savedPhrases.some(p => p.text === text)) {
        state.savedPhrases.push({ id: 'p' + Date.now(), text, day: ls.day, at: Date.now() });
      }
      persist();
      track('phrase_saved', { day: ls.day });
    },
  };
}

async function afterTranscript(t, lesson) {
  ls.transcript = t;

  // КРИЗОВИЙ ЗАПОБІЖНИК: якщо спрацював — мовний розбір не запускається взагалі.
  const crisis = detectCrisis(t.text);
  if (crisis.crisis) {
    ls.crisis = true;
    ls.analysis = null;
    render();
    return;
  }

  try {
    ls.analysis = await providers.llm.analyze({
      transcript: t.text, targets: lesson.targets, level: 'A2-B1',
    });
    // Ужиті конструкції рахуються ТІЛЬКИ по сирому тексту людини — і ТІЛЬКИ
    // тут, у коді. Довіряти в цьому моделі не можна: на першому ж живому
    // запиті (19.09.2026) вона зарахувала «I'm worried about» людині, яка
    // сказала «I worried about» — тобто конструкцію, що з'явилася аж після
    // її ж виправлення. Промпт це забороняв; модель заборону проігнорувала.
    // Промпт — прохання, перевірка — код. Те саме правило, що й у дні 6.
    if (ls.analysis) {
      ls.analysis.usedTargets = detectTargets(t.text, lesson.targets || []);
    }
  } catch (err) {
    // Тут була діра: провал розбору підміняв себе «порожнім розбором», і
    // далі екран показував текст користувача як покращену версію. Тобто
    // помилка мережі виглядала як «у тебе все правильно». Тепер провал
    // лишається провалом і так і називається.
    track('analysis_failed', { day: ls.day, reason: (err && err.name) || 'error' });
    ls.analysis = {
      corrections: [], improved: t.text, usedTargets: [], totalFound: 0,
      isDemo: false, failed: true, provider: 'failed',
    };
  }
  ls.step = stepsOf(lesson).indexOf('transcript');
  render();
}

function completeLesson(lesson) {
  const day = lesson.day;
  const key = String(day);
  state.completedDays = Array.from(new Set([...(state.completedDays || []), day]));
  state.activeDay = nextDay(state.completedDays);
  state.lessons = state.lessons || {};
  state.lessons[key] = {
    completed: true,
    completedAt: Date.now(),
    kind: lesson.kind,
    retakes: ls.retakes,
    speechMs: (lesson.kind === 'shadowing' ? ls.shadowMs : ls.durationMs) || 0,
    usedTargets: (ls.analysis && ls.analysis.usedTargets) || [],
    phrasesSaid: (ls.shadowDone || []).length,
    viaText: !!ls.textMode,
  };
  if (state.recordings) delete state.recordings[key];
  persist();
  track('lesson_completed', { day, ms: ls.durationMs || 0, mode: state.mode });
}

/* ---------------- PWA install ---------------- */

let deferredPrompt = null;
window.addEventListener('beforeinstallprompt', (e) => {
  e.preventDefault(); deferredPrompt = e;
  track('app_install_prompt_shown');
});
window.addEventListener('appinstalled', () => { track('app_installed'); deferredPrompt = null; });
window.__SIA_INSTALL__ = () => {
  if (!deferredPrompt) return false;          // Safari не має цього API — показуємо інструкцію
  deferredPrompt.prompt(); deferredPrompt = null; return true;
};

/* ---------------- boot ---------------- */

window.addEventListener('hashchange', render);
document.addEventListener('visibilitychange', () => { if (document.hidden) providers.tts.stop(); });

// прогрів голосів TTS (Safari/Chrome віддають список асинхронно)
try { window.speechSynthesis && window.speechSynthesis.getVoices(); } catch {}

render();

// діагностика для тестів
window.__SIA__ = {
  get state() { return state; },
  get lesson() { return ls; },
  get providers() { return providers; },
  render, go,
};

import { h } from '../lib/dom.js';
import { topbar, steps, actionbar } from '../app/ui.js';
import { track } from '../lib/analytics.js';

const QUESTIONS = [
  {
    key: 'name', kind: 'text',
    title: 'Як до тебе звертатися?',
    sub: 'Одне слово. Можна вигадане — застосунок нікуди його не надсилає.',
    placeholder: 'Ім\'я',
    optional: true,
  },
  {
    key: 'region', kind: 'choice',
    title: 'Де ти зараз живеш?',
    sub: 'Потрібно лише щоб підібрати час нагадування й контакти допомоги.',
    options: [
      { v: 'us', label: 'США' },
      { v: 'ca', label: 'Канада' },
      { v: 'eu', label: 'Європа або Велика Британія' },
      { v: 'ua', label: 'Україна' },
      { v: 'other', label: 'Інше' },
    ],
  },
  {
    key: 'comfort', kind: 'choice',
    title: 'Наскільки тобі комфортно говорити англійською?',
    sub: 'Питаємо не про рівень, а про відчуття. Це чесніший орієнтир.',
    options: [
      { v: 'silent', label: 'Розумію, але говорити боюся', hint: 'Почнемо з повторення за диктором' },
      { v: 'few',    label: 'Кілька речень можу', hint: 'Це рівно те, що треба для цього маршруту' },
      { v: 'errors', label: 'Говорю, але з помилками', hint: 'Попрацюємо над природністю' },
      { v: 'fluent', label: 'Говорю вільно', hint: 'Чесно: цей маршрут буде для тебе застарим' },
    ],
  },
  {
    key: 'reminder', kind: 'choice',
    title: 'Коли нагадувати?',
    sub: 'У цій версії нагадування ще не надсилаються — ми лише запам\'ятаємо вибір.',
    options: [
      { v: 'morning', label: 'Зранку' },
      { v: 'midday', label: 'Вдень' },
      { v: 'evening', label: 'Увечері' },
      { v: 'none', label: 'Не нагадувати' },
    ],
  },
];

export const MODES = [
  {
    v: 'christian', label: 'Я християнин',
    hint: 'Практика в кінці уроку — коротка молитва своїми словами.',
  },
  {
    v: 'open', label: 'Я досліджую / відкритий',
    hint: 'Без духовних припущень. Практика — хвилина рефлексії для себе.',
  },
];

export function OnboardingScreen({ draft, onChange, onDone, onBack, index, total }) {
  const q = QUESTIONS[index];
  if (index === 0) track('onboarding_started');

  const canGo = q.optional || !!draft[q.key];

  const body = q.kind === 'text'
    ? h('input.field', {
        type: 'text', value: draft[q.key] || '', placeholder: q.placeholder,
        autocomplete: 'given-name', enterkeyhint: 'next',
        style: { minHeight: '56px', height: '56px' },
        oninput: (e) => onChange(q.key, e.target.value.slice(0, 40)),
        onkeydown: (e) => { if (e.key === 'Enter') { e.preventDefault(); onDone(); } },
      })
    : h('div', ...q.options.map(o => h('button.choice', {
        type: 'button',
        'aria-pressed': draft[q.key] === o.v ? 'true' : 'false',
        onclick: () => { onChange(q.key, o.v); setTimeout(onDone, 160); },
      },
        h('.choice__dot'),
        h('.choice__body', h('b', o.label), o.hint ? h('span', o.hint) : null),
      )));

  return h('.screen',
    topbar({ onBack, title: `Крок ${index + 1} з ${total}` }),
    steps(total, index),
    h('.flow.pad-bottom', h('.wrap',
      h('h2', { style: { marginTop: '14px' } }, q.title),
      h('p.muted', { style: { marginBottom: '20px' } }, q.sub),
      body,
    )),
    actionbar(
      h('button.btn.btn--primary', { type: 'button', disabled: !canGo, onclick: onDone },
        index === total - 1 ? 'Далі' : 'Далі'),
      q.optional ? h('button.btn.btn--quiet', { type: 'button', onclick: onDone }, 'Пропустити') : null,
    ),
  );
}

export function ModeScreen({ value, onPick, onBack, onDone, index, total }) {
  return h('.screen',
    topbar({ onBack, title: `Крок ${index + 1} з ${total}` }),
    steps(total, index),
    h('.flow.pad-bottom', h('.wrap',
      h('h2', { style: { marginTop: '14px' } }, 'Що тобі ближче зараз?'),
      h('p.muted', { style: { marginBottom: '20px' } },
        'Це змінює тон і практику в кінці уроку. Біблійний текст і мовна частина однакові для всіх. Вибір можна змінити будь-коли в налаштуваннях.'),
      ...MODES.map(m => h('button.choice', {
        type: 'button',
        'aria-pressed': value === m.v ? 'true' : 'false',
        onclick: () => onPick(m.v),
      },
        h('.choice__dot'),
        h('.choice__body', h('b', m.label), h('span', m.hint)),
      )),
      h('p.tiny', { style: { marginTop: '16px' } },
        'Третій режим — «просто хочу англійську» — у цій версії свідомо не реалізований. Він вимагає повністю нейтрального контенту, тобто окремої версії уроків.'),
    )),
    actionbar(
      h('button.btn.btn--primary', { type: 'button', disabled: !value, onclick: onDone }, 'Почати'),
    ),
  );
}

export const ONBOARDING_QUESTIONS = QUESTIONS;
export const ONBOARDING_TOTAL = QUESTIONS.length + 1; // + екран режиму

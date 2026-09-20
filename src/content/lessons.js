import { LESSON_DAY1 } from './lesson-day1.js';
import { LESSON_DAY2 } from './lesson-day2.js';
import { LESSON_DAY3 } from './lesson-day3.js';
import { LESSON_DAY4 } from './lesson-day4.js';
import { LESSON_DAY5 } from './lesson-day5.js';
import { LESSON_DAY6 } from './lesson-day6.js';
import { LESSON_DAY7 } from './lesson-day7.js';
import { LESSON_ALONE1 } from './lesson-alone1.js';
import { LESSON_ALONE2 } from './lesson-alone2.js';
import { LESSON_ALONE3 } from './lesson-alone3.js';
import { LESSON_ALONE4 } from './lesson-alone4.js';
import { LESSON_ALONE5 } from './lesson-alone5.js';
import { LESSON_ALONE6 } from './lesson-alone6.js';
import { LESSON_ALONE7 } from './lesson-alone7.js';
import { DEFAULT_ROUTE_ID } from './routes.js';

// Уроки за маршрутами. Ключ верхнього рівня — id маршруту, далі номер дня.
export const BY_ROUTE = {
  'fear-7': {
    1: LESSON_DAY1, 2: LESSON_DAY2, 3: LESSON_DAY3, 4: LESSON_DAY4,
    5: LESSON_DAY5, 6: LESSON_DAY6, 7: LESSON_DAY7,
  },
  'alone-7': {
    1: LESSON_ALONE1, 2: LESSON_ALONE2, 3: LESSON_ALONE3, 4: LESSON_ALONE4,
    5: LESSON_ALONE5, 6: LESSON_ALONE6, 7: LESSON_ALONE7,
  },
};

/** Дні, які реально написані. Решта чесно позначені як «готується». */
export function builtDays(routeId = DEFAULT_ROUTE_ID) {
  return Object.keys(BY_ROUTE[routeId] || {}).map(Number).sort((a, b) => a - b);
}

/** Сумісність зі старим кодом і тестами: дні першого маршруту. */
export const LESSONS = BY_ROUTE[DEFAULT_ROUTE_ID];
export const BUILT_DAYS = builtDays(DEFAULT_ROUTE_ID);

/** Увесь маршрут пройдено. */
export function routeComplete(completedDays = [], routeId = DEFAULT_ROUTE_ID) {
  const days = builtDays(routeId);
  return days.length > 0 && days.every(d => completedDays.includes(d));
}

export function getLesson(day, routeId = DEFAULT_ROUTE_ID) {
  const r = BY_ROUTE[routeId] || {};
  return r[Number(day)] || null;
}

/** День відкритий, якщо він перший, або попередній уже пройдено. */
export function isDayUnlocked(day, completedDays = [], unlockAll = false, routeId = DEFAULT_ROUTE_ID) {
  const days = builtDays(routeId);
  const n = Number(day);
  if (!days.includes(n)) return false;
  if (unlockAll || n === days[0]) return true;
  return completedDays.includes(n - 1);
}

/** Наступний день, який людині варто відкрити. */
export function nextDay(completedDays = [], routeId = DEFAULT_ROUTE_ID) {
  const days = builtDays(routeId);
  return days.find(d => !completedDays.includes(d)) || days[days.length - 1];
}

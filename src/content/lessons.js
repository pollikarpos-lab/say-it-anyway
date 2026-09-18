import { LESSON_DAY1 } from './lesson-day1.js';
import { LESSON_DAY2 } from './lesson-day2.js';
import { LESSON_DAY3 } from './lesson-day3.js';
import { LESSON_DAY4 } from './lesson-day4.js';
import { LESSON_DAY5 } from './lesson-day5.js';

export const LESSONS = { 1: LESSON_DAY1, 2: LESSON_DAY2, 3: LESSON_DAY3, 4: LESSON_DAY4, 5: LESSON_DAY5 };
export const BUILT_DAYS = [1, 2, 3, 4, 5];

export function getLesson(day) { return LESSONS[Number(day)] || null; }

/** День відкритий, якщо він перший, або попередній уже пройдено. */
export function isDayUnlocked(day, completedDays = [], unlockAll = false) {
  const n = Number(day);
  if (!BUILT_DAYS.includes(n)) return false;
  if (unlockAll || n === BUILT_DAYS[0]) return true;
  return completedDays.includes(n - 1);
}

/** Наступний день, який людині варто відкрити. */
export function nextDay(completedDays = []) {
  return BUILT_DAYS.find(d => !completedDays.includes(d)) || BUILT_DAYS[BUILT_DAYS.length - 1];
}

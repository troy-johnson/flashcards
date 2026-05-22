import type { PracticeCard, PracticeSession } from "../api/types";

export type ActivePractice = {
  session: PracticeSession;
  index: number;
  shown_at: string;
};

const key = (studentId: string) => `literacy.practice.${studentId}`;

export const savePractice = (studentId: string, practice: ActivePractice): void => {
  sessionStorage.setItem(key(studentId), JSON.stringify(practice));
};

export const loadPractice = (studentId: string): ActivePractice | null => {
  const raw = sessionStorage.getItem(key(studentId));
  if (!raw) return null;
  return JSON.parse(raw) as ActivePractice;
};

export const currentCard = (practice: ActivePractice): PracticeCard | null =>
  practice.session.plan.cards[practice.index] ?? null;

export const advancePractice = (studentId: string, practice: ActivePractice): ActivePractice | null => {
  const nextIndex = practice.index + 1;
  if (nextIndex >= practice.session.plan.cards.length) {
    sessionStorage.removeItem(key(studentId));
    return null;
  }

  const next = { ...practice, index: nextIndex, shown_at: new Date().toISOString() };
  savePractice(studentId, next);
  return next;
};

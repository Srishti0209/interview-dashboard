import { db } from '@/lib/db';
import { logStudyDay } from '@/lib/streak';
import type { ReviewState, Confidence } from '@/types';

export type Rating = 'again' | 'hard' | 'good' | 'easy';

export const DAY_MS = 86_400_000;
const MIN_EASE = 1.3;
const DEFAULT_EASE = 2.5;

export interface SrsConfig {
  /** Multiplier applied on "Hard". */
  hardFactor: number;
  /** Extra multiplier applied on "Easy" (on top of easeFactor). */
  easyBonus: number;
}

export const defaultSrsConfig: SrsConfig = {
  hardFactor: 1.2,
  easyBonus: 1.3,
};

function clampConfidence(n: number): Confidence {
  return Math.max(0, Math.min(5, Math.round(n))) as Confidence;
}

/**
 * Simplified SM-2. Given the previous review state (or undefined for a brand
 * new card) and a rating, returns the next review state.
 */
export function computeNextReview(
  prev: ReviewState | undefined,
  rating: Rating,
  now = Date.now(),
  config: SrsConfig = defaultSrsConfig,
): ReviewState {
  const questionId = prev?.questionId ?? '';
  let ease = prev?.easeFactor ?? DEFAULT_EASE;
  let interval = prev?.intervalDays ?? 1;
  const prevConf = prev?.confidence ?? 0;
  let confidence: Confidence;

  switch (rating) {
    case 'again':
      interval = 1;
      ease = Math.max(MIN_EASE, ease - 0.2);
      confidence = clampConfidence(1);
      break;
    case 'hard':
      interval = Math.max(1, interval * config.hardFactor);
      ease = Math.max(MIN_EASE, ease - 0.15);
      confidence = clampConfidence(Math.max(2, prevConf));
      break;
    case 'good':
      interval = interval * ease;
      confidence = clampConfidence(prevConf + 1);
      break;
    case 'easy':
      interval = interval * ease * config.easyBonus;
      ease = ease + 0.15;
      confidence = clampConfidence(prevConf + 2);
      break;
  }

  // brand-new cards start at a 1-day interval regardless of multiplier
  if (!prev) interval = rating === 'easy' ? 4 : 1;

  interval = Math.round(interval * 100) / 100;

  return {
    questionId,
    confidence,
    lastReviewed: now,
    nextDue: now + interval * DAY_MS,
    intervalDays: interval,
    easeFactor: Math.round(ease * 100) / 100,
    reviewCount: (prev?.reviewCount ?? 0) + 1,
  };
}

/** Apply a rating to a question, persisting the new review state. */
export async function reviewQuestion(
  questionId: string,
  rating: Rating,
  config?: SrsConfig,
): Promise<ReviewState> {
  const prev = await db.reviewStates.get(questionId);
  const next = computeNextReview(prev, rating, Date.now(), config);
  next.questionId = questionId;
  await db.reviewStates.put(next);
  logStudyDay();
  return next;
}

/** Question ids whose review is due now (nextDue <= now). */
export async function dueQuestionIds(now = Date.now()): Promise<string[]> {
  const due = await db.reviewStates.where('nextDue').belowOrEqual(now).toArray();
  return due.map((r) => r.questionId);
}

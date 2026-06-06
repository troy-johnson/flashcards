/** A scored attempt as it bears on review evaluation. */
export type ReviewAttempt = {
  result: "correct" | "incorrect" | "skipped";
  duration_ms: number;
};

export type ReviewEvaluation = {
  /** Number of attempts considered. */
  sampleSize: number;
  /** Share of attempts marked correct (0..1). */
  accuracy: number;
  /** Share of attempts answered within the automaticity threshold (0..1). Recorded, not gated. */
  automaticity: number;
  /** True when accuracy >= 0.9 over a sample of >= 4 attempts. */
  reviewPassed: boolean;
};

/** Attempts at or under this many ms count as automatic (fluent) recall. */
const AUTOMATICITY_MS = 2000;
const MIN_SAMPLE = 4;
const PASS_ACCURACY = 0.9;

/**
 * Evaluates a skill's review readiness from its recent attempts.
 *
 * A skill passes review when accuracy is at least 90% over at least 4 attempts.
 * Automaticity (the share answered within 2000ms) is recorded for reporting but
 * never gates `reviewPassed`.
 */
export function evaluateReviewSkill(attempts: ReviewAttempt[]): ReviewEvaluation {
  const sampleSize = attempts.length;
  if (sampleSize === 0) {
    return { sampleSize: 0, accuracy: 0, automaticity: 0, reviewPassed: false };
  }

  const correct = attempts.filter((a) => a.result === "correct").length;
  const automatic = attempts.filter((a) => a.duration_ms <= AUTOMATICITY_MS).length;

  const accuracy = correct / sampleSize;
  const automaticity = automatic / sampleSize;
  const reviewPassed = sampleSize >= MIN_SAMPLE && accuracy >= PASS_ACCURACY;

  return { sampleSize, accuracy, automaticity, reviewPassed };
}

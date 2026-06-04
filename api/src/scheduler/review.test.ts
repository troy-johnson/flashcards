import { describe, expect, it } from "vitest";
import { evaluateReviewSkill, type ReviewAttempt } from "./review";

const attempt = (result: ReviewAttempt["result"], duration_ms: number): ReviewAttempt => ({
  result,
  duration_ms
});

const correct = (duration_ms = 1000) => attempt("correct", duration_ms);
const incorrect = (duration_ms = 1000) => attempt("incorrect", duration_ms);

describe("evaluateReviewSkill", () => {
  it("does not pass review with fewer than 4 attempts even at 100% accuracy", () => {
    const result = evaluateReviewSkill([correct(), correct(), correct()]);
    expect(result.sampleSize).toBe(3);
    expect(result.accuracy).toBe(1);
    expect(result.reviewPassed).toBe(false);
  });

  it("passes review at exactly 4 attempts with 100% accuracy", () => {
    const result = evaluateReviewSkill([correct(), correct(), correct(), correct()]);
    expect(result.sampleSize).toBe(4);
    expect(result.accuracy).toBe(1);
    expect(result.reviewPassed).toBe(true);
  });

  it("does not pass review at 4 attempts with 75% accuracy", () => {
    const result = evaluateReviewSkill([correct(), correct(), correct(), incorrect()]);
    expect(result.sampleSize).toBe(4);
    expect(result.accuracy).toBe(0.75);
    expect(result.reviewPassed).toBe(false);
  });

  it("passes review at 10 attempts with 90% accuracy (boundary)", () => {
    const attempts = [...Array(9)].map(() => correct());
    attempts.push(incorrect());
    const result = evaluateReviewSkill(attempts);
    expect(result.sampleSize).toBe(10);
    expect(result.accuracy).toBe(0.9);
    expect(result.reviewPassed).toBe(true);
  });

  it("computes automaticity as the share of attempts answered within 2000ms (inclusive)", () => {
    const result = evaluateReviewSkill([
      correct(1000),
      correct(2000),
      correct(2001),
      correct(5000)
    ]);
    // 1000ms and 2000ms are automatic; 2001ms and 5000ms are not.
    expect(result.automaticity).toBe(0.5);
  });

  it("records automaticity without gating review on it", () => {
    const allSlow = [correct(5000), correct(5000), correct(5000), correct(5000)];
    const result = evaluateReviewSkill(allSlow);
    expect(result.automaticity).toBe(0);
    expect(result.reviewPassed).toBe(true);
  });
});

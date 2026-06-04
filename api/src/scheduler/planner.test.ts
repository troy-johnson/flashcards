import { describe, expect, it } from "vitest";
import { buildPracticePlan } from "./planner";
import type { ReviewAttempt } from "./review";

const emptyState = { skillMastery: {}, itemMastery: {}, recentAttempts: {} };

const fourCorrect: ReviewAttempt[] = [
  { result: "correct", duration_ms: 1000 },
  { result: "correct", duration_ms: 1000 },
  { result: "correct", duration_ms: 1000 },
  { result: "correct", duration_ms: 1000 }
];

describe("buildPracticePlan", () => {
  it("starts a K student at the first K unit in sequence order", () => {
    const plan = buildPracticePlan({ grade: "K", ...emptyState });
    expect(plan.cards.map((c) => c.skill_id)).toEqual([
      "pa_k_u1_blend_two_sound",
      "phonics_k_u1_short_a",
      "heart_k_u1_batch_01",
      "fluency_k_u1_cvc_sentences"
    ]);
    for (const card of plan.cards) {
      expect(card.text).toBeTypeOf("string");
      expect(card.text.length).toBeGreaterThan(0);
    }
  });

  it("never exceeds the grade daily_plan size", () => {
    expect(buildPracticePlan({ grade: "K", ...emptyState }).cards.length).toBeLessThanOrEqual(16);
    expect(buildPracticePlan({ grade: "1", ...emptyState }).cards.length).toBeLessThanOrEqual(22);
  });

  it("gives a 1st-grade student K review cards until a skill is review-passed", () => {
    const all = buildPracticePlan({ grade: "1", ...emptyState });
    expect(all.cards.map((c) => c.skill_id)).toContain("pa_k_u1_blend_two_sound");

    const passed = buildPracticePlan({
      grade: "1",
      skillMastery: {},
      itemMastery: {},
      recentAttempts: { pa_k_u1_blend_two_sound: fourCorrect }
    });
    expect(passed.cards.map((c) => c.skill_id)).not.toContain("pa_k_u1_blend_two_sound");
    expect(passed.cards.length).toBe(all.cards.length - 1);
  });

  it("never fast-advances a K plan even when review-pass criteria are met", () => {
    const withReviewPassingAttempts = buildPracticePlan({
      grade: "K",
      skillMastery: {},
      itemMastery: {},
      recentAttempts: { pa_k_u1_blend_two_sound: fourCorrect }
    });
    const withoutAttempts = buildPracticePlan({ grade: "K", ...emptyState });

    // K branch must ignore review-pass attempts entirely — identical plans.
    expect(withReviewPassingAttempts).toEqual(withoutAttempts);
    expect(withReviewPassingAttempts.cards.map((c) => c.skill_id)).toContain(
      "pa_k_u1_blend_two_sound"
    );
  });
});

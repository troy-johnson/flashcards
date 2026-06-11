import { describe, expect, it } from "vitest";
import { buildPracticePlan, planTerminalReason } from "./planner";
import type { SchedulerContent, SchedulerItem } from "./content";
import type { ReviewAttempt } from "./review";

const emptyState = { skillMastery: {}, itemMastery: {}, recentAttempts: {} };

/** Builds synthetic content with `count` items under one K skill, to stress the daily-plan cap. */
const overCapContent = (count: number): SchedulerContent => {
  const items: SchedulerItem[] = Array.from({ length: count }, (_, i) => ({
    item_id: `it_${String(i).padStart(3, "0")}`,
    skill_id: "skill_a",
    text: `item ${i}`
  }));
  return {
    skills: [{ skill_id: "skill_a", grade: "K", prerequisites: [] }],
    units: [{ unit_id: "u1", grade: "K", skill_ids: ["skill_a"] }],
    itemsById: Object.fromEntries(items.map((it) => [it.item_id, it])),
    itemsBySkill: { skill_a: items },
    dailyPlanSizeByGrade: { K: 16, "1": 22 }
  };
};

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

  it("truncates a K plan to the daily_plan cap when eligible cards exceed it", () => {
    const content = overCapContent(40);
    const plan = buildPracticePlan({ grade: "K", ...emptyState }, content);
    expect(plan.cards.length).toBe(16);
    // Deterministic: the first 16 items in sequence order, in order.
    expect(plan.cards.map((c) => c.item_id)).toEqual(
      Array.from({ length: 16 }, (_, i) => `it_${String(i).padStart(3, "0")}`)
    );
  });

  it("truncates a 1st-grade plan to its (larger) daily_plan cap", () => {
    const plan = buildPracticePlan({ grade: "1", ...emptyState }, overCapContent(40));
    expect(plan.cards.length).toBe(22);
  });

  it("keeps the K no-fast-advance invariant under truncation", () => {
    const content = overCapContent(40);
    const withPassing = buildPracticePlan(
      { grade: "K", skillMastery: {}, itemMastery: {}, recentAttempts: { skill_a: fourCorrect } },
      content
    );
    const without = buildPracticePlan({ grade: "K", ...emptyState }, content);
    expect(withPassing).toEqual(without);
    expect(withPassing.cards.length).toBe(16);
  });

  it("returns an empty plan for an unsupported grade", () => {
    expect(buildPracticePlan({ grade: "Z", ...emptyState }).cards).toEqual([]);
  });

  it("returns an empty plan for a 1st grader who has review-passed every K skill", () => {
    // Phase A has no authored 1st-grade active content, so once all K review
    // skills pass, the review plan is empty. The pure planner returns no cards;
    // `planTerminalReason` (below) names why, and the start route surfaces it.
    const allPassed = {
      pa_k_u1_isolate_initial_sound: fourCorrect,
      pa_k_u1_blend_two_sound: fourCorrect,
      phonics_k_u1_consonants_mstp: fourCorrect,
      phonics_k_u1_short_a: fourCorrect,
      phonics_k_u1_cvc_blend_short_a: fourCorrect,
      heart_k_u1_batch_01: fourCorrect,
      fluency_k_u1_cvc_sentences: fourCorrect,
      pa_k_u2_segment_three_sound: fourCorrect,
      phonics_k_u2_consonants_ncdg: fourCorrect,
      phonics_k_u2_short_o: fourCorrect,
      phonics_k_u2_cvc_blend_short_o: fourCorrect
    };
    const plan = buildPracticePlan({ grade: "1", skillMastery: {}, itemMastery: {}, recentAttempts: allPassed });
    expect(plan.cards).toEqual([]);
  });
});

describe("planTerminalReason", () => {
  const allPassed = {
    pa_k_u1_isolate_initial_sound: fourCorrect,
    pa_k_u1_blend_two_sound: fourCorrect,
    phonics_k_u1_consonants_mstp: fourCorrect,
    phonics_k_u1_short_a: fourCorrect,
    phonics_k_u1_cvc_blend_short_a: fourCorrect,
    heart_k_u1_batch_01: fourCorrect,
    fluency_k_u1_cvc_sentences: fourCorrect,
    pa_k_u2_segment_three_sound: fourCorrect,
    phonics_k_u2_consonants_ncdg: fourCorrect,
    phonics_k_u2_short_o: fourCorrect,
    phonics_k_u2_cvc_blend_short_o: fourCorrect
  };

  it("reports review-complete when a 1st grader has review-passed every K skill", () => {
    expect(planTerminalReason({ grade: "1", skillMastery: {}, itemMastery: {}, recentAttempts: allPassed }))
      .toBe("review_complete_no_active_content");
  });

  it("returns null for a 1st grader with skills still to review", () => {
    expect(planTerminalReason({ grade: "1", ...emptyState })).toBeNull();
    const { fluency_k_u1_cvc_sentences, ...someStillOpen } = allPassed;
    void fluency_k_u1_cvc_sentences;
    expect(planTerminalReason({ grade: "1", skillMastery: {}, itemMastery: {}, recentAttempts: someStillOpen }))
      .toBeNull();
  });

  it("never reports terminal for K, even when review-pass criteria are met", () => {
    expect(planTerminalReason({ grade: "K", skillMastery: {}, itemMastery: {}, recentAttempts: allPassed })).toBeNull();
  });
});

import { describe, expect, it } from "vitest";
import { buildPracticePlan, planTerminalReason } from "./planner";
import { loadSchedulerContent, type SchedulerContent, type SchedulerItem } from "./content";
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

/** The 8 K skills that have authored items; the remaining skills are no-item scope plumbing. */
const itemBackedPassed: Record<string, ReviewAttempt[]> = {
  pa_k_u1_blend_two_sound: fourCorrect,
  phonics_k_u1_short_a: fourCorrect,
  phonics_k_u1_cvc_blend_short_a: fourCorrect,
  phonics_k_u2_consonants_ncdg: fourCorrect,
  phonics_k_u2_cvc_blend_short_o: fourCorrect,
  heart_k_u1_batch_01: fourCorrect,
  fluency_k_u1_cvc_sentences: fourCorrect,
  fluency_k_u2_cvc_sentences: fourCorrect
};

/** Every K skill review-passed (item-backed + no-item), keyed by skill_id. */
const allPassed: Record<string, ReviewAttempt[]> = {
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
  phonics_k_u2_cvc_blend_short_o: fourCorrect,
  fluency_k_u2_cvc_sentences: fourCorrect
};

describe("buildPracticePlan", () => {
  it("starts a K student at the first K unit in sequence order, capped at the daily plan", () => {
    const plan = buildPracticePlan({ grade: "K", ...emptyState });
    // Authored K U1-2 content exceeds the K daily-plan cap (16).
    expect(plan.cards.length).toBe(16);
    expect(plan.cards[0]?.skill_id).toBe("pa_k_u1_blend_two_sound");

    // Cards never run ahead of scope-sequence order (sequence-first selection).
    const order = loadSchedulerContent().units.flatMap((u) => u.skill_ids);
    const positions = plan.cards.map((c) => order.indexOf(c.skill_id));
    for (let i = 1; i < positions.length; i++) {
      expect(positions[i]).toBeGreaterThanOrEqual(positions[i - 1]!);
    }
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
    // Authored content exceeds the cap, so both plans fill to the 1st-grade cap (22);
    // filtering one skill just pulls a later card forward rather than shrinking the plan.
    expect(all.cards.length).toBe(22);
    expect(passed.cards.length).toBe(22);
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

  it("serves 1st-grade active content after a 1st grader has review-passed K skills", () => {
    const plan = buildPracticePlan({ grade: "1", skillMastery: {}, itemMastery: {}, recentAttempts: allPassed });

    expect(plan.cards.length).toBe(22);
    expect(plan.cards[0]?.skill_id).toBe("phonics_1_u1_short_i");
    expect(plan.cards.every((card) => card.skill_id.startsWith("phonics_1_u1_"))).toBe(true);
  });

  it("serves 1st-grade active content after all current item-backed K review skills pass", () => {
    expect(
      buildPracticePlan({ grade: "1", skillMastery: {}, itemMastery: {}, recentAttempts: itemBackedPassed }).cards[0]
        ?.skill_id
    ).toBe("phonics_1_u1_short_i");
  });
});

describe("planTerminalReason", () => {
  it("does not report terminal while 1st-grade active content remains after K review", () => {
    expect(planTerminalReason({ grade: "1", skillMastery: {}, itemMastery: {}, recentAttempts: allPassed })).toBeNull();
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

  it("does not report terminal after current item-backed K review skills pass when 1st-grade content remains", () => {
    expect(planTerminalReason({ grade: "1", skillMastery: {}, itemMastery: {}, recentAttempts: itemBackedPassed }))
      .toBeNull();
  });
});

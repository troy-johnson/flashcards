import { describe, expect, it } from "vitest";
import { buildPracticePlan, planTerminalReason, type MasteryState } from "./planner";
import { loadSchedulerContent, type SchedulerContent, type SchedulerItem } from "./content";
import type { ReviewAttempt } from "./review";

/** Fixed clock for deterministic selection (002i D2). */
const NOW = "2026-07-04T12:00:00.000Z";
const YESTERDAY = "2026-07-03T12:00:00.000Z";
const IN_FOUR_DAYS = "2026-07-08T12:00:00.000Z";

const emptyState = { skillMastery: {}, itemMastery: {}, recentAttempts: {}, now: NOW };

/** Builds synthetic content with `count` items under one K skill, to stress the daily-plan cap. */
const overCapContent = (count: number): SchedulerContent => {
  const items: SchedulerItem[] = Array.from({ length: count }, (_, i) => ({
    item_id: `it_${String(i).padStart(3, "0")}`,
    skill_id: "skill_a",
    text: `item ${i}`,
    kind: "phonics"
  }));
  return {
    skills: [{ skill_id: "skill_a", grade: "K", prerequisites: [] }],
    units: [{ unit_id: "u1", grade: "K", skill_ids: ["skill_a"] }],
    itemsById: Object.fromEntries(items.map((it) => [it.item_id, it])),
    itemsBySkill: { skill_a: items },
    dailyPlanSizeByGrade: { K: 16, "1": 22 }
  };
};

/** Two-skill synthetic content for interleaving assertions. */
const twoSkillContent = (): SchedulerContent => {
  const mk = (skill: string, i: number): SchedulerItem => ({
    item_id: `${skill}_it${i}`,
    skill_id: skill,
    text: `${skill} ${i}`,
    kind: "phonics"
  });
  const a = [mk("skill_a", 0), mk("skill_a", 1)];
  const b = [mk("skill_b", 0), mk("skill_b", 1)];
  return {
    skills: [
      { skill_id: "skill_a", grade: "K", prerequisites: [] },
      { skill_id: "skill_b", grade: "K", prerequisites: [] }
    ],
    units: [{ unit_id: "u1", grade: "K", skill_ids: ["skill_a", "skill_b"] }],
    itemsById: Object.fromEntries([...a, ...b].map((it) => [it.item_id, it])),
    itemsBySkill: { skill_a: a, skill_b: b },
    dailyPlanSizeByGrade: { K: 4, "1": 4 }
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

const mastered = (dueAt: string): MasteryState => ({
  level: 3,
  streak: 5,
  due_at: dueAt,
  last_seen_at: YESTERDAY
});

const missed = (dueAt: string = YESTERDAY): MasteryState => ({
  level: 0,
  streak: 0,
  due_at: dueAt,
  last_seen_at: YESTERDAY
});

describe("buildPracticePlan — selection layer (002i D2)", () => {
  it("starts a brand-new K student on the first scope-order items, capped at the daily plan", () => {
    const plan = buildPracticePlan({ grade: "K", ...emptyState });
    expect(plan.cards.length).toBe(16);
    // Greedy interleave preserves the first card.
    expect(plan.cards[0]?.skill_id).toBe("pa_k_u1_blend_two_sound");

    // With no mastery state everything is "new": the plan is exactly the first
    // 16 scope-order items as a SET (interleaving reorders within the plan).
    const order = loadSchedulerContent().units.flatMap((u) => u.skill_ids);
    const content = loadSchedulerContent();
    const scopeItems = order.flatMap((s) => content.itemsBySkill[s] ?? []).map((i) => i.item_id);
    expect([...plan.cards.map((c) => c.item_id)].sort()).toEqual(scopeItems.slice(0, 16).sort());

    for (const card of plan.cards) {
      expect(card.text).toBeTypeOf("string");
      expect(card.text.length).toBeGreaterThan(0);
    }
  });

  it("excludes a mastered item until its due_at, then brings it back via review", () => {
    const itemMastery = { pa_k_u1_blend_at: mastered(IN_FOUR_DAYS) };
    const today = buildPracticePlan({ grade: "K", ...emptyState, itemMastery });
    expect(today.cards.map((c) => c.item_id)).not.toContain("pa_k_u1_blend_at");

    const afterDue = buildPracticePlan({
      grade: "K",
      ...emptyState,
      itemMastery,
      now: "2026-07-09T12:00:00.000Z"
    });
    expect(afterDue.cards.map((c) => c.item_id)).toContain("pa_k_u1_blend_at");
  });

  it("resurfaces a missed item next session via the missed bucket", () => {
    // 40 competing new items under one skill; the missed item must still make the plan.
    const content = overCapContent(40);
    const plan = buildPracticePlan(
      { grade: "K", ...emptyState, itemMastery: { it_039: missed() } },
      content
    );
    expect(plan.cards.map((c) => c.item_id)).toContain("it_039");
  });

  it("resurfaces a missed MASTERED item via the missed bucket (streak 0 beats level >= 3)", () => {
    const content = overCapContent(40);
    const itemMastery: Record<string, MasteryState> = {};
    // Four healthy review items, due earlier than the target — they alone fill the review quota (4).
    for (let i = 0; i < 4; i++) {
      itemMastery[`it_${String(i).padStart(3, "0")}`] = {
        level: 3,
        streak: 5,
        due_at: `2026-07-0${1 + i}T00:00:00.000Z`,
        last_seen_at: YESTERDAY
      };
    }
    // A mastered item that was just missed: level 3 (demoted from 4), streak 0, due, LATEST due date.
    // If it were classified "review" it would sort 5th and be cut by the quota;
    // classified "missed" it must still make the plan.
    itemMastery["it_020"] = { level: 3, streak: 0, due_at: "2026-07-04T06:00:00.000Z", last_seen_at: YESTERDAY };

    const plan = buildPracticePlan({ grade: "K", ...emptyState, itemMastery }, content);
    expect(plan.cards.map((c) => c.item_id)).toContain("it_020");
  });

  it("reaches items beyond the first planSize once earlier items mature out", () => {
    const content = overCapContent(40);
    // First 16 items mastered and not due today: the NEXT 16 become the plan.
    const itemMastery = Object.fromEntries(
      Array.from({ length: 16 }, (_, i) => [`it_${String(i).padStart(3, "0")}`, mastered(IN_FOUR_DAYS)])
    );
    const plan = buildPracticePlan({ grade: "K", ...emptyState, itemMastery }, content);
    expect(plan.cards.map((c) => c.item_id)).toEqual(
      Array.from({ length: 16 }, (_, i) => `it_${String(i + 16).padStart(3, "0")}`)
    );
  });

  it("fills bucket quotas 10/4/2 at K=16 (floor + largest remainder) with due-date priority", () => {
    const content = overCapContent(40);
    const itemMastery: Record<string, MasteryState> = {};
    // 6 review-eligible items, ALL due (distinct past due dates) — only the 4
    // earliest-due fit the quota, so this genuinely exercises the review cap.
    for (let i = 0; i < 6; i++) {
      itemMastery[`it_${String(i).padStart(3, "0")}`] = {
        level: 3,
        streak: 5,
        due_at: `2026-06-2${i}T00:00:00.000Z`,
        last_seen_at: YESTERDAY
      };
    }
    // 3 missed-eligible items — only the 2 earliest-due fit.
    for (let i = 6; i < 9; i++) {
      itemMastery[`it_${String(i).padStart(3, "0")}`] = {
        level: 1,
        streak: 0,
        due_at: `2026-07-0${i - 5}T00:00:00.000Z`,
        last_seen_at: YESTERDAY
      };
    }
    const plan = buildPracticePlan({ grade: "K", ...emptyState, itemMastery }, content);
    const ids = plan.cards.map((c) => c.item_id);
    expect(ids.length).toBe(16);
    // review: earliest 4 of the 6 due
    expect(ids).toEqual(expect.arrayContaining(["it_000", "it_001", "it_002", "it_003"]));
    expect(ids).not.toContain("it_004");
    expect(ids).not.toContain("it_005");
    // missed: earliest 2 of the 3 due
    expect(ids).toEqual(expect.arrayContaining(["it_006", "it_007"]));
    expect(ids).not.toContain("it_008");
    // active: first 10 new items in scope order
    expect(ids.filter((id) => Number(id.slice(3)) >= 9).length).toBe(10);
  });

  it("spills unfilled review/missed slots to active items", () => {
    const content = overCapContent(40);
    // No mastery rows at all: review + missed buckets are empty; all 16 slots go active.
    const plan = buildPracticePlan({ grade: "K", ...emptyState }, content);
    expect(plan.cards.length).toBe(16);
    expect(plan.cards.map((c) => c.item_id)).toEqual(
      Array.from({ length: 16 }, (_, i) => `it_${String(i).padStart(3, "0")}`)
    );
  });

  it("interleaves so no two consecutive cards share a skill when avoidable", () => {
    const plan = buildPracticePlan({ grade: "K", ...emptyState }, twoSkillContent());
    expect(plan.cards.map((c) => c.skill_id)).toEqual(["skill_a", "skill_b", "skill_a", "skill_b"]);
  });

  it("is deterministic for a fixed (content, mastery, now) input", () => {
    const input = {
      grade: "K",
      ...emptyState,
      itemMastery: { pa_k_u1_blend_at: missed(), heart_k_u1_the: mastered(YESTERDAY) }
    };
    expect(buildPracticePlan(input)).toEqual(buildPracticePlan(input));
  });

  it("carries kind, answer, and heart parts on plan cards (002i D3)", () => {
    const plan = buildPracticePlan({ grade: "K", ...emptyState });
    const pa = plan.cards.find((c) => c.item_id === "pa_k_u1_blend_at");
    expect(pa?.kind).toBe("pa");
    expect(pa?.answer).toBe("at");

    const heart = plan.cards.find((c) => c.kind === "heart");
    expect(heart).toBeDefined();
    expect(heart?.regular_parts?.length).toBeGreaterThan(0);
    expect(heart?.irregular_parts?.length).toBeGreaterThan(0);

    for (const card of plan.cards) {
      expect(["pa", "phonics", "heart", "fluency"]).toContain(card.kind);
    }
  });

  it("carries authored caregiver and child instructions only on their canonical PA card", () => {
    const plan = buildPracticePlan({ grade: "K", ...emptyState });
    const pa = plan.cards.find((c) => c.item_id === "pa_k_u1_blend_at");
    expect(pa?.guardian_script).toBe(
      "Say, ‘/a/ /t/.’ Stretch /a/ slightly, then say /t/ right after it."
    );
    expect(pa?.student_task).toBe(
      "Your child puts the sounds together and says the word."
    );

    const unrelated = plan.cards.find((c) => c.item_id === "phonics_k_u1_short_a_mat");
    expect(unrelated).toBeDefined();
    expect(unrelated && "guardian_script" in unrelated).toBe(false);
    expect(unrelated && "student_task" in unrelated).toBe(false);
  });

  it("propagates item speech_text onto plan cards, omitting it when absent (003a Task 5)", () => {
    const mk = (id: string, speech?: string): SchedulerItem => ({
      item_id: id,
      skill_id: "phonics_test",
      text: id === "phonics_test_read" ? "read" : "mat",
      kind: "phonics",
      ...(speech ? { speech_text: speech } : {})
    });
    const items = [mk("phonics_test_read", "reed"), mk("phonics_test_mat")];
    const content: SchedulerContent = {
      skills: [{ skill_id: "phonics_test", grade: "K", prerequisites: [] }],
      units: [{ unit_id: "k_u1", grade: "K", skill_ids: ["phonics_test"] }],
      itemsById: Object.fromEntries(items.map((it) => [it.item_id, it])),
      itemsBySkill: { phonics_test: items },
      dailyPlanSizeByGrade: { K: 16, "1": 22 }
    };
    const plan = buildPracticePlan({ grade: "K", ...emptyState }, content);
    const read = plan.cards.find((c) => c.item_id === "phonics_test_read");
    const mat = plan.cards.find((c) => c.item_id === "phonics_test_mat");
    expect(read?.speech_text).toBe("reed");
    expect(mat).toBeDefined();
    expect(mat && "speech_text" in mat).toBe(false);
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
      recentAttempts: { pa_k_u1_blend_two_sound: fourCorrect },
      now: NOW
    });
    expect(passed.cards.map((c) => c.skill_id)).not.toContain("pa_k_u1_blend_two_sound");
    // Authored content exceeds the cap, so both plans fill to the 1st-grade cap (22);
    // filtering one skill just pulls a later card forward rather than shrinking the plan.
    expect(all.cards.length).toBe(22);
    expect(passed.cards.length).toBe(22);
  });

  it("grade-1 fast-advance beats missed resurfacing: a review-passed skill drops even with a missed-due item (spec 002 D6)", () => {
    // Deliberate precedence (owner decision 2026-07-04, codex review finding 1):
    // once a 1st grader proves a K skill at >=90%, the whole skill leaves the
    // ramp — a single fresh miss inside it does not pull the skill back.
    const plan = buildPracticePlan({
      grade: "1",
      skillMastery: {},
      itemMastery: { pa_k_u1_blend_at: missed() },
      recentAttempts: { pa_k_u1_blend_two_sound: fourCorrect },
      now: NOW
    });
    expect(plan.cards.map((c) => c.item_id)).not.toContain("pa_k_u1_blend_at");
  });

  it("never fast-advances a K plan even when review-pass criteria are met", () => {
    const withReviewPassingAttempts = buildPracticePlan({
      grade: "K",
      skillMastery: {},
      itemMastery: {},
      recentAttempts: { pa_k_u1_blend_two_sound: fourCorrect },
      now: NOW
    });
    const withoutAttempts = buildPracticePlan({ grade: "K", ...emptyState });

    // K branch must ignore review-pass attempts entirely — identical plans.
    expect(withReviewPassingAttempts).toEqual(withoutAttempts);
    expect(withReviewPassingAttempts.cards.map((c) => c.skill_id)).toContain(
      "pa_k_u1_blend_two_sound"
    );
  });

  it("truncates a 1st-grade plan to its (larger) daily_plan cap", () => {
    const plan = buildPracticePlan({ grade: "1", ...emptyState }, overCapContent(40));
    expect(plan.cards.length).toBe(22);
  });

  it("keeps the K no-fast-advance invariant under truncation", () => {
    const content = overCapContent(40);
    const withPassing = buildPracticePlan(
      {
        grade: "K",
        skillMastery: {},
        itemMastery: {},
        recentAttempts: { skill_a: fourCorrect },
        now: NOW
      },
      content
    );
    const without = buildPracticePlan({ grade: "K", ...emptyState }, content);
    expect(withPassing).toEqual(without);
    expect(withPassing.cards.length).toBe(16);
  });

  it("returns an empty plan for an unsupported grade", () => {
    expect(buildPracticePlan({ grade: "Z", ...emptyState }).cards).toEqual([]);
  });

  it("returns an empty (non-terminal) plan when nothing is due and nothing is new", () => {
    const content = overCapContent(3);
    const itemMastery = Object.fromEntries(
      ["it_000", "it_001", "it_002"].map((id) => [id, mastered(IN_FOUR_DAYS)])
    );
    const plan = buildPracticePlan({ grade: "K", ...emptyState, itemMastery }, content);
    expect(plan.cards).toEqual([]);
    // "All caught up today" UI is rw-1gz.5's concern; the planner just reports no cards.
    expect(planTerminalReason({ grade: "K", ...emptyState, itemMastery }, content)).toBeNull();
  });

  it("serves 1st-grade active content after a 1st grader has review-passed K skills", () => {
    const plan = buildPracticePlan({
      grade: "1",
      skillMastery: {},
      itemMastery: {},
      recentAttempts: allPassed,
      now: NOW
    });

    expect(plan.cards.length).toBe(22);
    expect(plan.cards[0]?.skill_id).toBe("phonics_1_u1_alphabet_review");
    expect(plan.cards.every((card) => card.skill_id.startsWith("phonics_1_u1_"))).toBe(true);
  });

  it("serves 1st-grade active content after all current item-backed K review skills pass", () => {
    expect(
      buildPracticePlan({
        grade: "1",
        skillMastery: {},
        itemMastery: {},
        recentAttempts: itemBackedPassed,
        now: NOW
      }).cards[0]?.skill_id
    ).toBe("phonics_1_u1_alphabet_review");
  });
});

describe("planTerminalReason", () => {
  it("does not report terminal while 1st-grade active content remains after K review", () => {
    expect(
      planTerminalReason({ grade: "1", skillMastery: {}, itemMastery: {}, recentAttempts: allPassed, now: NOW })
    ).toBeNull();
  });

  it("returns null for a 1st grader with skills still to review", () => {
    expect(planTerminalReason({ grade: "1", ...emptyState })).toBeNull();
    const { fluency_k_u1_cvc_sentences, ...someStillOpen } = allPassed;
    void fluency_k_u1_cvc_sentences;
    expect(
      planTerminalReason({ grade: "1", skillMastery: {}, itemMastery: {}, recentAttempts: someStillOpen, now: NOW })
    ).toBeNull();
  });

  it("never reports terminal for K, even when review-pass criteria are met", () => {
    expect(
      planTerminalReason({ grade: "K", skillMastery: {}, itemMastery: {}, recentAttempts: allPassed, now: NOW })
    ).toBeNull();
  });

  it("does not report terminal after current item-backed K review skills pass when 1st-grade content remains", () => {
    expect(
      planTerminalReason({
        grade: "1",
        skillMastery: {},
        itemMastery: {},
        recentAttempts: itemBackedPassed,
        now: NOW
      })
    ).toBeNull();
  });
});

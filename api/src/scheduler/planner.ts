import { loadSchedulerContent, type SchedulerContent } from "./content";
import { evaluateReviewSkill, type ReviewAttempt } from "./review";

/** Per-skill / per-item mastery state, defaulting to the schema baseline when absent. */
export type MasteryState = {
  level: number;
  streak: number;
};

export type PlannerInput = {
  grade: string;
  /** Mastery rows keyed by skill_id. Reserved for future ordering; not used by Phase A sequence-first selection. */
  skillMastery: Record<string, MasteryState>;
  /** Mastery rows keyed by item_id. Reserved for future ordering; not used by Phase A sequence-first selection. */
  itemMastery: Record<string, MasteryState>;
  /** Recent scored attempts keyed by skill_id, used only on the grade==="1" review fast-advance path. */
  recentAttempts: Record<string, ReviewAttempt[]>;
};

export type PlanCard = {
  skill_id: string;
  item_id: string;
  text: string;
};

export type PracticePlan = {
  cards: PlanCard[];
};

/**
 * Builds a deterministic, sequence-first practice plan.
 *
 * Phase A content is K-only, so both the K and 1st-grade branches source cards
 * from the K skills in scope-sequence order. The `mix` ratios in
 * scheduler-config are intentionally not consulted yet (deterministic selection
 * keeps tests stable until authored 1st-grade content exists).
 *
 * Grade gating: the `evaluateReviewSkill` review-pass fast-advance path is
 * reachable **only** when `grade === "1"`. The K branch advances through normal
 * mastery state and must never consult the review heuristic — so a K plan is
 * identical whether or not review-passing attempts are present.
 */
export function buildPracticePlan(
  input: PlannerInput,
  content: SchedulerContent = loadSchedulerContent()
): PracticePlan {
  const planSize = content.dailyPlanSizeByGrade[input.grade] ?? 0;

  // Skills in scope-sequence order (units in file order, skill_ids in unit order).
  const orderedSkillIds = content.units.flatMap((unit) => unit.skill_ids);

  const selectedSkillIds =
    input.grade === "1"
      ? orderedSkillIds.filter(
          (skillId) => !evaluateReviewSkill(input.recentAttempts[skillId] ?? []).reviewPassed
        )
      : orderedSkillIds;

  const cards: PlanCard[] = [];
  for (const skillId of selectedSkillIds) {
    for (const item of content.itemsBySkill[skillId] ?? []) {
      cards.push({ skill_id: item.skill_id, item_id: item.item_id, text: item.text });
    }
  }

  return { cards: cards.slice(0, planSize) };
}

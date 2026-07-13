import { loadSchedulerContent, type CardKind, type SchedulerContent, type SchedulerItem } from "./content";
import { evaluateReviewSkill, type ReviewAttempt } from "./review";

/**
 * Per-skill / per-item mastery state, defaulting to the schema baseline when absent.
 * `due_at` / `last_seen_at` are ISO strings from the mastery tables; older callers
 * (and skill rows, which selection doesn't consult) may omit them.
 */
export type MasteryState = {
  level: number;
  streak: number;
  due_at?: string | null;
  last_seen_at?: string | null;
};

export type PlannerInput = {
  grade: string;
  /** Mastery rows keyed by skill_id. Not consulted by item selection (skill manager is rw-5kd). */
  skillMastery: Record<string, MasteryState>;
  /** Mastery rows keyed by item_id. Drives bucket selection (002i D2). */
  itemMastery: Record<string, MasteryState>;
  /** Recent scored attempts keyed by skill_id, used only on the grade==="1" review fast-advance path. */
  recentAttempts: Record<string, ReviewAttempt[]>;
  /** ISO timestamp for "today" — injected so plans are a pure function of (content, mastery, now). */
  now: string;
};

export type PlanCard = {
  skill_id: string;
  item_id: string;
  text: string;
  kind: CardKind;
  /** PA: expected blended/segmented answer, surfaced to the guardian. */
  answer?: string;
  /** PA: exact adult-facing instruction authored in content. */
  guardian_script?: string;
  /** PA: exact child-facing task authored in content. */
  student_task?: string;
  /** Heart words: decodable parts. */
  regular_parts?: string[];
  /** Heart words: parts that must be remembered ("the heart"). */
  irregular_parts?: string[];
  /** TTS pronunciation override — spoken form when it differs from `text` (003a). */
  speech_text?: string;
};

export type PracticePlan = {
  cards: PlanCard[];
};

/** Selection buckets per spec 001 §6 daily-plan composition. */
type Bucket = "active" | "review" | "missed";

/** Mix ratios from spec 001 §6; mirrored in content/scheduler-config.json. */
const MIX: Record<Bucket, number> = { active: 0.6, review: 0.25, missed: 0.15 };

/** Spill order when a bucket can't fill its quota (002i D2). */
const SPILL_ORDER: Bucket[] = ["active", "review", "missed"];

type Candidate = {
  item: SchedulerItem;
  mastery: MasteryState | undefined;
  /** Position in flattened scope-sequence order — the final deterministic tiebreak. */
  scopeIndex: number;
};

/** An item is due when never seen, or when its due_at is unset or has arrived. */
const isDue = (m: MasteryState | undefined, now: string): boolean =>
  !m || m.due_at == null || m.due_at <= now;

/**
 * Classifies a candidate into its (disjoint) bucket, or null when it is not
 * schedulable today (seen recently and not yet due).
 */
function bucketOf(c: Candidate, now: string): Bucket | null {
  const m = c.mastery;
  if (!m) return "active"; // never seen
  if (!isDue(m, now)) return null;
  // Missed wins over review: a mastered item that was just missed (incorrect
  // demotes 4→3 with streak 0) must resurface via the missed bucket, not wait
  // out a review interval (spec 001 §6: a miss surfaces tomorrow at any level).
  if (m.streak === 0 && m.last_seen_at != null) return "missed";
  if (m.level >= 3) return "review";
  return "active";
}

/** due_at asc → level asc → last_seen_at asc → scope order; new items sort after seen ones. */
function compareCandidates(a: Candidate, b: Candidate): number {
  if (!a.mastery !== !b.mastery) return a.mastery ? -1 : 1; // seen-and-due before new
  if (a.mastery && b.mastery) {
    const dueCmp = (a.mastery.due_at ?? "").localeCompare(b.mastery.due_at ?? "");
    if (dueCmp !== 0) return dueCmp;
    if (a.mastery.level !== b.mastery.level) return a.mastery.level - b.mastery.level;
    const seenCmp = (a.mastery.last_seen_at ?? "").localeCompare(b.mastery.last_seen_at ?? "");
    if (seenCmp !== 0) return seenCmp;
  }
  return a.scopeIndex - b.scopeIndex;
}

/** planSize * mix per bucket: floor, then hand out remainder by largest fractional part. */
function bucketQuotas(planSize: number): Record<Bucket, number> {
  const raw = (Object.keys(MIX) as Bucket[]).map((bucket) => ({
    bucket,
    exact: planSize * MIX[bucket]
  }));
  const quotas = Object.fromEntries(raw.map((r) => [r.bucket, Math.floor(r.exact)])) as Record<Bucket, number>;
  let remaining = planSize - raw.reduce((sum, r) => sum + Math.floor(r.exact), 0);
  const byFraction = [...raw].sort(
    (a, b) =>
      b.exact - Math.floor(b.exact) - (a.exact - Math.floor(a.exact)) ||
      SPILL_ORDER.indexOf(a.bucket) - SPILL_ORDER.indexOf(b.bucket)
  );
  for (const r of byFraction) {
    if (remaining <= 0) break;
    quotas[r.bucket] += 1;
    remaining -= 1;
  }
  return quotas;
}

/**
 * Greedy interleave (spec 001 §6): repeatedly emit the first remaining card whose
 * skill differs from the previously emitted one; if none differs, emit the first.
 */
function interleave(cards: PlanCard[]): PlanCard[] {
  const pool = [...cards];
  const out: PlanCard[] = [];
  while (pool.length > 0) {
    const prev = out[out.length - 1];
    const idx = prev ? pool.findIndex((c) => c.skill_id !== prev.skill_id) : 0;
    out.push(...pool.splice(idx === -1 ? 0 : idx, 1));
  }
  return out;
}

const toCard = (item: SchedulerItem): PlanCard => ({
  skill_id: item.skill_id,
  item_id: item.item_id,
  text: item.text,
  kind: item.kind,
  ...(item.answer !== undefined && { answer: item.answer }),
  ...(item.guardian_script !== undefined && { guardian_script: item.guardian_script }),
  ...(item.student_task !== undefined && { student_task: item.student_task }),
  ...(item.regular_parts !== undefined && { regular_parts: item.regular_parts }),
  ...(item.irregular_parts !== undefined && { irregular_parts: item.irregular_parts }),
  ...(item.speech_text !== undefined && { speech_text: item.speech_text })
});

/**
 * Builds a deterministic, mastery-driven practice plan (002i, spec 001 §6 selection layer).
 *
 * Selection consumes the 002c bookkeeping (`due_at`/`level`/`streak` on item
 * mastery) via three disjoint buckets — active (new + practicing-due), review
 * (mastered-due), missed (streak-0-due) — with quotas from the 60/25/15 mix,
 * due-date priority inside each bucket, and a greedy interleave so consecutive
 * cards avoid sharing a skill where possible. Items seen recently but not yet
 * due are excluded, which is what rotates mastered items out and makes items
 * beyond the first planSize reachable. The plan is a pure function of
 * (content, mastery, now); mastery TRANSITIONS are unchanged (full SM-2 is rw-5kd).
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
  // Restrict to practiceable skills only — those with at least one item — so that
  // no-item skills (scope declared ahead of content authoring) never produce empty
  // card slots or block terminal-reason detection.
  const practiceable = content.units
    .flatMap((unit) => unit.skill_ids)
    .filter((id) => id in content.itemsBySkill);

  // Grade-1 fast-advance runs BEFORE bucketing and wins over item resurfacing:
  // a review-passed K skill drops entirely, even if it contains a missed-due
  // item (spec 002 D6 — "advances quickly"; owner-confirmed 2026-07-04).
  const selectedSkillIds =
    input.grade === "1"
      ? practiceable.filter(
          (skillId) => !evaluateReviewSkill(input.recentAttempts[skillId] ?? []).reviewPassed
        )
      : practiceable;

  // Classify every eligible item into its bucket (or drop it as not-due).
  const buckets: Record<Bucket, Candidate[]> = { active: [], review: [], missed: [] };
  let scopeIndex = 0;
  for (const skillId of selectedSkillIds) {
    for (const item of content.itemsBySkill[skillId] ?? []) {
      const candidate: Candidate = { item, mastery: input.itemMastery[item.item_id], scopeIndex };
      scopeIndex += 1;
      const bucket = bucketOf(candidate, input.now);
      if (bucket) buckets[bucket].push(candidate);
    }
  }
  for (const bucket of SPILL_ORDER) buckets[bucket].sort(compareCandidates);

  // Fill quotas, then spill unused slots in SPILL_ORDER so the plan stays full
  // whenever enough due/new items exist.
  const quotas = bucketQuotas(planSize);
  const taken: Record<Bucket, PlanCard[]> = { active: [], review: [], missed: [] };
  for (const bucket of SPILL_ORDER) {
    taken[bucket] = buckets[bucket].splice(0, quotas[bucket]).map((c) => toCard(c.item));
  }
  let open = planSize - SPILL_ORDER.reduce((sum, b) => sum + taken[b].length, 0);
  for (const bucket of SPILL_ORDER) {
    if (open <= 0) break;
    const extra = buckets[bucket].splice(0, open).map((c) => toCard(c.item));
    taken[bucket].push(...extra);
    open -= extra.length;
  }

  return { cards: interleave([...taken.active, ...taken.review, ...taken.missed]) };
}

/** A distinguishable end-state for a start plan that has no cards by design. */
export type PlanTerminalReason = "review_complete_no_active_content";

/**
 * Reports why a start plan is terminal (legitimately empty), or null when there
 * is still work to schedule.
 *
 * Phase A has exactly one terminal state: a 1st-grade student runs the K-review
 * path, and once every K review skill is review-passed there is no authored
 * 1st-grade active content to schedule (content is K-only — see the plan's
 * content-state note). K never terminates; it advances through normal mastery.
 * An empty plan because nothing is due today is NOT terminal — surfacing that
 * "all caught up" state is rw-1gz.5.
 */
export function planTerminalReason(
  input: PlannerInput,
  content: SchedulerContent = loadSchedulerContent()
): PlanTerminalReason | null {
  if (input.grade !== "1") return null;
  const practiceable = content.units
    .flatMap((unit) => unit.skill_ids)
    .filter((id) => id in content.itemsBySkill);
  const allReviewPassed =
    practiceable.length > 0 &&
    practiceable.every((skillId) => evaluateReviewSkill(input.recentAttempts[skillId] ?? []).reviewPassed);
  return allReviewPassed ? "review_complete_no_active_content" : null;
}

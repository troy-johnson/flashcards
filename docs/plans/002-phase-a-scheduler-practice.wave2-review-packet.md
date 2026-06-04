# Adversarial Review Packet — Phase A Scheduler/Practice, Wave 2

**Purpose:** Hand this to an independent reviewer model. It is self-contained — you do not need repo access to review. Your job is adversarial: find correctness bugs, spec violations, and unjustified design risks in the Wave 2 implementation (the learning-progression core). The plan mandates adversarial review of this wave specifically.

**Disposition required:** `APPROVE` / `APPROVE WITH NITS` / `BLOCK`, with each finding tagged `[BLOCK]` / `[IMPORTANT]` / `[NIT]` and tied to a concrete line or behavior.

---

## 1. Context

- **Project:** "Reader's Way" Phase A micro-pilot — a literacy flashcard practice app. Backend is a Cloudflare Workers API (Hono + Zod) over Cloudflare D1 (SQLite). Content is **K-only** for Phase A (one K unit, 4 skills, 4 items).
- **Scoring model:** all attempts are `guardian_tap` (a guardian taps correct/incorrect/skipped). No mic/auto scoring in Phase A.
- **This wave (Wave 2):** the planner that builds a daily practice plan, plus the mastery state machine that updates on each scored attempt. Wave 1 (content loader + review-rule helper) is already merged and is a dependency.
- **Branch:** `plan/002c-scheduler-practice`. Wave 2 commits: `befb2c0` (RED planner test) → `f71562c` (GREEN planner) → `9178d79` (RED mastery test) → `5238780` (GREEN mastery upsert).
- **Test status at submission:** full api suite green (32 tests), `tsc --noEmit` clean.

---

## 2. Relevant acceptance criteria & plan rules

From `docs/plans/002-phase-a-scheduler-practice.md`, Tasks 5–8:

**Planner (Tasks 5–6):**
- `buildPracticePlan({ grade, skillMastery, itemMastery, recentAttempts })` returns `{ cards }`, each card `{ skill_id, item_id, text }`, **never exceeding the grade's `daily_plan` count** (K=16, 1=22).
- **K no-fast-advance invariant (hard rule):** the `evaluateReviewSkill` review-pass fast-advance path is reachable **only** when `grade === "1"`. A K plan must be **identical** whether or not review-passing attempts are present. The K branch must never consult the review heuristic.
- Because content is K-only, the `grade === "1"` branch sources cards from the **same K skills** as review content; it does not invent 1st-grade active content.
- `mix` ratios in `scheduler-config.json` are intentionally **not** used yet; Phase A uses **deterministic sequence-first** selection so tests stay stable.

**Mastery upsert (Tasks 7–8):**
- A valid attempt updates **both** `skill_mastery` (keyed `student_id, skill_id`) and `item_mastery` (keyed `student_id, item_id`) with the **same** rules. A missing row defaults to `level=0, streak=0, ease=2.5, due_at=NULL, last_seen_at=NULL`.
- `scored_at` = a single `new Date().toISOString()` reused everywhere in the handler so all timestamps match. `last_seen_at = scored_at` for every result.
- `interval_days(level) = {0:0, 1:1, 2:2, 3:4, 4:7}`; `due_at = scored_at + interval_days(new_level)` days (UTC).
- `ease` is **left untouched** in Phase A (reserved for later tuning; not a bug).

| result | new `streak` | new `level` | `due_at` basis |
| --- | --- | --- | --- |
| `correct` | `prev_streak + 1` | `min(4, prev_level + 1)` | `scored_at + interval_days(new_level)` |
| `incorrect` | `0` | `max(0, prev_level - 1)` | `scored_at + interval_days(new_level)` |
| `skipped` | `0` | `prev_level` (unchanged) | `scored_at + interval_days(new_level)` |

- **Atomicity decision (explicit):** read both mastery rows, compute new values in TS, then write the attempt INSERT **plus** both upserts in a **single `c.env.DB.batch([...])`** (D1 executes a batch as one implicit transaction — all or nothing). Upserts use `INSERT ... ON CONFLICT(...) DO UPDATE SET ...` with JS-computed literal values bound (no `min`/`max`/`CASE` in SQL). The read-then-batch is **not** wrapped in a row lock; justified because D1 is single-writer and one student's guardian-tap attempts are issued strictly serially. Revisit if concurrent multi-device practice for one student becomes possible.
- Forged-plan attempt (skill/item not in `plan_json`) → 400, **no** attempt row, **no** mastery row.
- Completed session → 409, writes nothing.

---

## 3. Dependencies (Wave 1, already merged — provided for reference)

The planner imports these. Treat as trusted but flag if Wave 2 misuses them.

**`api/src/scheduler/content.ts`** — `loadSchedulerContent()` returns `{ skills, units, itemsById, itemsBySkill, dailyPlanSizeByGrade }`. Each item's `text` is normalized as `text ?? prompt ?? item_id` (never undefined). `units` come from `scope-sequence.json` (one K unit `k_u1_seed` with `skill_ids` in order: `pa_k_u1_blend_two_sound`, `phonics_k_u1_short_a`, `heart_k_u1_batch_01`, `fluency_k_u1_cvc_sentences`). `itemsBySkill` groups items in seed-file order; each of the 4 skills has exactly 1 item. `dailyPlanSizeByGrade` = `{ K: 16, "1": 22 }`.

**`api/src/scheduler/review.ts`** — `evaluateReviewSkill(attempts)` returns `{ sampleSize, accuracy, automaticity, reviewPassed }`. `reviewPassed = sampleSize >= 4 && accuracy >= 0.9`. `accuracy = correct/sampleSize`. `automaticity = (count duration_ms <= 2000)/sampleSize`, recorded, never gates. Type `ReviewAttempt = { result: "correct"|"incorrect"|"skipped"; duration_ms: number }`.

---

## 4. Code under review

### 4a. `api/src/scheduler/planner.ts` (new)

```ts
import { loadSchedulerContent } from "./content";
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

export function buildPracticePlan(input: PlannerInput): PracticePlan {
  const content = loadSchedulerContent();
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
```

### 4b. `api/src/scheduler/planner.test.ts` (new)

```ts
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

    expect(withReviewPassingAttempts).toEqual(withoutAttempts);
    expect(withReviewPassingAttempts.cards.map((c) => c.skill_id)).toContain(
      "pa_k_u1_blend_two_sound"
    );
  });
});
```

### 4c. `api/src/routes/practice.ts` — handler diff (the highest-risk change)

Module-level additions:

```ts
// Spaced-repetition interval per mastery level (days). `ease` is reserved for a
// later tuning pass and intentionally left untouched in Phase A.
const INTERVAL_DAYS: Record<number, number> = { 0: 0, 1: 1, 2: 2, 3: 4, 4: 7 };

type MasteryDelta = { level: number; streak: number; dueAt: string };

const nextMastery = (
  prev: { level: number; streak: number } | null,
  result: "correct" | "incorrect" | "skipped",
  scoredAt: string
): MasteryDelta => {
  const prevLevel = prev?.level ?? 0;
  const prevStreak = prev?.streak ?? 0;
  let level: number;
  let streak: number;
  switch (result) {
    case "correct":
      level = Math.min(4, prevLevel + 1);
      streak = prevStreak + 1;
      break;
    case "incorrect":
      level = Math.max(0, prevLevel - 1);
      streak = 0;
      break;
    case "skipped":
      level = prevLevel;
      streak = 0;
      break;
  }
  const dueAt = new Date(Date.parse(scoredAt) + (INTERVAL_DAYS[level] ?? 0) * 86_400_000).toISOString();
  return { level, streak, dueAt };
};
```

Inside `POST /:studentId/attempt`, **after** ownership check, Zod validation, session-exists (404), completed-session (409), and forged-plan (400) guards — replacing the prior single attempt INSERT:

```ts
  const id = ulid();
  const scoredAt = new Date().toISOString();

  // Read current mastery, compute new values in TS, then write the attempt and
  // both upserts in a single D1 batch (one implicit transaction).
  const skillPrev = await c.env.DB.prepare("SELECT level, streak FROM skill_mastery WHERE student_id = ? AND skill_id = ?")
    .bind(studentId, parsed.data.skill_id).first<{ level: number; streak: number }>();
  const itemPrev = await c.env.DB.prepare("SELECT level, streak FROM item_mastery WHERE student_id = ? AND item_id = ?")
    .bind(studentId, parsed.data.item_id).first<{ level: number; streak: number }>();
  const skillNext = nextMastery(skillPrev, parsed.data.result, scoredAt);
  const itemNext = nextMastery(itemPrev, parsed.data.result, scoredAt);

  await c.env.DB.batch([
    c.env.DB.prepare(
      `INSERT INTO attempt (id, practice_session_id, student_id, skill_id, item_id, result, scoring_source, duration_ms, shown_at, scored_at)
       VALUES (?, ?, ?, ?, ?, ?, 'guardian_tap', ?, ?, ?)`
    ).bind(
      id, parsed.data.practice_session_id, studentId, parsed.data.skill_id, parsed.data.item_id,
      parsed.data.result, parsed.data.duration_ms, parsed.data.shown_at, scoredAt
    ),
    c.env.DB.prepare(
      `INSERT INTO skill_mastery (student_id, skill_id, level, streak, due_at, last_seen_at)
       VALUES (?, ?, ?, ?, ?, ?)
       ON CONFLICT(student_id, skill_id) DO UPDATE SET level = ?, streak = ?, due_at = ?, last_seen_at = ?`
    ).bind(
      studentId, parsed.data.skill_id, skillNext.level, skillNext.streak, skillNext.dueAt, scoredAt,
      skillNext.level, skillNext.streak, skillNext.dueAt, scoredAt
    ),
    c.env.DB.prepare(
      `INSERT INTO item_mastery (student_id, item_id, skill_id, level, streak, due_at, last_seen_at)
       VALUES (?, ?, ?, ?, ?, ?, ?)
       ON CONFLICT(student_id, item_id) DO UPDATE SET level = ?, streak = ?, due_at = ?, last_seen_at = ?`
    ).bind(
      studentId, parsed.data.item_id, parsed.data.skill_id, itemNext.level, itemNext.streak, itemNext.dueAt, scoredAt,
      itemNext.level, itemNext.streak, itemNext.dueAt, scoredAt
    )
  ]);
  return json({ attempt: { id, scoring_source: "guardian_tap" } }, { status: 201 });
```

For reference, the guards that run **before** the code above (unchanged in Wave 2):

```ts
  const parsed = attemptSchema.safeParse(body);        // 400 "invalid attempt"
  if (!parsed.success) return c.text("invalid attempt", 400);
  const session = await c.env.DB.prepare("SELECT id, plan_json, completed_at FROM practice_session WHERE id = ? AND student_id = ?")
    .bind(parsed.data.practice_session_id, studentId).first<...>();
  if (!session) return c.text("practice session not found", 404);
  if (session.completed_at) return c.text("practice session completed", 409);
  const plan = JSON.parse(session.plan_json) as { cards: { skill_id: string; item_id: string }[] };
  const planMatch = plan.cards.some((card) => card.skill_id === parsed.data.skill_id && card.item_id === parsed.data.item_id);
  if (!planMatch) return c.text("attempt does not match plan", 400);
```

`attemptSchema`: `practice_session_id` (non-empty string), `skill_id` (non-empty), `item_id` (non-empty), `result` ∈ {correct, incorrect, skipped}, `scoring_source` optional literal "guardian_tap", `duration_ms` (int ≥ 0), `shown_at` (non-empty string). A `scoring_source` other than `guardian_tap` is rejected 400 before parsing.

### 4d. `api/src/routes/practice.test.ts` — additions

New module-level helpers: `startSession()`, `postAttempt(sessionId, body)`, `skillRow()` / `itemRow()` (read mastery for `student1` / `phonics_k_u1_short_a` / `phonics_k_u1_short_a_cat`), `attemptCount()`, and `addDaysIso(iso, days) = new Date(Date.parse(iso) + days*86_400_000).toISOString()`.

Three new tests:

1. **Transitions** — on one `(skill, item)`, in sequence: correct → `{streak:1, level:1, ease:2.5, due_at = last_seen_at + 1d}`; correct → `{streak:2, level:2, +2d}`; incorrect → `{streak:0, level:1, +1d}`; skipped → `{streak:0, level:1 (unchanged), +1d}`. Asserted on **both** `skill_mastery` and `item_mastery`. `due_at` is checked as `addDaysIso(row.last_seen_at, interval)`.
2. **Forged-plan no-write** — item not in plan → 400, `attemptCount()===0`, both mastery rows null.
3. **Completed-session no-write** — test forces `completed_at` via direct UPDATE → 409, `attemptCount()===0`, both mastery rows null.

The plan's start route (unchanged this wave) still builds the plan from the legacy `seedCards` filtered to `phonics_k_u1_short_a`, so the started plan contains exactly the `phonics_k_u1_short_a_cat` card — which is why the mastery tests key on that skill/item.

---

## 5. Adversarial focus — questions to actively try to break

**Mastery correctness**
1. The transition test verifies `due_at == addDaysIso(last_seen_at, n)` where `last_seen_at` is read back from the row. Since the handler sets both `due_at` and `last_seen_at` from the same `scoredAt`, **is this test capable of catching a wrong base timestamp?** Could `due_at` and `last_seen_at` both be wrong-but-consistent and still pass? Propose a stronger assertion if so.
2. `interval_days` is keyed by **new_level**, not prev_level. Confirm the `skipped`-at-level-0 and `incorrect`-at-level-0 cases produce `due_at == scored_at` (interval 0) and that nothing reads `INTERVAL_DAYS[undefined]`. Is the `?? 0` fallback reachable, and if so is 0 the right default?
3. Level clamping: schema is `CHECK (level BETWEEN 0 AND 4)`. `correct` uses `min(4, …)`, `incorrect`/`skipped` stay in range. Any path that could violate the CHECK and abort the batch?
4. `ease` is omitted from the INSERT column list (defaults 2.5) and from the `DO UPDATE SET` (preserved). Confirm a long streak never silently resets `ease`. Is leaving it inert actually harmless for any AC?
5. **Streak semantics:** `correct` does `prev_streak + 1` unbounded. Is an ever-growing streak intended, or should it cap? (Plan table says `prev_streak + 1` — confirm no hidden expectation of a cap.)

**Atomicity / concurrency**
6. The read-then-batch is **not** locked. The plan justifies this via D1 single-writer + serial per-student attempts. **Stress this:** is there any path in the current app (ret, double-tap, client retry on timeout, multiple guardians for one student) where two attempts for the same `(student_id, skill_id)` interleave and lose an update? Is the justification adequate or should it be a `[BLOCK]`/`[IMPORTANT]`?
7. If a later batch statement fails (e.g. CHECK violation), does D1 roll back the attempt INSERT too? The code relies on batch = implicit transaction. If a constraint can fire, is the "all-or-nothing" claim actually true here, and is the error surfaced (currently the `await` would throw → 500)? Should there be an explicit error path?
8. `duration_ms` is not persisted into mastery, only into the attempt row. The review heuristic (`automaticity`) depends on `duration_ms` from attempts. Wave 2 doesn't read attempts back for the planner yet — is there a latent gap where the `grade==="1"` planner will need `recentAttempts` sourced from the attempt table (future wave), and is that wiring clearly deferred, not silently missing?

**Planner correctness**
9. `planSize` falls back to `0` for an unknown grade (`?? 0`) → `cards.slice(0,0)` → **empty plan**. Is silently returning an empty plan for an unexpected grade acceptable, or should it throw? The `student.grade` CHECK constraint only allows `K`/`1`, but the planner is also a pure function callable with any string.
10. The `daily_plan` cap is enforced by `slice(planSize)` **after** building all cards. With K-only content (4 items) the cap is never exercised by real data. **Is the "never exceeds daily_plan" guarantee actually tested against a case that exceeds it?** (The test only asserts `<= 16`/`<= 22` on a 4-card plan.) Recommend whether a cap test with synthetic content is warranted, or whether deferring is acceptable given content is fixed.
11. K no-fast-advance: the invariant is enforced by branching on `input.grade === "1"`. Is there any way `recentAttempts` leaks into the K plan (e.g., via ordering, dedup, or `skillMastery`)? The test asserts deep equality of whole plans — is that sufficient, or could both branches be wrong identically?
12. Determinism: ordering comes from `units.flatMap(skill_ids)` then `itemsBySkill` (seed-file order). Is this stable across runs/deploys? Any reliance on object key order or JSON parse order that could reorder cards?
13. The `grade==="1"` filter drops a skill the moment `reviewPassed` is true, with **no** active 1st-grade content to replace it — so a 1st grader who has passed all K skills gets an **empty plan**. Is that the intended Phase A behavior (plan says 1st-grade content is a separate plan), and is it surfaced anywhere, or a silent dead-end?

**Spec/test integrity**
14. Are the RED stages real? (RED commits: planner test failed on missing module; mastery test failed because no mastery row was written — not a syntax error.) Any test that would pass against an empty/no-op implementation?
15. `skillMastery` / `itemMastery` are accepted by `buildPracticePlan` but **never read**. Is carrying unused params justified (forward-compat for the documented future ordering) or dead surface that should be removed now?
16. Anything in the diff that violates the repo's existing conventions visible in the surrounding handler (error-handling style, prepared-statement usage, naming)?

---

## 6. What is explicitly OUT of scope for this review

- Completion endpoint, `completePractice` client, final-card wiring, `diag` reporting — **owned by `docs/plans/002-phase-a-telemetry.md` Task 3**, verified (not implemented) by this plan's Wave 4.
- Wiring the planner into the `start` route — that is **Wave 3** (route integration); `start` still uses legacy `seedCards` here.
- 1st-grade active content authoring — separate plan.
- `mix`-ratio-based selection — intentionally deferred.

Please confine findings to Wave 2 code (planner + mastery upsert + their tests), and call out only deferrals that look mislabeled or that hide a Wave 2 defect.
```

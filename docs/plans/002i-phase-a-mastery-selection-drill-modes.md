# Reader's Way Mastery-Driven Selection + Mode-Aware Drill Cards Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use the project's TDD implementation workflow (RED/GREEN/REFACTOR with per-stage checkpoint commits). Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make daily practice actually adaptive and mode-aware before the family pilot: (1) the planner consumes the mastery bookkeeping shipped in 002c (`due_at`, `level`, `streak`) so mastered items rotate out, missed items come back next session, and items beyond the first `planSize` become reachable; (2) the drill surface renders each card by its instructional mode (PA / phonics / heart words / fluency) instead of one generic "Read this word" card.

**Architecture:** Both changes ride the same contract — the `PlanCard` payload built by `api/src/scheduler/planner.ts`, persisted to `practice_session.plan_json`, and consumed by the app as `PracticeCard`. The planner gains a selection layer (buckets + due-date priority + interleaving per spec 001 §6) on top of the **unchanged** 002c mastery transitions; the card payload gains `kind`, `answer`, and heart-part fields already present in authored content but currently stripped; the app switches card components on `kind`.

**Tech Stack:** Hono on Cloudflare Workers + D1, Vitest (`@cloudflare/vitest-pool-workers` for api; jsdom + raw `createRoot`/`act` for app), React 19, TypeScript.

**Resolves:** Beads `rw-ncu` + `rw-qjk` (both family-wave gates on `rw-odv`). Implements spec 001 §6 "Daily plan generation" (selection layer only) and the §5 family-wave minimum for drill modes. Plan 002c explicitly deferred this: *"Phase A uses deterministic sequence-first selection … until authored 1st-grade content exists"* — that condition has expired.

**Out of scope (deliberate, decided 2026-07-04):**
- Full spec 001 §6 SM-2 fidelity — streak-gated promotions, ease factor, 1/3/7/ease intervals, demotion floor of 1, and the skill manager (graduation, 3-active cap, starter-item intro). Deferred to `rw-5kd` (P3); back-test with `scripts/replay-attempts.ts` once pilot attempt data exists. The shipped transitions (level±1, 0/1/2/4/7-day intervals) stay as-is.
- Spec 001 §5 non-minimum drill features: Elkonin phoneme boxes, first-exposure heart-word explainer, smoothness scoring, repeated-reading affordance, scaffolding toggle, stuck-card flow, bonus round. Split into new beads when reached (educator wave / post-pilot, per `rw-qjk` notes).
- "All caught up today" UI for a legitimately empty non-terminal plan (newly reachable once mastered items rotate out) — belongs to `rw-1gz.5`; this plan only notes the state exists.
- New content authoring (PA has 1 authored item; content bar is `rw-1gz.8`).

---

## Design decisions

### D1 — Card kind derives from `skill_id` prefix

Every skill follows the `pa_` / `phonics_` / `heart_` / `fluency_` naming convention (verified across `content/skills.json`, 2026-07-04). `loadSchedulerContent` derives `kind: "pa" | "phonics" | "heart" | "fluency"` from the item's `skill_id` prefix and **throws on an unknown prefix**, consistent with its existing unknown-skill throws. No new authored field, no content migration.

### D2 — Selection algorithm (deterministic given `(content, mastery, now)`)

Inputs: existing `PlannerInput` plus `now` (ISO string, injected by the route for testability) and widened item mastery `{ level, streak, due_at, last_seen_at }`.

```
eligible = items of selectedSkillIds (the existing grade-1 review-pass filter is unchanged)
m = itemMastery[item_id]            // may be absent = never seen
due     = !m || m.due_at == null || m.due_at <= now

Buckets (disjoint, checked in this order — missed beats review):
  missed : m && due && m.streak === 0 && m.last_seen_at != null   // ANY level:
           a mastered item that was just missed (4→3, streak 0) resurfaces via
           missed rather than waiting out a review interval (spec §6: a miss
           surfaces tomorrow at any level; same for skips)
  review : m && due && m.level >= 3   // healthy mastered items (streak > 0)
  active : !m  (new)  OR  (m && due && m.level <= 2 && m.streak > 0)
  (not due → excluded today)

Quotas from scheduler-config mix {active:.6, review:.25, missed:.15}:
  raw = planSize * ratio; take floor of each; hand remaining slots out by
  largest fractional part, ties broken active > review > missed.
  Slots a bucket can't fill spill in the order: active, then review, then missed.

Order within missed / review:
  due_at asc, then last_seen_at asc, then scope-sequence order.
Order within active:
  previously-seen items first (due_at asc, level asc, last_seen_at asc,
  scope order), then never-seen items in scope-sequence order.

Interleaving (spec 001 §6): greedy pass over the combined selection —
  repeatedly emit the first remaining card whose skill_id differs from the
  previously emitted card's; if none differs, emit the first remaining card.
```

Why this meets `rw-ncu` acceptance: a level ≥ 3 item gets `due_at = now + 4/7d` on scoring, is not `due` tomorrow, and drops out until `due_at` (returns via the review bucket). An incorrect answer sets `streak = 0`, demotes one level, and sets `due_at` 0–2 days out → it lands in the **missed** bucket next session, by rule not coincidence. As early items mature out, later scope-order items fill active slots, so items beyond `planSize` become reachable. Everything is a pure function of `(content, mastery, now)`, and the plan is still committed to `plan_json` at session start.

Note: `skipped` keeps `streak = 0`, so a skipped item at any level also resurfaces via the missed bucket — this matches spec 001 §5's "let's try this one again later" intent. (Adversarial-review revision 2026-07-04: missed is checked before review so this holds for level ≥ 3 items too; the review-quota test was strengthened to use all-due candidates.)

### D3 — PlanCard / PracticeCard payload

```ts
type CardKind = "pa" | "phonics" | "heart" | "fluency";
type PlanCard = {
  skill_id: string;
  item_id: string;
  text: string;            // unchanged: text ?? prompt ?? item_id
  kind: CardKind;
  answer?: string;         // PA: expected blended/segmented answer, shown to the guardian
  regular_parts?: string[];    // heart words
  irregular_parts?: string[];  // heart words
};
```

The app's `PracticeCard` mirrors this with **`kind` optional, defaulting to `"phonics"`** at render time — sessions persisted in `plan_json` / localStorage before this deploys have no `kind`, and must keep rendering.

### D4 — Heart-part rendering reconstructs from `text`

`regular_parts` / `irregular_parts` don't encode position (e.g. `said` = s + **ai** + d). The heart card renders `card.text` and wraps matches of each `irregular_part` in a highlighted span via a single left-to-right pass that consumes each part's first remaining occurrence. If a part fails to match (bad content), fall back to plain text — never crash a drill.

### D5 — Per-mode copy lives in the app, not `packages/copy`

Card eyebrow/labels ("Read this word", "Listen and say it", "Answer: …", "Read this sentence") are drill-surface UI, not brand chrome (`packages/copy` is brand-only per FR3). They go in `app/src/components/cards/cardCopy.ts`.

---

### Task 1: Content loader derives `kind` (RED → GREEN)

**Files:**
- Test: `api/src/scheduler/content.test.ts` (extend or create)
- Modify: `api/src/scheduler/content.ts`

- [ ] **Step 1 (RED):** Assert `loadSchedulerContent` (with fixture sources) yields `kind: "pa" | "phonics" | "heart" | "fluency"` per skill-id prefix, preserves `answer` / `regular_parts` / `irregular_parts` on normalized items, and throws for a skill id with an unknown prefix. Run `pnpm --filter api exec vitest run src/scheduler/content.test.ts` — expected FAIL.
- [ ] **Step 2 (GREEN):** Add `CardKind`, derive in the normalization loop, throw on unknown prefix. Re-run — expected PASS.
- [ ] **Step 3: Commit** — `feat(scheduler): derive card kind from skill-id prefix`

### Task 2: Planner selection layer (RED → GREEN)

**Files:**
- Test: `api/src/scheduler/planner.test.ts`
- Modify: `api/src/scheduler/planner.ts`

- [ ] **Step 1 (RED):** New tests with fixture content + fixed `now`, covering: (a) mastered item (level 3, `due_at` future) excluded today, included once `now >= due_at`; (b) missed item (streak 0, due) present next session in the missed bucket even when active items would otherwise fill the plan; (c) items beyond `planSize` appear once earlier items are not due; (d) quota math at K=16 → active 10 / review 4 / missed 2 (floor + largest-remainder), with spillover when a bucket is short; (e) interleaving: no two consecutive cards share `skill_id` when avoidable; (f) determinism: two calls with identical input produce identical plans; (g) cards carry `kind`/`answer`/heart parts; (h) the grade-1 review-pass filter and `planTerminalReason` behave exactly as before. Update existing sequence-first assertions to mastery-driven fixtures (new students with no mastery still get scope-order active fill — most legacy tests survive with `now` added). Expected FAIL.
- [ ] **Step 2 (GREEN):** Widen `MasteryState` (`due_at: string | null; last_seen_at: string | null` — optional-tolerant for skill rows), add `now: string` to `PlannerInput`, implement D2 selection + D3 payload. Expected PASS.
- [ ] **Step 3 (REFACTOR):** Extract bucket/quota helpers if `buildPracticePlan` exceeds comfortable reading size; keep the module dependency-free.
- [ ] **Step 4: Commit** — `feat(scheduler): mastery-driven selection (buckets, due_at, interleaving)`

### Task 3: Practice route wires real mastery through (RED → GREEN)

**Files:**
- Test: `api/src/routes/practice.test.ts`
- Modify: `api/src/routes/practice.ts`

- [ ] **Step 1 (RED):** Route-level test: seed `item_mastery` rows (mastered-not-due, missed-due) via D1, start a session, assert the returned plan excludes the not-due mastered item, includes the missed item, and every card carries `kind`. Expected FAIL.
- [ ] **Step 2 (GREEN):** `SELECT … level, streak, due_at, last_seen_at` from both mastery tables; pass `now: new Date().toISOString()` into the planner. Update existing fixtures (per the 002d-h review-packet note, `planner.test.ts` + `practice.test.ts` fixtures churn together). Expected PASS — full `pnpm --filter api test`.
- [ ] **Step 3: Commit** — `feat(api): practice start consumes due_at/last_seen_at mastery state`

### Task 4: App — mode-aware cards (RED → GREEN)

**Files:**
- Modify: `app/src/api/types.ts` (mirror D3; `kind?` optional)
- Create: `app/src/components/cards/cardCopy.ts`, `PhonemicAwarenessCard.tsx`, `HeartWordCard.tsx`, `FluencyCard.tsx`
- Modify: `app/src/components/cards/PhonicsCard.tsx` (shared shell stays; eyebrow from `cardCopy`), `app/src/App.tsx` (switch on `card.kind ?? "phonics"`)

- [ ] **Step 1 (RED):** jsdom tests (raw `createRoot` + `act`): PA card renders the prompt as the child-facing text **and** the guardian-facing answer line; heart card renders irregular parts in a visually distinct span (assert class/element, D4 fallback on non-matching parts); fluency card uses sentence copy; a card **without** `kind` renders the phonics card (legacy plan_json/localStorage). Scoring callbacks (correct/incorrect/skip, single-fire, retry-on-reject) behave identically across all four — extract the shared tap-control shell rather than duplicating it. Expected FAIL.
- [ ] **Step 2 (GREEN):** Implement the three components + renderer switch + `cardCopy.ts`. Expected PASS — full `pnpm --filter app test`.
- [ ] **Step 3: Commit** — `feat(app): mode-aware drill cards (PA answer, heart parts, fluency copy)`

### Task 5: Gates, docs, beads

- [ ] **Step 1:** `pnpm -r typecheck && pnpm -r test && pnpm content:validate` — all PASS.
- [ ] **Step 2:** Add the 002i row to `docs/plans/INDEX.md`; update the `rw-ncu`/`rw-qjk` rows in `docs/design/user-journeys.md` if their one-line descriptions drifted.
- [ ] **Step 3:** `bd close rw-ncu rw-qjk --reason` after merge (not before — merge gate applies); note the deferred-scope beads in close reasons.
- [ ] **Step 4: Commit** — `docs: 002i plan index + journey table refresh`

---

## Risks & notes

- **Legacy `plan_json` sessions:** cards without `kind` exist in D1 and localStorage; D3's optional-with-phonics-default covers rendering, and attempts POST payloads are unchanged.
- **Empty-but-not-terminal plans** become reachable (everything mastered and not due). `planTerminalReason` is intentionally untouched; the bare "No cards available" copy is `rw-1gz.5`'s to fix — flagged in its notes.
- **PA content is thin** (1 authored item). The mode renderer is content-agnostic; authoring volume is `rw-1gz.8`.
- **Quota drift at small plan sizes** is expected (16 → 10/4/2); the mix ratios are tunable in `scheduler-config.json` without code changes, and `scripts/replay-attempts.ts` can back-test.

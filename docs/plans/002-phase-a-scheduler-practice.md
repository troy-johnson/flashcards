# Reader's Way Scheduler and Practice Implementation Plan

> **For agentic workers:** Execute by dependency wave. The owner selected **wave mode: yes** and **execution mode: batch by wave** on 2026-05-31. Ask for approval before starting each wave; tasks inside an approved wave may run in parallel when marked parallel-safe.

**Goal:** Replace the hardcoded practice-session stub with a deterministic Phase A scheduler that starts Kindergarten at the beginning of the K sequence, starts 1st Grade with a brief K review path, applies the approved 1st-grade advancement rule, and keeps guardian-tap practice compatible with restrained telemetry.

**Spec anchor:** `docs/specs/002-readers-way-phase-a-micro-pilot.md`, especially FR8–FR15, FR30–FR32, AC5–AC10, AC15.

**Decision anchor:** `docs/specs/002-readers-way-phase-a-micro-pilot.planning-nits.md`, Nit 2: per K-review skill, mark review-passed when accuracy is at least 90% over at least 4 scored attempts; record automaticity as the share of correct attempts with `duration_ms <= 2000`, but do not gate on automaticity in Phase A.

**Companion plans:**
- `docs/plans/002-phase-a-copy-package.md` covers centralized copy (AC1–AC2).
- `docs/plans/002-phase-a-telemetry.md` covers completion storage and diag reporting (AC15). This scheduler plan assumes the telemetry complete-session endpoint exists before Wave 4.

**Content state (read before planning 1st-Grade behavior):** As of 2026-06-02 the content set is **K-only** — `content/skills.json` defines 4 skills all at `"grade": "K"`, and `content/scope-sequence.json` defines a single `"grade": "K"` sequence. There is **no 1st-grade active content authored yet**. Therefore, in this plan, **"1st-Grade support" means the K-review path only**: a 1st-grade student receives K review cards and the 90%-over-4 review-advancement rule, and the review path ends when every K review skill is review-passed or pulled into active practice. Once a 1st grader exhausts the K review path there is no 1st-grade active-practice content to schedule until a later content plan lands; this is the reason AC7 is only partially covered here (see coverage table). 1st-grade active content authoring is out of scope (it belongs to the v1.0 content-bar plan).

## Scope

### In scope

- Build a scheduler module under `api/src/scheduler/`.
- Generate practice plans from `content/skills.json`, `content/scope-sequence.json`, `content/items/seed.json`, and `content/scheduler-config.json` instead of filtering one hardcoded skill in `api/src/routes/practice.ts`.
- Preserve existing `PracticeCard` shape consumed by the app: `{ skill_id, item_id, text }`.
- Apply grade-specific start rules: K starts at the first K sequence; 1st Grade starts with K review skills.
- Persist and update `skill_mastery` and `item_mastery` from guardian-tap attempts.
- Record automaticity metrics in scheduler calculations without using them as a Phase A advancement gate.
- Add tests proving start-plan generation, review advancement, ownership safety, and attempt/mastery updates.
- Verify the app completes a practice session after the final card. The completion endpoint, client helper, and final-card wiring are **owned by `docs/plans/002-phase-a-telemetry.md` Task 3**; this plan depends on that work and only verifies integration compatibility (Wave 4).

### Out of scope

- Full v1.0 content authoring counts from AC11; this plan uses existing content schemas and leaves the larger content-bar build to a separate content plan.
- Magic-link provider work, privacy/terms pages, landing-page copy, and full visual polish.
- COPPA/FERPA legal packet or school procurement artifacts.
- Microphone scoring or automaticity as a hard gate.

## Risk and scope assessment

- **Risk tier:** 2 — cross-module. It touches API routing, scheduler logic, D1 mastery tables, content JSON, and app session completion.
- **Scope:** Medium. Expected file surface is under 15 files, but logic affects real practice progression.
- **Reviewer policy:** Run adversarial plan review before implementation because the scheduler changes learning progression and uses child practice data. Downstream PR/QA adversarial review is required.
- **Protected path check:** No protected paths detected. No `.env*`, secrets, auth config, user/customer tables, Terraform state, or Kubernetes secret files are in scope.
- **Server/client trust boundary (explicit Phase A decision):** The `/attempt` route validates two things server-side and will continue to: (1) guardian **ownership** of the student (`ownsStudent`), and (2) attempt **plan membership** — the `(skill_id, item_id)` pair must exist in the persisted `practice_session.plan_json` (current `practice.ts:62-64`). Phase A **deliberately trusts the client for card ordering/index** — the server does not validate that the attempt is for the session's *current* card or that cards arrive in plan order. Rationale: practice is guardian-supervised, single-student, has **no rewards, scores, streaks-as-currency, or leaderboards to game** (AC10), so out-of-order or replayed attempts only affect that child's own mastery estimate, not any contested resource. Server-side current-card/index validation is explicitly **deferred** to a later phase if/when adversarial incentives exist. This decision is recorded so a reviewer does not read the missing order check as an oversight. The mastery-upsert rules (Task 8) are idempotent-safe enough that a duplicate attempt for the same card does not corrupt state beyond one extra streak/level step, which is acceptable under guardian supervision.

## File surface

### Create

- `api/src/scheduler/content.ts` — typed loader/normalizer for content JSON and scheduler config.
- `api/src/scheduler/content.test.ts` — content loading and referential-integrity tests.
- `api/src/scheduler/review.ts` — review-pass and automaticity calculation.
- `api/src/scheduler/review.test.ts` — deterministic 90%-over-4 advancement tests.
- `api/src/scheduler/planner.ts` — grade-aware daily plan builder.
- `api/src/scheduler/planner.test.ts` — K and 1st-grade plan-generation tests.

### Modify

- `api/src/routes/practice.ts` — call the planner in `/practice/:studentId/start`; upsert mastery rows in `/attempt`.
- `api/src/routes/practice.test.ts` — assert K starts on K sequence, 1st Grade starts on K review, forged attempts remain rejected, and attempts update mastery.
- `api/src/db/schema.ts` — export helper types only if scheduler tests need narrower typed rows.
- `app/src/routes/play.test.tsx` — **verify only** (Wave 4): confirm the existing final-card completion test uses telemetry's `completePractice` mock and contract; do not author competing completion behavior.

### No changes

- `api/migrations/0001_foundation.sql` — existing `skill_mastery`, `item_mastery`, `practice_session`, and `attempt` tables are sufficient.
- `content/` JSON files — no schema change is required for the scheduler build; content expansion is a later plan.
- **Completion files owned by `docs/plans/002-phase-a-telemetry.md` Task 3 — not modified by this plan:** `app/src/api/literacy.ts` (`completePractice` helper), `app/src/api/types.ts` (completion response type), `app/src/App.tsx` (final-card completion branch), and `app/src/drill/session.ts` (post-completion local cleanup). Wave 4 verifies these integrate; it does not author them.

## Dependency waves

### Wave 1 — Scheduler primitives

- **Wave:** 1
- **Dependency group:** scheduler-core
- **Parallel eligibility:** Tasks 1 and 3 are parallel-safe; Tasks 2 and 4 depend on their paired failing tests.
- **Required reviewers:** internal implementation review.
- **Worktree dispatch notes:** one worker can own `content.*`; another can own `review.*`.

#### Task 1 — Add content loader tests

- **Action:** Create `api/src/scheduler/content.test.ts` with tests that load every skill, unit, item, and scheduler-config value and fail if an item references an unknown skill or a unit references an unknown skill.
- **Command:** `pnpm --filter api exec vitest run src/scheduler/content.test.ts`
- **Expected output:** fails because `api/src/scheduler/content.ts` does not exist.

#### Task 2 — Implement content loader

- **Action:** Create `api/src/scheduler/content.ts` exporting `loadSchedulerContent()` with typed `skills`, `units`, `itemsBySkill`, `itemsById`, and `dailyPlanSizeByGrade` values derived from the existing JSON files. **Each normalized item must carry a defined `text` resolved as `text ?? prompt ?? item_id`** (matching current `practice.ts:43`), because not every seed item has a `text` field — e.g. `content/items/seed.json`'s `pa_k_u1_blend_at` has only `prompt`. This guarantees the planner (Task 6) can never emit a card with `text: undefined`.
- **Command:** `pnpm --filter api exec vitest run src/scheduler/content.test.ts`
- **Expected output:** passes all content-loader assertions.

#### Task 3 — Add review-rule tests

- **Action:** Create `api/src/scheduler/review.test.ts` covering fewer than 4 attempts, exactly 4 attempts at 100%, 4 attempts at 75%, 10 attempts at 90%, and automaticity share calculation with `duration_ms <= 2000`.
- **Command:** `pnpm --filter api exec vitest run src/scheduler/review.test.ts`
- **Expected output:** fails because `api/src/scheduler/review.ts` does not exist.

#### Task 4 — Implement review-rule helper

- **Action:** Create `api/src/scheduler/review.ts` exporting `evaluateReviewSkill(attempts)` that returns `{ sampleSize, accuracy, automaticity, reviewPassed }` using accuracy >= 0.9 over sampleSize >= 4 and records automaticity without gating on it.
- **Command:** `pnpm --filter api exec vitest run src/scheduler/review.test.ts`
- **Expected output:** passes all review-rule assertions.

### Wave 2 — Planner and mastery updates

- **Wave:** 2
- **Dependency group:** scheduler-planner
- **Parallel eligibility:** Tasks 5 and 7 are parallel-safe after Wave 1; Tasks 6 and 8 depend on their paired failing tests.
- **Required reviewers:** internal implementation review; adversarial review after the wave because this is the learning-progression core.
- **Worktree dispatch notes:** one worker can own planner tests/implementation; one worker can own mastery tests/implementation.

#### Task 5 — Add planner tests

- **Action:** Create `api/src/scheduler/planner.test.ts` with the following cases:
  1. A K student receives cards from the first K unit (start-of-sequence).
  2. A 1st-grade student receives K review cards until each K review skill is either review-passed or pulled into active practice.
  3. **K no-fast-advance invariant:** Build a K plan for a student whose `skillMastery`/`recentAttempts` would satisfy the 90%-over-4 review-pass criterion (e.g. 4 correct attempts on a K skill), and assert the K plan **still schedules that skill through the normal active mastery progression** and does **not** skip/advance it via the 1st-grade review heuristic. Concretely: assert `buildPracticePlan` produces the same K plan whether or not those review-passing attempts are present (the K branch never calls `evaluateReviewSkill` for advancement). The review-pass fast-advance path is reachable **only** when `grade === "1"`.
- **Command:** `pnpm --filter api exec vitest run src/scheduler/planner.test.ts`
- **Expected output:** fails because `api/src/scheduler/planner.ts` does not exist.

#### Task 6 — Implement planner

- **Action:** Create `api/src/scheduler/planner.ts` exporting `buildPracticePlan({ grade, skillMastery, itemMastery, recentAttempts })` that returns `{ cards }` with at most the grade's `daily_plan` count and with every card normalized to `{ skill_id, item_id, text }`. Add an explicit planner assertion that a generated plan never exceeds `daily_plan` for K or 1st grade. **Grade gating:** the `evaluateReviewSkill` review-pass fast-advance path is invoked **only** on the `grade === "1"` branch; the `grade === "K"` branch advances exclusively through normal mastery state and must never call the review heuristic (enforced by Task 5 case 3). Because content is K-only (see Content state note), the `grade === "1"` branch sources its cards from the same K skills as review content; it does not attempt to schedule nonexistent 1st-grade active content. The `mix` ratios in `content/scheduler-config.json` are read as future configuration but intentionally not used for Phase A ordering; Phase A uses deterministic sequence-first selection so tests remain stable until authored 1st-grade content exists.
- **Command:** `pnpm --filter api exec vitest run src/scheduler/planner.test.ts`
- **Expected output:** passes K and 1st-grade plan-generation assertions.

#### Task 7 — Add mastery update route tests

- **Action:** Extend `api/src/routes/practice.test.ts` to assert the exact mastery transitions defined in Task 8, against a student starting with no mastery rows (treated as the level 0 / streak 0 / ease 2.5 default):
  1. **First correct attempt** on `(skill_id, item_id)` upserts both a `skill_mastery` and an `item_mastery` row with `streak = 1`, `level = 1`, `ease = 2.5`, `last_seen_at` set to the attempt's `scored_at`, and `due_at = scored_at + 1 day`.
  2. **Second consecutive correct attempt** advances `streak = 2`, `level = 2`, `due_at = scored_at + 2 days`.
  3. **Incorrect attempt** after the above sets `streak = 0`, `level = max(0, prev_level - 1)`, `due_at = scored_at + interval(new level)`. From the preceding level-2 state, this means `new_level = 1` and `due_at = scored_at + 1 day`.
  4. **Skipped attempt** sets `streak = 0`, leaves `level` unchanged, `due_at = scored_at + interval(current level)`.
  5. Existing **forged-plan rejection** (attempt whose `(skill_id, item_id)` is not in `plan_json`) still returns 400 and writes **no** attempt row and **no** mastery row.
  6. A **completed** session still returns 409 and writes nothing.
- **Command:** `pnpm --filter api exec vitest run src/routes/practice.test.ts`
- **Expected output:** fails on missing mastery rows after a scored attempt.

#### Task 8 — Implement mastery upsert on attempt

- **Action:** Modify `api/src/routes/practice.ts` so a valid attempt updates `skill_mastery` and `item_mastery` using the exact rules below. Apply the **same** rules to both the `skill_mastery` row (keyed `(student_id, skill_id)`) and the `item_mastery` row (keyed `(student_id, item_id)`); a row that does not yet exist is treated as the schema default (`level = 0`, `streak = 0`, `ease = 2.5`, `due_at = NULL`, `last_seen_at = NULL`).

  **Exact transition rules.** Let `scored_at` = the ISO timestamp written on the attempt row (the single `new Date().toISOString()` value, reused everywhere in this handler so all timestamps match). Define `interval_days(level)` = `{0: 0, 1: 1, 2: 2, 3: 4, 4: 7}[level]`, and `due_at = scored_at + interval_days(new_level) days` (UTC). For every result, `last_seen_at = scored_at`. `ease` is **left at its existing value (default 2.5) and is not modified in Phase A** — the column is reserved for a later spaced-repetition tuning pass and intentionally inert now (recorded so a reviewer does not read the untouched `ease` as a bug).

  | result | new `streak` | new `level` | `due_at` basis |
  | --- | --- | --- | --- |
  | `correct` | `prev_streak + 1` | `min(4, prev_level + 1)` | `scored_at + interval_days(new_level)` |
  | `incorrect` | `0` | `max(0, prev_level - 1)` | `scored_at + interval_days(new_level)` |
  | `skipped` | `0` | `prev_level` (unchanged) | `scored_at + interval_days(new_level)` |

  **Atomicity decision (explicit).** The handler must: (1) read the current `skill_mastery` and `item_mastery` rows for the student, (2) compute the new values in TypeScript per the table above, then (3) write the attempt INSERT plus both mastery upserts in a **single `c.env.DB.batch([...])` call**, which D1 executes as one implicit transaction (all statements commit together or none do). The two upserts use `INSERT ... ON CONFLICT(student_id, skill_id) DO UPDATE SET level = ?, streak = ?, due_at = ?, last_seen_at = ?` (and the `(student_id, item_id)` conflict target for item_mastery) with the JS-computed literal values bound — do **not** recompute `min`/`max` inside SQL, since the values are already resolved in step (2). The read-then-batch sequence is **not** wrapped in a SELECT-level lock; this is acceptable for Phase A because D1 is single-writer and the guardian-tap practice flow issues attempts strictly serially for one student (no concurrent writers race the same `(student_id, skill_id)` row). This is the deliberate "explicitly justified otherwise" choice rather than a single round-trip SQL-side CASE upsert; revisit if concurrent multi-device practice for one student becomes possible. If any batch statement fails, return the existing error path and do not partially apply mastery.
- **Command:** `pnpm --filter api exec vitest run src/routes/practice.test.ts`
- **Expected output:** passes route tests, including ownership, forged-plan rejection, completed-session 409, and the exact mastery transitions from Task 7.

### Wave 3 — Route integration

- **Wave:** 3
- **Dependency group:** practice-route-integration
- **Parallel eligibility:** Tasks 9 and 10 are sequential because route behavior depends on the planner.
- **Required reviewers:** internal implementation review.
- **Worktree dispatch notes:** keep API route integration in the same worktree as planner implementation to avoid merge conflicts in `practice.ts`.

#### Task 9 — Add grade-aware start-route tests

- **Action:** Extend `api/src/routes/practice.test.ts` to seed both a K and 1st-grade student, start practice for each, and assert the K plan starts from K sequence content while the 1st-grade plan starts with K review content rather than the old single-skill hardcoded stub.
- **Command:** `pnpm --filter api exec vitest run src/routes/practice.test.ts`
- **Expected output:** fails while `/practice/:studentId/start` still builds `seedCards` from only `phonics_k_u1_short_a`.

#### Task 10 — Replace hardcoded start-plan stub

- **Action:** Modify `api/src/routes/practice.ts` to remove the module-level `seedCards` filter, query the student's grade plus existing mastery/attempt rows, call `buildPracticePlan`, persist that plan JSON, and return it in the existing response shape.
- **Command:** `pnpm --filter api exec vitest run src/routes/practice.test.ts src/scheduler/planner.test.ts`
- **Expected output:** passes all scheduler and practice-route tests.

### Wave 4 — App completion compatibility check

- **Wave:** 4
- **Dependency group:** app-completion-compatibility
- **Parallel eligibility:** Tasks 11 and 12 are sequential; this wave depends on `docs/plans/002-phase-a-telemetry.md` Task 3 landing first because telemetry owns the completion endpoint, client helper, final-card call, response shape, and non-blocking failure behavior.
- **Required reviewers:** internal implementation review.
- **Worktree dispatch notes:** run in the app worktree after the telemetry complete-session wave is merged or in the same branch after the telemetry wave is complete. Do not re-implement telemetry-owned completion behavior in this plan.

#### Task 11 — Verify final-card completion integration

- **Action:** After telemetry Task 3 lands, verify `app/src/routes/play.test.tsx` covers the final-card flow using telemetry's `completePractice` mock and response contract. The mock must match the telemetry-owned shape exactly: `completePractice: vi.fn(async () => ({ practice_session: { id: "practice1", completed_at: "now" } }))` — no `student_id` field. Assert that scoring the **final** card calls `completePractice("student1", "practice1")` with the active `practice_session_id`, clears local session storage, and navigates to `/play/student1/done`. Also assert completion failure is best-effort telemetry and does **not** block the child finish screen.
- **Command:** `pnpm --filter app exec vitest run src/routes/play.test.tsx`
- **Expected output:** passes once telemetry Task 3 is present; if it fails because `completePractice` is absent or blocks navigation, stop and complete/fix the telemetry plan rather than adding a competing implementation here.

#### Task 12 — Remove scheduler ownership of completion implementation

- **Action:** Treat completion as a dependency, not scheduler-owned work. Do **not** add `completePractice` to `app/src/api/literacy.ts`, do **not** edit the final-card branch in `app/src/App.tsx`, and do **not** change failure UX in this scheduler plan unless a compatibility check shows telemetry Task 3 is missing or regressed. Telemetry Task 3 is the single owner of POST `/practice/:studentId/complete`, the app client helper, and final-card wiring. Required behavior for this plan to proceed: completion is best-effort (`catch { /* never block the child's finish screen */ }` or equivalent), and navigation to `/play/:studentId/done` is never blocked by telemetry failure.
- **Command:** `pnpm --filter app exec vitest run src/routes/play.test.tsx`
- **Expected output:** passes play-route tests with telemetry-owned completion behavior intact.

### Wave 5 — Verification and documentation sync

- **Wave:** 5
- **Dependency group:** verification
- **Parallel eligibility:** Tasks 13, 14, and 15 are sequential because docs should record the verified result and the gate state.
- **Required reviewers:** adversarial PR/QA review required before merge.
- **Worktree dispatch notes:** run from the final integration branch.

#### Task 13 — Run full verification gate

- **Action:** Run the full workspace validation suite.
- **Command:** `pnpm typecheck && pnpm test && pnpm content:validate`
- **Expected output:** TypeScript typecheck passes, app/api tests pass, and content validation exits successfully.

#### Task 14 — Record implementation status

- **Action:** Update `docs/state/workflow-state.md` to point at the scheduler/practice implementation branch or PR, with the next action and any verification gaps discovered during Task 13.
- **Command:** `git diff -- docs/state/workflow-state.md docs/plans/002-phase-a-scheduler-practice.md`
- **Expected output:** diff shows only the plan/status documentation intended for the branch.

#### Task 15 — Adversarial PR/QA gate check (unavailable-reviewer guard)

- **Action:** Before merge, confirm the required adversarial PR/QA review gate is satisfied. If an independent reviewer **is** available, attach their verdict to the round-N packet under `.agents/snapshots/` and proceed only on PASS / APPROVED-WITH-NITS. If an independent reviewer is **not** available, the gate is unmet: set the round-N packet's `## Verdict` to `Adversarial verdict: BLOCKED — independent reviewer unavailable`, and update `docs/state/workflow-state.md` so it reads exactly:
  - `Current Gate: adversarial review required but not met`
  - `Blockers: Adversarial verdict: BLOCKED — independent reviewer unavailable`
- **Command:** `grep -nE "Adversarial verdict: (PASS|APPROVED WITH NITS|BLOCKED — independent reviewer unavailable)|Current Gate: adversarial review required but not met|Blockers: Adversarial verdict: BLOCKED — independent reviewer unavailable" .agents/snapshots/*scheduler*.md docs/state/workflow-state.md`
- **Expected output:** when proceeding, at least one scheduler review snapshot contains exactly `Adversarial verdict: PASS` or `Adversarial verdict: APPROVED WITH NITS`, and `docs/state/workflow-state.md` does **not** contain the BLOCKED gate lines. When no reviewer is available, both exact BLOCKED workflow-state lines are present and no merge proceeds. A mere grep hit is not sufficient; the implementer must record the observed PASS/APPROVED verdict or the BLOCKED workflow-state lines in the PR checklist.

## Acceptance-criteria coverage

| Spec criterion | Status | Coverage in this plan |
| --- | --- | --- |
| AC5 | **Out of scope here** | The add-student/onboarding flow that AC5 governs is **not** part of this scheduler plan. Route tests in this plan seed both allowed grades only as fixtures; they do not implement or re-verify onboarding. AC5 belongs to the existing onboarding scope / a companion plan, not this one. |
| AC6 | Covered | Wave 3 start-route tests and the planner ensure K starts at the first K sequence. |
| AC7 | **Partial** | Wave 1 review helper + Wave 2 planner implement the 90%-over-4 review advancement for the 1st-Grade **K-review path**. Full AC7 ("1st Grade progresses through 1st-grade content") cannot be satisfied until 1st-grade active content is authored (Content state note) — that content work is a separate plan. This plan covers the review-advancement mechanism, not 1st-grade content progression. |
| AC8 | Covered | Existing start-practice route remains the API entry point and gains scheduler-backed plans. |
| AC9 | **Partial** | Wave 4 **verifies** that completion navigation after the final card integrates correctly. The client call, complete-session endpoint, and storage are **owned by the telemetry companion plan** (`docs/plans/002-phase-a-telemetry.md`); this plan depends on that work landing before Wave 4 and does not implement it. |
| AC10 | Covered | No reward mechanics are introduced; the plan only changes scheduling, mastery, and completion. The trust-boundary decision (Risk section) explicitly relies on the absence of gameable rewards. |
| AC15 | **Partial** | The storage tables, complete-session endpoint, client call, and `diag` reporting that satisfy AC15 are all **owned by the telemetry companion plan**. This plan only **verifies** the completion call integrates (Wave 4); it does not wire or implement it. |

## Self-review

- The plan has no database migration because existing mastery/session/attempt tables support the scheduler.
- The plan avoids changing content schemas so it does not block on the separate v1.0 content-bar authoring work.
- The approved automaticity signal is calculated and available for reporting/future tightening, but it is not a Phase A gate.
- The hardcoded stub removal is explicitly tested before implementation.
- Adversarial plan review is required because a scheduler mistake can affect learner progression and pilot trust.

## Adversarial plan review — Round 1 disposition

Verdict received: **BLOCK**. All findings triaged and resolved in this revision.

| # | Finding | Severity | Disposition | Resolution location |
| --- | --- | --- | --- | --- |
| 1 | Mastery updates underspecified; need exact level/streak/ease/due_at rules and atomic write | Blocker | **Accepted** | Task 7 (exact transition assertions) + Task 8 (rule table, `interval_days`, ease-inert note, `DB.batch` atomicity decision with single-writer justification) |
| 2 | Wave 4 must update the play-route test mock to include `completePractice` | Important | **Accepted (superseded)** | Originally resolved by Task 11 editing the mock factory. Superseded by the Round 2 B2-A rewrite: completion (including the `completePractice` mock) is now owned by `docs/plans/002-phase-a-telemetry.md` Task 3, and Wave 4 Task 11 is **verify-only**. |
| 3 | No 1st-grade content exists; plan must state 1st-grade is K-review-only for now | Important | **Accepted** | New "Content state" note after Companion plans; Task 6 grade-gating note; AC7 marked Partial |
| 4 | K no-fast-advance invariant should be an explicit planner test | Important | **Accepted** | Task 5 case 3 (K plan identical with/without review-passing attempts; review heuristic only on `grade === "1"`) + Task 6 grade-gating |
| 5 | Server/client trust boundary not chosen | Important | **Accepted (decided)** | Risk section: Phase A **trusted-client ordering** — server validates ownership + plan membership only; current-card/index validation deferred (no gameable rewards, guardian-supervised) |

Coverage triage from the review, reflected in the Acceptance-criteria coverage table: AC5 marked **out of scope** (onboarding/companion), AC6/AC8/AC10 **covered**, AC7 **partial** (pending 1st-grade content), AC9 and AC15 **partial** (depend on the telemetry companion's complete-session endpoint and reporting).

Next step: re-run a lighter review / diff check against this revision; no blockers remain open.

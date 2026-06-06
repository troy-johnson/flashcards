# Adversarial Review Packet — Plan 002 Phase A Scheduler and Practice

**Plan:** [`docs/plans/002-phase-a-scheduler-practice.md`](002-phase-a-scheduler-practice.md)
**Spec:** [`docs/specs/002-readers-way-phase-a-micro-pilot.md`](../specs/002-readers-way-phase-a-micro-pilot.md)
**Planning decisions:** [`docs/specs/002-readers-way-phase-a-micro-pilot.planning-nits.md`](../specs/002-readers-way-phase-a-micro-pilot.planning-nits.md)
**Branch:** `main` (plan revision in progress)
**Date:** 2026-06-02
**Current verdict:** Round 3 (focused re-review) **APPROVED WITH NITS** — all prior blockers resolved; documentation-only nits cleaned up; implementation may start at Wave 1. Wave 4 still depends on telemetry Task 3 landing first.

## 1. Round history

| Round | Disposition | Outcome |
|---|---|---|
| Round 1 | **BLOCK** | 1 blocker + 4 important findings; directionally right but under-specified key execution details and overclaimed some coverage. All resolved in the 2026-06-02 plan revision (see §3). |
| Round 2 | **BLOCK** | Follow-up verification confirmed Round 1 fixes, then found 2 blockers introduced by the revision: Wave 4 conflicted with telemetry-plan ownership/behavior/response shape, and Task 7's incorrect-attempt `due_at` expectation contradicted Task 8 interval math. Minor notes: daily-plan cap/mix handling and Task 15 gate check needed tightening. Resolved in the current plan revision (see §4). A focused consistency re-review then found 3 residual contradictions left by the Wave 4 fix (see §4b). |
| Round 3 (focused re-review) | **APPROVED WITH NITS** | Independent re-review confirmed B2-A/B2-B/M2-C/M2-D and R2-1/R2-2/R2-3 resolved; B2-B `due_at` math re-derived correct; `DB.batch()` atomicity + ON CONFLICT PKs + CHECK(0–4) all valid. One surviving R2-3 residue (AC9/AC15 coverage rows still said "only wires the client call") plus 2 minor nits (content `text` fallback, stale Round 1 row) — all cleaned up (see §4c). Implementation may start at Wave 1; Wave 4 depends on telemetry Task 3. |

## 2. Round 1 findings

### Blocker
- **B1 — Mastery updates underspecified.** Task 8 needs exact level / streak / ease / due_at rules. Attempt insert + mastery upserts should be one atomic DB operation/transaction, or explicitly justified otherwise.

### Important
- **I1 — App completion test mock gap.** Wave 4 needs to update the play-route test mock to include `completePractice`.
- **I2 — No 1st-grade content exists yet.** Current content is K-only, so the plan must state 1st-grade support is K-review-only for now until 1st-grade content lands.
- **I3 — K no-fast-advance invariant should be explicit.** Add a planner test proving K never uses the 1st-grade review advancement heuristic.
- **I4 — Server/client trust boundary undecided.** The current attempt route validates ownership + plan membership, but not current-card order. The plan should explicitly choose: Phase A trusted-client ordering, or server-side current-card/index validation.

### Coverage triage
- **AC5** — not covered by this plan; should be called companion/existing onboarding scope.
- **AC6** — covered.
- **AC7** — partially covered until 1st-grade content exists.
- **AC8** — covered.
- **AC9** — partially covered; depends on telemetry complete endpoint.
- **AC10** — covered.
- **AC15** — partially covered; depends on telemetry companion plan.

## 3. Round 1 disposition

Verdict received: **BLOCK**. All findings triaged per `core/references/review-disposition.md` and resolved in the 2026-06-02 plan revision. No blockers remain open.

| # | Finding | Severity | Disposition | Resolution location |
|---|---|---|---|---|
| B1 | Mastery updates underspecified; need exact rules + atomic write | Blocker | **Accepted — fixed** | Task 7 (exact transition assertions: first/second correct, incorrect, skipped, forged-plan, completed-session) + Task 8 (transition table, `interval_days` map, `ease` inert-in-Phase-A note, `c.env.DB.batch([...])` atomicity decision with single-writer justification) |
| I1 | Play-route test mock missing `completePractice` | Important | **Accepted — fixed** | Task 11 explicitly updates the `vi.mock("../api/literacy", ...)` factory at `app/src/routes/play.test.tsx:8-29` to add a `completePractice` mock before adding the completion assertion |
| I2 | 1st-grade is K-review-only until content lands | Important | **Accepted — fixed** | New "Content state" note after Companion plans (confirmed K-only: 4 K skills, 1 K sequence); Task 6 grade-gating note; AC7 row marked Partial |
| I3 | K no-fast-advance invariant needs explicit test | Important | **Accepted — fixed** | Task 5 case 3 (K plan identical with/without review-passing attempts; review heuristic reachable only when `grade === "1"`) + Task 6 grade-gating |
| I4 | Server/client trust boundary undecided | Important | **Accepted — decided** | Risk section records the explicit Phase A choice: **trusted-client ordering** — server validates ownership + plan membership only; current-card/index validation deferred (rationale: no gameable rewards, guardian-supervised, single student) |

### Coverage triage reflected in the plan's Acceptance-criteria coverage table
- **AC5** → marked **out of scope** for this plan (onboarding / companion scope).
- **AC6 / AC8 / AC10** → **covered**.
- **AC7** → **partial** — review-advancement mechanism implemented; full 1st-grade progression blocked on unauthored 1st-grade content (separate plan).
- **AC9 / AC15** → **partial** — completion/telemetry storage and reporting owned by `docs/plans/002-phase-a-telemetry.md`; this plan only wires the client call and assumes the complete-session endpoint exists before Wave 4.

## 4. Round 2 disposition

Verdict received: **BLOCK**. Round 1 findings remained fixed, but the revision introduced two blockers. All Round 2 findings are accepted and fixed in the current plan revision; focused re-review is required before implementation.

| # | Finding | Severity | Disposition | Resolution location |
|---|---|---|---|---|
| B2-A | Wave 4 collided with `docs/plans/002-phase-a-telemetry.md` Task 3 over `completePractice` ownership, final-card failure behavior, and completion mock/response shape | Blocker | **Accepted — fixed** | Wave 4 renamed to completion compatibility check. Tasks 11–12 now state telemetry Task 3 owns the endpoint, client helper, final-card call, response shape, and best-effort/non-blocking behavior. Scheduler plan verifies integration only and uses the telemetry response shape without `student_id`. |
| B2-B | Task 7 case 3 expected `due_at = scored_at + 0 days` after an incorrect attempt from level 2, contradicting Task 8's `new_level = 1` and `interval_days(1) = 1` | Blocker | **Accepted — fixed** | Task 7 case 3 now expects `due_at = scored_at + interval(new level)`; from the preceding level-2 state that is `scored_at + 1 day`. |
| M2-C | Planner daily-plan cap was not explicitly asserted; `mix` ratios were present but unused | Minor | **Accepted — clarified** | Task 6 now requires explicit K and 1st-grade cap assertions and records that `mix` is future config intentionally unused by the deterministic Phase A planner. |
| M2-D | Task 15 grep was a weak presence check | Minor | **Accepted — tightened** | Task 15 now requires exact PASS / APPROVED WITH NITS verdict observation or exact BLOCKED workflow-state lines, and says a mere grep hit is insufficient. |

## 4b. Round 2 focused re-review — residual findings

After the Round 2 fixes (B2-A, B2-B, M2-C, M2-D) were applied to the Wave 4 tasks, a focused consistency re-review found that the B2-A fix had been applied only inside Wave 4, leaving three contradictions elsewhere in the document. The first two would re-block an independent reviewer (the plan contradicted itself on completion ownership and on wave structure). All three are now fixed in the plan.

| # | Finding | Severity | Disposition | Resolution location |
|---|---|---|---|---|
| R2-1 | `### Wave 5` header had been deleted during the Wave 4 rewrite, orphaning Tasks 13–15 under Wave 4 (whose parallel-eligibility line governs only Tasks 11–12). Wave-mode requires every task to record its wave. | Blocker | **Accepted — fixed** | Restored `### Wave 5 — Verification and documentation sync` with `Wave`, dependency group, parallel-eligibility (Tasks 13–15 sequential), required reviewers, and worktree notes; Tasks 13–15 now sit under it. |
| R2-2 | File-surface "Modify" list still named `app/src/api/literacy.ts`, `app/src/api/types.ts`, `app/src/App.tsx`, and `app/src/drill/session.ts` as scheduler-owned completion edits, directly contradicting Task 12's "do **not** add `completePractice` / do **not** edit the final-card branch." | Blocker | **Accepted — fixed** | Removed those four from "Modify"; `app/src/routes/play.test.tsx` reduced to **verify-only**; the four completion files moved to "No changes — owned by telemetry Task 3." |
| R2-3 | Scope "In scope" still read "Wire the app to complete a practice session after the final card…", implying scheduler ownership of completion wiring. | Important | **Accepted — fixed** | Scope line reworded to "Verify the app completes…"; completion endpoint/client/wiring stated as owned by telemetry Task 3, with this plan depending on it (Wave 4 compatibility check only). |

Consistency confirmed by grep after the fixes: 5 Wave headers present; no completion-implementation files remain in "Modify"; the only `completePractice` references are Task 12's "do **not**" directive. The plan is now internally consistent on completion ownership across Scope ↔ File surface ↔ Wave 4 ↔ coverage table.

## 4c. Round 3 focused re-review — verdict and nit cleanup

Independent re-review verdict: **APPROVED WITH NITS**. Verification table:

| Prior finding | Status | Evidence |
|---|---|---|
| B2-A (Wave 4 ownership collision) | Resolved | Scope, File surface ("No changes — owned by telemetry"), Wave 4 Tasks 11–12 all defer to telemetry Task 3; mock shape `{ id, completed_at }` (no `student_id`) matches telemetry endpoint. |
| B2-B (Task 7 ↔ Task 8 `due_at`) | Resolved | All cases re-derived against `interval_days={0:0,1:1,2:2,3:4,4:7}`; no off-by-one. |
| M2-C (planner cap/mix) | Resolved | Task 6 requires cap assertions; `mix` recorded as intentionally-unused future config. |
| M2-D (Task 15 gate) | Resolved | Task 15 requires exact verdict observation; a mere grep hit is insufficient. |
| R2-1 (missing Wave 5) | Resolved | 5 wave headers; 15 tasks each in exactly one wave. |
| R2-2 (Modify list) | Resolved | Completion files only under "No changes" + Task 12 "do not" directives. |
| R2-3 (Scope wording) | Resolved (after cleanup) | Scope line fixed in Round 2; the surviving AC9/AC15 "only wires the client call" residue is now corrected (see nit cleanup below). |

Validity checks confirmed by the reviewer: `DB.batch()` is a valid D1 implicit transaction; ON CONFLICT targets `(student_id, skill_id)` / `(student_id, item_id)` match the real PKs (`0001_foundation.sql:44,56`); JS-side `min`/`max` keep `level` within `CHECK(level BETWEEN 0 AND 4)`.

Nits raised and cleaned up:

| Nit | Severity | Disposition | Resolution |
|---|---|---|---|
| AC9 + AC15 coverage rows still said "this plan only wires the client call" (last R2-3 residue) | Minor (contradiction) | **Fixed** | Both rows reworded to "verifies integration; client call/endpoint/storage/reporting owned by telemetry companion." |
| Content loader did not specify the `text ?? prompt ?? item_id` fallback; `pa_k_u1_blend_at` has only `prompt`, risking `text: undefined` | Minor (executability) | **Fixed** | Task 2 now requires each normalized item to carry `text` resolved as `text ?? prompt ?? item_id` (matching `practice.ts:43`). |
| Round 1 disposition row for finding 2 still credited the old mock-factory Task 11 | Minor (stale) | **Fixed** | Row annotated "Accepted (superseded)" — completion mock now owned by telemetry Task 3; Task 11 is verify-only. |
| Daily-plan cap (K:16/1:22) is non-binding with current 4-item seed content | Minor (latent) | **Accepted — noted** | Left as-is; the cap assertion is structural until content expands. No change required for Phase A. |

## 5. Next step

No open blockers. Implementation may begin at **Wave 1** (fully independent of completion/telemetry). **Wave 4 requires `docs/plans/002-phase-a-telemetry.md` Task 3 to be merged first.** Update `docs/plans/INDEX.md` and `docs/state/workflow-state.md` to reflect the approved-with-nits-resolved status and the implement-tdd next phase.

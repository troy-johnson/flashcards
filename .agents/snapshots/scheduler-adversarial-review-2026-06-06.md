# Scheduler/Practice Adversarial Review — 2026-06-06

Adversarial verdict: APPROVED WITH NITS

Round: 1 (PR #21 / branch `plan/002c-scheduler-practice`)

## Scope

- Reviewed against `docs/plans/002-phase-a-scheduler-practice.md` and `docs/specs/002-readers-way-phase-a-micro-pilot.md`.
- Focus areas requested by handoff: scheduler correctness, grade-aware start plans, D1 mastery upsert atomicity, and completion remaining telemetry-owned.

## Evidence reviewed

- Scheduler code/tests: `api/src/scheduler/content.ts`, `planner.ts`, `review.ts`, and matching tests.
- Practice route/tests: `api/src/routes/practice.ts`, `api/src/routes/practice.test.ts`.
- Planning/state docs: plan, spec, prior adversarial review record, `docs/state/workflow-state.md`.
- Verification rerun by reviewer:
  - `pnpm --recursive typecheck` — PASS
  - `pnpm --filter api test` — PASS (46 tests)
  - `pnpm --filter app test` — PASS (13 tests; existing React act warnings/noise only)
  - `pnpm content:validate` — PASS
  - `pnpm --filter app build` — PASS

## Findings

### Blockers

None.

### Important

None new.

### Nits / existing follow-ups

1. `rw-1gz.1.3` remains the right follow-up for the 1st-grade all-review-passed empty-plan terminal reason at the route/HTTP layer. This is explicitly deferred and not a merge blocker.
2. `rw-1gz.4` remains the right follow-up for a P3 completion-failure best-effort assertion in `play.test.tsx`. This is telemetry/completion hardening, not a scheduler blocker.

## Adversarial checks

- **Scheduler correctness:** `buildPracticePlan` uses the configured per-grade cap, deterministic content order, and caps plans by slice. Unsupported grades produce an empty plan rather than leaking content.
- **Grade-aware starts:** K uses the full ordered K sequence and does not consult the review heuristic. Grade `"1"` starts with the K review path and skips only review-passed skills using the ≥90% / ≥4-attempt rule.
- **Review rule:** `evaluateReviewSkill` records accuracy and automaticity, but only sample size + accuracy gate `reviewPassed`; automaticity remains inert as required for Phase A.
- **D1 mastery atomicity:** `/attempt` computes mastery in TypeScript after reading current mastery and writes attempt + skill mastery upsert + item mastery upsert in one `DB.batch`. Route tests cover transition exactness and rollback on later batch failure.
- **Trust boundary:** `/attempt` enforces guardian ownership, guardian-tap source, active session, and plan membership; it does not revalidate current card/order/index, matching the plan.
- **Completion ownership:** completion remains the telemetry contract surface; scheduler work verifies compatibility and does not add reward/gamification mechanics.

## Ship gate

READY. Merge is acceptable on this `APPROVED WITH NITS` verdict after normal branch/PR hygiene.

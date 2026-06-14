# Independent Adversarial Review — PR #36 (rw-385: grade monotonicity in content-validate)

- **Date:** 2026-06-14
- **PR:** #36 — `feat(content-validate): enforce grade monotonicity in scope-sequence (rw-385)`
- **Branch:** `plan/rw-385-grade-monotonicity`
- **Bead:** rw-385 (R2-F6 from rw-1jk adversarial review round 2)
- **Reviewer:** independent subagent pass (`019ec3e9-1f59-7400-a15f-5f3a08a1311b`)
- **Prior snapshot reviewed:** `.agents/snapshots/rw-385-adversarial-review-2026-06-14.md`

## Verdict

**APPROVED WITH NITS.**

No blocker was found. PR #36 satisfies rw-385 and may be handed to the human merge gate. Do not merge without explicit per-PR confirmation, and note that this workspace records `gh pr merge` as human-only.

## Evidence

- The monotonicity check is in `scripts/content-validate.ts` before the global `skillUnitIndex` prerequisite check and before immutability.
- The regression test in `scripts/content-validate.test.ts` covers the invalid `grade 1 -> K` ordering failure.
- PR #36 metadata: open, mergeable (`CLEAN`), CI `verify` succeeded, Workers builds succeeded, `migrate` skipped.

## Findings

- **F-1 (LOW) — Unknown runtime grade values are not explicitly rejected.** `GRADE_ORDER[unit.grade]` can be `undefined`, and `Math.max(..., undefined)` can turn `maxGradeSeen` into `NaN`. Non-blocking for PR #36 because current content/types are `K | "1"` and the requested K/1 failure path works. Tracked by follow-up `rw-brf`.
- **F-2 (LOW) — The error message hardcodes K/grade-1 wording.** This is accurate for rw-385 but should be generalized before future grades. Tracked by follow-up `rw-brf`.
- **F-3 (LOW) — No positive synthetic K -> grade-1 ordering test.** Existing content passes, but current content has no grade-1 units. Tracked by follow-up `rw-brf`.

## Verification

- `pnpm content:validate` -> pass (`ok: 12 skills, 86 items, 3 audio entries`)
- `pnpm exec tsx --test scripts/content-validate.test.ts` -> pass (7/7)
- `pnpm -r typecheck` -> pass (`api`, `app`)

## Gate

PR #36 is ready for the human merge gate. After the human merges PR #36, close `rw-385`; this unblocks `rw-1gz.8.4`, which then unblocks `rw-1gz.8.2`.

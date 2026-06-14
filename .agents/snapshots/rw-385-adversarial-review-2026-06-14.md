# Adversarial Review — PR #36 (rw-385: grade monotonicity in content-validate)

- **Date:** 2026-06-14
- **PR:** #36 — `feat(content-validate): enforce grade monotonicity in scope-sequence (rw-385)`
- **Branch:** `plan/rw-385-grade-monotonicity` (1 commit `159f906`)
- **Bead:** rw-385 (R2-F6 from rw-1jk adversarial review round 2)
- **Reviewer note / independence caveat:** This pass was performed **in-thread by the implementing agent**, not by an independent subagent or separate model. It is a rigorous self-review; if the same independence bar as PR #34/#35 is required, run a fresh independent pass (subagent or other harness) before merge. The bead/handoff state below makes that possible.

## Scope of change
Two files. `scripts/content-validate.ts`: a new loop over `scope` enforcing non-decreasing `GRADE_ORDER`, placed before the `skillUnitIndex` cross-unit prereq block it protects. `scripts/content-validate.test.ts`: one RED test (grade-1 unit before K unit → throws).

## What was checked

1. **Correctness of the monotonicity loop — PASS.** `maxGradeSeen` starts at -1 (below the min grade order 0); each unit fails if its grade order is below the running max, then advances the max. This is correct non-decreasing enforcement. Equal grades (same-grade consecutive units) are allowed, as intended.
2. **Placement — PASS.** Inserted after the grade-order prereq check (line ~89) and before `skillUnitIndex` (line ~91), which is itself before `checkImmutability` (line ~146). This is the reason the synthetic-content test throws the monotonicity error *before* the immutability error fires — verified by the RED run (it first threw immutability, confirming the feature was absent and that ordering matters).
3. **Does it protect the stated assumption — PASS.** The cross-unit prereq check uses a single global scope-array index; with grades guaranteed monotonic, that global index respects grade boundaries, so the check is sound. The new check makes the previously-implicit convention explicit, which is exactly rw-385's intent ahead of Phase 2 (rw-1gz.8.4).
4. **Real content — PASS.** `pnpm content:validate` ok (12 skills, 86 items); existing K-only scope passes unchanged.
5. **Test isolation — known issue, not new.** The test rewrites real `content/*.json` (same harness pattern flagged by rw-cvr/rw-8ea). No new exposure.

## Findings

- **F-1 (LOW) — Unknown grade values silently disable the check.** `GRADE_ORDER[unit.grade]` returns `undefined` for any grade not in `{K, "1"}`. Then `undefined < maxGradeSeen` is `false` (no fail) and `Math.max(maxGradeSeen, undefined)` is `NaN`, after which every subsequent comparison is `false` and the running max stays `NaN` — so one bad/typo'd grade turns off monotonicity enforcement for the rest of the file. This is a pre-existing pattern (line ~85 uses `GRADE_ORDER` the same way) but rw-385's whole premise is robustness before grade-1 lands, so validating that `unit.grade`/`skill.grade` are known values is on-theme. **Disposition:** filed as a follow-up bead; not a merge blocker (no current content has an unknown grade, and the type is `"K" | "1"`).
- **F-2 (LOW) — Error message hardcodes the two-grade world.** The message says "appears after a grade-1 unit; all K units must precede grade-1 units." When grade 2+ is introduced this wording becomes inaccurate (and a grade-2 unit would hit F-1 first anyway). **Disposition:** revisit when grades expand; folded into the F-1 follow-up.
- **F-3 (LOW, coverage) — No positive multi-grade ordering test.** Only the violation case is unit-tested. A valid `K → grade-1` ordering passing is currently exercised only implicitly via `content:validate`, which today has no grade-1 units — so the K→1 transition specifically is untested. **Disposition:** add a positive test alongside the F-1 fix; folded into the same follow-up bead.

## Verdict

**APPROVED WITH NITS.** The change is correct, minimal, well-placed, and TDD'd (RED observed failing for the right reason before GREEN). No blocker found. All three findings are LOW severity and tracked as a single non-blocking follow-up. Do not block PR #36 on them.

## Verification re-run
- `node --import tsx --test scripts/content-validate.test.ts` → 7/7 pass
- `pnpm content:validate` → ok (12 skills, 86 items)
- `pnpm -r typecheck` → clean

## Required follow-up actions
- Resolve or schedule the F-1/F-2/F-3 follow-up bead separately; do not block PR #36 on it.
- On merge: `bd close rw-385`; confirm rw-1gz.8.4 unblocked (→ then rw-1gz.8.2).

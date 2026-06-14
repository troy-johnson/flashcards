# rw-1jk Adversarial Review Preflight — 2026-06-11

## Scope

- Artifact: PR #34, `plan/rw-1jk-k-u1-2-phonics-scope`
- Bead: `rw-1jk`
- Purpose: coordinator preflight before independent adversarial review.

## Evidence Checked

- `gh pr view 34 --json ...`: PR open, CI verify green, Workers builds green.
- `git diff main...HEAD`: 7 files changed, scoped to content plus content-coupled tests.
- `bd show rw-1jk`: issue notes identify six explicit scrutiny points.
- `rg -n "k_u1_seed"`: no code/content references; remaining hits are historical docs.
- `content/skills.json` + `content/scope-sequence.json`: new prerequisites are in equal-or-earlier scope positions by manual check.
- `api/src/scheduler/planner.ts`: scheduler emits cards only for `itemsBySkill[skillId]`, so scoped skills without items are skipped in card generation.

## Weak Claims to Challenge

1. "Skills without items are an acceptable interim state" needs route-level review for grade-1 terminal behavior.
2. "Decodability tension is inherited and can defer to `rw-npb`" may be unacceptable because this PR makes the U1 scope explicit while U1 active items still use `c`.
3. "Validator fixture weakening is harmless" needs scrutiny because the current manifest floor changed from 2 to 9.

## Verification

- `pnpm content:validate`: pass after serial rerun.
- `node --import tsx --test scripts/content-validate.test.ts`: pass, 4 tests.
- `pnpm --filter api test -- src/scheduler/content.test.ts src/scheduler/planner.test.ts src/routes/practice.test.ts`: pass, 33 tests. Required unsandboxed rerun because the Cloudflare/Vitest worker pool binds `127.0.0.1`.

## Preflight Result

Packet ready for independent adversarial review. Preflight does not assign the gate verdict.

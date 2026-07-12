# Family-Device Plans Adversarial Review — Round 1

**Target:** `.agents/snapshots/family-device-plans-draft-2026-07-11.md`
**Profile:** `plan`
**Model/transport:** two independent `openai/gpt-5.5` reviewers through OpenCode
**Date:** 2026-07-11
**Final verdict:** **BLOCKED**

## Accepted blockers

1. Plan 006a did not supply exact provisional `guardian_script` and `student_task` values, so a zero-context implementer would have to invent instructional content or fail validation.
2. Plan 004a used ambiguous “server/local current card” language. Current behavior persists the server-issued session/plan plus a client-owned card index in `sessionStorage`; no active-session resume endpoint exists, and the plan forbids adding one.
3. Plan 005a proposed `Pick<Env, "DIAG_GUARDIAN_EMAIL">` even though `Env` requires the binding, making the absent-secret test depend on a cast rather than a truthful policy interface.
4. Plan 004a manual verification measured Exit practice but did not explicitly measure Menu and guardian navigation/action targets.

## Accepted nits

1. Name the exact cross-route agreement test location and expected status/capability matrix in Plan 005a.
2. Clarify that the public Worker `Env` type remains required while the pure policy accepts an optional structural binding for runtime fail-closed verification.

## Synthesis

The Wave 1 → Wave 2 → Wave 3 order is sound. TDD and protected deployment gates are strong. The blockers are bounded input/source-of-truth and evidence gaps; they do not require a product-decision change.

## Next action

Remediate the draft, then run one fresh-context round-2 plan review.

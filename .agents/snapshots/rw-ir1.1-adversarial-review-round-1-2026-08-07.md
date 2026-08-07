# rw-ir1.1 adversarial code review — round 1

**Target:** `plan/rw-ir1-1-family-progress` at `1ab4e63` versus `origin/main`; PR #228.

**Profile:** code correctness, regression risk, authorization/privacy, family-facing accessibility, responsive behavior, tests, and maintainability.

**Transport:** OpenCode via Vercel AI Gateway, fresh `--pure` runs, high variant. Model IDs were verified with `opencode models` immediately before execution.

## Reviewers and raw verdicts

1. `vercel/zai/glm-5.2` — **APPROVED WITH NITS**. No verified defects. Nits: UA-dependent disclosure marker allowance in `app/src/App.css:113`; module-scope `loadSchedulerContent()` coupling in `api/src/routes/students.ts:53-61`; no automated Enter/Space assertion; no API integration case for retained deprecated skills; list semantics use a `div`.
2. `vercel/moonshotai/kimi-k3` — **APPROVED WITH NITS**. No verified defects. Nits: untrimmed metadata pass-through in `api/src/routes/students.ts:37-51`; module-scope full content load in `api/src/routes/students.ts:53-61`; UA-dependent disclosure marker allowance in `app/src/App.css:102-110`.

Both reviewers independently accepted all acceptance criteria and required no follow-up Bead. They agreed that the CSS marker offset is the only duplicated nit; neither identified a blocker, major issue, authorization regression, data leak, or test failure.

## Synthesis and disposition

The implementation remains **APPROVED WITH NITS**. Ownership is enforced by the authenticated session plus `student.id + guardian_id + archived_at IS NULL`; aggregation is scoped to the verified student; operator diagnostics policy is untouched; canonical metadata and unknown historical fallback are family-safe; native `<details>/<summary>` semantics and prior browser/Safari/VoiceOver evidence cover accessibility; and fresh gates were green (app 79/79, API 138/138, scripts 176/176, typecheck, lint, build, content validation).

The independently duplicated CSS nit was remediated with TDD after an observed RED test: `app/src/routes/guardian.test.tsx` now asserts the disclosure grid has no UA-dependent marker subtraction, and `app/src/App.css` now uses a block `display: grid` with no `calc(100% - 1.5em)` width. Focused guardian tests pass 20/20 after the GREEN change. The remaining nits are optional polish and do not justify beads or scope expansion.

## Acceptance criteria

All criteria are **PASS**: owned progress without operator tools; no cross-guardian data; human-readable names and correct/attempt counts; native accessible expandable descriptions; internal IDs hidden by default; 320/375 responsive evidence; unchanged operator diagnostics authorization; and API/app/ownership/accessibility/regression gates green.

## Evidence

- Review brief: `.agents/snapshots/rw-ir1.1-adversarial-review-packet-2026-08-07.md`
- Fresh verification packet evidence: app build, `pnpm -r typecheck`, `pnpm lint`, app 79/79, API 138/138, scripts 176/176, `pnpm content:validate`, and `git diff --check` all passed before review.
- Post-remediation focused test: `pnpm --filter app test -- src/routes/guardian.test.tsx` — 20/20 passed.

**Canonical status:** no disagreement bead; rw-ir1.1 remains in progress at the PR/merge gate. No commit, push, or merge performed.

## Final exact-state verification

After reconciling the worktree and restoring only the accepted scoped test/copy changes, the root `pnpm test` passed all 179 tests across 25 suites: app 81/81, API 139/139, and scripts 179/179. Workspace typecheck and lint, content validation, production app build with the documented production API origin, frontend production-bundle assertion, and `git diff --check` also passed. No operator-policy or guardian-data-access files changed, and `readersway_sounds/` remained untouched and untracked.

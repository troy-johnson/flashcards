# PR #135 adversarial review — round 1

- Date: 2026-07-15
- Target: PR #135, `plan/pilot-readiness-1-5` → `main`
- Profile: code
- Transport: OpenCode, two isolated fresh-context sessions, high-effort variant
- Verification supplied to reviewers: 350 tests; lint; monorepo typecheck; app build; content validation; audio manifest check; diff check — all passed
- Review behavior: read-only; tests were not rerun; reviewers were instructed to distinguish diff-introduced defects from pre-existing risks

## Reviewer assignments

1. `vercel/zai/glm-5.2` — correctness, privacy, authorization boundaries, information disclosure, security, and unsafe product/legal claims.
2. `vercel/moonshotai/kimi-k2.7-code` — spec/plan/Beads conformance, user-visible regressions, terminal-state behavior, copy centralization, and missed test risks.

Both reviewers independently inspected PR metadata and diff, `AGENTS.md`, Spec 002, Plans 002f and 002g, the recording-session disposition, the relevant Beads, and changed source/test files. Neither session received parent-conversation history.

## Raw GLM verdict

MODEL: vercel/zai/glm-5.2

VERDICT: APPROVED

SUMMARY: Cross-household exit-marker disclosure is intentional and protected by the fail-closed operator policy; raw household and student IDs are used as UI keys rather than displayed. The terminal practice state, unpublished owner-approved legal drafts, centralized copy, and audio disposition match their scoped requirements. No blockers, majors, or actionable minors were identified.

FINDINGS: none

OPEN QUESTIONS: none

## Raw Kimi verdict

MODEL: vercel/moonshotai/kimi-k2.7-code

VERDICT: APPROVED

SUMMARY: The PR cleanly delivers the scoped pilot-readiness follow-ups and aligns with the relevant Beads. Test coverage exists for the new behavior, while landing-route and privacy/terms route wiring remain correctly tracked as separate follow-ups.

FINDINGS: none

OPEN QUESTIONS: none

## Synthesis

VERDICT: APPROVED

The reviewers agree without conflict. No blocker, major, minor, or nit finding requires remediation. The known audio product-policy ambiguity remains pre-existing and outside this diff: `rw-ozz` permits owner judgment for the family-wave decision while the learner-facing manifest retains its checksum-bound SLP approval gate. PR #135 does not weaken that gate.

No merge was performed. The repository per-PR merge confirmation gate remains in force.

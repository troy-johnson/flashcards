# PR #136 adversarial review — round 1

- Target: PR #136, `plan/rw-1gz-10-2-privacy-terms` → `main`
- Profile: code
- Transport: OpenCode, two isolated fresh-context sessions, high-effort variant
- Supplied verification: `pnpm --filter app test` (72 passed), `pnpm -r typecheck`, and `pnpm --filter app build` (all passed)
- Review behavior: read-only; reviewers independently inspected the PR diff, AGENTS.md, Spec 002, Plan 002g, shared copy, routing code, and legal-route tests.

## Reviewer assignments

1. `vercel/anthropic/claude-opus-4.8` — published privacy/legal claims, child-data posture, public/authenticated route boundaries, and support-contact behavior.
2. `vercel/moonshotai/kimi-k2.7-code` — routing regressions, Plan 002g/Spec 002 conformance, and test adequacy.

## Raw Opus verdict

MODEL: vercel/anthropic/claude-opus-4.8

VERDICT: BLOCKED

FINDING 1 — MAJOR: The new public `/privacy` and `/terms` routes render the shared copy's `status` value, which says `Owner-approved draft — not yet published`. The router and landing footer make those pages publicly reachable, so the label contradicts the published legal surface. The source comment in `packages/copy/index.ts` saying the copy is “not yet rendered or published” is stale for the same reason.

Remediation: either update the owner-approved copy/status to accurately describe the published pilot legal pages, or do not expose the routes/footer links until that label is corrected. Confirm whether the plan's owner-publish gate was intentionally cleared.

Other checks passed: FR28 topic coverage, manual support contact, no-self-serve-settings posture, and public-route suppression of guardian navigation.

## Raw Kimi verdict

MODEL: vercel/moonshotai/kimi-k2.7-code

VERDICT: APPROVED

SUMMARY: The PR implements Plan 002g and Spec 002 FR27–39 / AC14 / AC18 / AC19; routes, public-route handling, guardian support contact, landing links, tests, app suite, typecheck, and build are sound. No routing, public-route, guardian-nav, or test-adequacy finding.

FINDINGS: none

OPEN QUESTIONS: none

## Synthesis

VERDICT: BLOCKED

The reviewers agree on routing and test correctness. Opus's MAJOR finding is directly evidenced by the rendered `document.status` and the shared-copy values, so it is not downgraded by Kimi's otherwise independent approval. This is a diff-introduced, user-visible contradiction on a child-data legal surface. Resolve the publication-status copy/owner-intent issue, then rerun the focused review before merge.

No implementation was changed by this review. The per-PR merge confirmation gate remains in force.

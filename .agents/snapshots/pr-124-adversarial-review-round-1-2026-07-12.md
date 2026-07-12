# PR #124 Adversarial Review — Round 1

**Target:** stacked diff `e816776...a545b16` for PR #124
**Profile:** `code`
**Transport:** two independent fresh-context OpenCode headless runs
**Effort:** high
**Date:** 2026-07-12

## Reviewer plan and transport resolution

The owner approved GLM 5.2 and Kimi 2.7 Code through OpenCode. OpenCode verified
both models. The first Hugging Face GLM route was unavailable because its included
credits were exhausted, so the runs used the same requested models through the
configured Vercel gateway:

1. `vercel/zai/glm-5.2` — security and correctness lens.
2. `vercel/moonshotai/kimi-k2.7-code` — integration and operability lens.

Both reviewers received only the bounded review packet, canonical Bead/spec/ADR/plan
and code evidence, the exact stacked diff, and verification results. They were
forbidden from editing files or mutating GitHub, Cloudflare, or Beads.

## Reviewer 1 — GLM 5.2

**Verdict:** `APPROVED WITH NITS`

### F1 — NIT — Runbook omits normalized-value requirement

`docs/state/deployment-setup.md` and Plan 005a do not explicitly say that the
interactive operator designation must be the lowercased, trimmed guardian email.
The policy correctly compares exact configured bytes against the already-normalized
stored guardian email, so a case/whitespace mismatch fails closed. Impact is
operability only: a safe false-deny can confuse production verification.

Suggested remediation: state that the value must match the normalized guardian email
exactly.

### F2 — MINOR — No explicit spoofed-client-input denial test

The implementation is structurally safe: authorization receives only the Worker
environment and server-resolved guardian, and never reads a request-supplied email,
capability, header, body, or route state. However, no test explicitly sends a forged
capability/header for a non-operator and asserts `403`.

Suggested remediation: add one protected-route matrix case that supplies spoofed
client claims and proves they cannot grant access.

### Verification

- Focused API policy/auth/catalog tests: 41 passed.
- Script/deployment contracts: 125 passed.
- `git diff --check e816776...a545b16`: passed.
- Inspected the trust boundary, shared predicate, client literal-true behavior,
  committed designations, versioned-secret documentation, and Specs/Plans 004–006.

GLM rejected concerns about missing-binding runtime failure, case-mismatch bypass,
preview placeholder leakage, `/auth/me` identity disclosure, and cross-route policy
drift with direct code/test evidence.

## Reviewer 2 — Kimi 2.7 Code

**Verdict:** `APPROVED`

**Findings:** None.

### Verification

- API: 120 tests passed.
- App: 48 tests passed.
- Script/deployment contracts: 125 passed.
- API and app typechecks: passed.
- `git diff --check e816776...a545b16`: passed.
- Inspected the exact stacked diff, server policy and consuming routes, client
  capability handling, production config, deployment workflow, ADR/spec/plan
  consistency, and Specs/Plans 004/006 scope boundary.

Kimi rejected concerns about direct-route client gating, configured-email
normalization, capability identity disclosure, and test-only environment casts. It
confirmed Plans 004a and 006a are documentation-only scope in this PR.

## Synthesis

**Final verdict:** `APPROVED WITH NITS`

There are no blockers, major findings, correctness defects, live authorization
bypasses, or deployment changes. Kimi's clean approval does not directly disprove
GLM's two evidence-backed hardening findings, so both are accepted as non-blocking.
Because neither finding was independently reported by both reviewers, this review
does not auto-create a follow-up Bead.

Residual risk remains the separately authorized Task 5 production deployment and
three-identity smoke verification. The code-owning TDD workflow should decide whether
to remediate F1/F2 before marking the draft PR ready.

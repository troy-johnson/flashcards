# Adversarial Review — rw-eje + rw-1gz.9.2

Date: 2026-07-16
Profile: `code`
Risk/effort: high
Target: current uncommitted worktree changes for the two closed Beads below

## Review plan

- `rw-eje`: require production `VITE_API_ORIGIN` for direct frontend releases.
- `rw-1gz.9.2`: build out `LandingRoute` for FR25/AC13.
- Canonical evidence: `bd show` for both Beads, `docs/plans/002f-phase-a-landing-page.md`, Spec 002 FR24–FR29, current diff, implementation/tests/config, and independently reproduced verification.
- Review mode: two independent fresh-context headless OpenCode runs. Reviewers were instructed to inspect only the explicit target and repository evidence, and not to edit, commit, push, or merge.

### Reviewer 1

- Model: `vercel/moonshotai/kimi-k3`
- Model source: explicit user request, verified with `opencode models`
- Transport: Vercel AI Gateway, verified with `opencode providers list`
- Run mode: fresh-context headless CLI
- Role: correctness, plan/acceptance-fit, accessibility, and regression adversary
- Result: completed on the retry after one transient service-unavailable response

### Reviewer 2

- Model: `vercel/zai/glm-5.2`
- Model source: explicit user request, verified with `opencode models`
- Transport: Vercel AI Gateway, verified with `opencode providers list`
- Run mode: fresh-context headless CLI
- Role: independent correctness, verification, maintainability, and security reviewer

## Verification evidence

Both reviewers independently reproduced:

- `pnpm test:scripts`: 157/157 passing.
- `pnpm --filter app test`: 73/73 passing across 11 files.
- Isolated `app/src/routes/landing.test.tsx`: 1/1 passing.
- `pnpm -r typecheck`: clean.
- `VITE_API_ORIGIN=https://api.example.com pnpm --filter app build`: clean.
- Built bundle contains `https://api.example.com` and no `http://localhost:8787` fallback.
- `git diff --check`: clean.

## Raw reviewer verdicts

### Kimi K3

Verdict: `APPROVED WITH NITS`

Findings:

- **MINOR — `scripts/cloudflare-production-deploy.test.ts:140`:** the supplied-origin test proves env forwarding, not that the built bundle contains the origin. The reviewer independently built and grepped the bundle, confirming the current behavior, but recommended a bundle assertion or a client-origin contract test.
- **MINOR — `app/src/App.tsx:120–122` vs `138–143`:** the new landing practice/instruction copy overlaps the existing adult-supported practice and skill-list prose. The plan review revision asked for an explicit replace/keep decision; the close reason does not record one.
- **MINOR — `app/src/App.tsx:119, 126, 156–157`:** new headings and CTA strings are inline rather than in `packages/copy`, despite the plan's “Source all strings from `packages/copy`” instruction.
- **NIT — `scripts/cloudflare-production-deploy.ts:150–155`:** no URL-shape validation beyond missing/blank checking.
- **NIT — `app/src/App.css:405`:** landing CSS comment is stale after the new sections were added.
- **NIT — `app/src/App.tsx:157`:** mailto link has no subject prefill.

No security, accessibility, or functional regression finding.

### GLM 5.2

Verdict: `APPROVED WITH NITS`

Findings:

- **MINOR — deployment contract tests:** the missing-origin case proves fail-before-build/upload, and the supplied-origin case proves forwarding, but no automated test locks bundle embedding. Manual bundle inspection passed. Recommended a post-build bundle assertion or reframing the acceptance criterion.
- **NIT — `scripts/cloudflare-production-deploy.ts:150`:** `.trim()` behavior is not directly tested.
- **NIT — landing copy/plan fidelity:** pre-existing hard-coded “How it works” and “No streaks” strings remain while the plan says all strings should come from `packages/copy`; the new copy itself is copy-backed.

No security or regression finding. Legal routes, contact mailbox, FR25 coverage, responsive layout, and accessibility structure were found acceptable.

## Synthesis

Final verdict: **`APPROVED WITH NITS`**

No blocker, major correctness defect, security issue, or failing verification was found. The current implementation meets both Bead acceptance criteria in behavior, including fail-before-build/upload and the actual production bundle origin.

Accepted corroborated findings:

1. **MINOR — automated bundle-embedding coverage gap (`rw-eje`).** Both reviewers found that the contract test stops at forwarding `VITE_API_ORIGIN` to the build subprocess. The end-to-end bundle behavior was independently verified twice, but a future Vite/client regression could pass the current tests while restoring the localhost fallback.
2. **MINOR — landing copy-source/duplication reconciliation (`rw-1gz.9.2`).** Both reviewers found a plan-fidelity/content-quality issue around inline new headings/CTA and retained overlapping hard-coded landing prose. This is non-blocking for the current FR25 behavior but should be explicitly reconciled with the plan and copy-package invariant.

Single-reviewer proposed nits, not auto-promoted to follow-ups: URL-shape validation, direct `.trim()` coverage, stale CSS comment, and mailto subject UX.

## Canonical update

- No reviewed implementation files were changed by the review.
- Raw verdicts and this synthesis are preserved in this evidence bundle.
- Beads notes/close reasons will point here and record the `APPROVED WITH NITS` disposition.
- Two corroborated non-blocking follow-up Beads will track the bundle assertion and landing copy reconciliation. No GitHub projection or merge action is in scope.

Follow-up Beads: `rw-vja` (bundle assertion) and `rw-rsm` (landing copy reconciliation).

## Next action

Route the two follow-ups to the owning implementation/TDD workflow. The current work is review-approved with nits; do not treat this review as authorization to commit, push, or merge.

# Plans 002d–002h + ADR-002 — Independent Adversarial Review

**Date:** 2026-06-07
**Reviewer:** separate-model (Claude Sonnet) subagents ×3, read-only, verifying claims against the actual codebase
**Targets:** docs/plans/002d, 002e, 002f, 002g, 002h + docs/adrs/002-phase-a-audio-strategy.md
**Tracking:** Beads rw-1gz.14

## Overall verdict: APPROVED WITH NITS → all five plans NEEDS REVISION (no scope changes); revisions applied in PR (this branch)

The roadmap is complete in shape and the FR/AC coverage is mostly right, but the independent pass found one regression introduced by the prior self-review, two coverage gaps the self-review wrongly cleared, and several feasibility/correctness holes. All findings below were accepted unless noted.

## Findings & disposition

### 002d — Email provider — NEEDS REVISION
- **BLOCKER (accepted): `vi.stubGlobal("fetch")` does not work in `@cloudflare/vitest-pool-workers`** (tests run in a workerd isolate; the global isn't patchable from the host). The prior self-review changed *away* from `cloudflare:test` `fetchMock` to `vi.stubGlobal` — a regression. **Fix applied:** dependency-inject `fetch` into `issueMagicLink(env, email, token, fetchImpl = (...a) => fetch(...a))`; tests pass a mock. `auth.ts` keeps calling with three args (default param).
- IMPORTANT (accepted): show the recipient-vs-composed `email` binding order explicitly in the snippet.
- MINOR (accepted): use `Authorization` (capital A); add an `auth.test.ts` integration assertion that `resend` ⇒ 204.
- MINOR (noted): optional `RESEND_API_KEY`/`EMAIL_FROM` are runtime-guarded only — acceptable for the Worker env pattern.

### 002e — Content bar — NEEDS REVISION
- **IMPORTANT (accepted): test-fixture rot.** Expanding K content breaks not just the card-list assertion but the `allPassed` fixtures in **both** `planner.test.ts` and `practice.test.ts` (they hardcode the 4 K skills); the terminal-reason tests would silently stop testing the real "all K review-passed" condition. **Fix:** Task 5 must enumerate ALL K skills in both fixtures.
- **IMPORTANT (accepted): audio count gate is gameable.** A numeric `audio` count is satisfied by TTS-fallback entries, violating ADR-002's real-asset requirement; Task 1's count gate runs before Task 4's `src` schema. **Fix:** audio `required_now` counts only entries with a real `src`; sequence the schema (Task 4) before raising the audio count.
- IMPORTANT (accepted): the "if items split, update the validator" caveat is buried in Task 3 — elevate to a Task 1 precondition (validator hard-reads `content/items/seed.json`).
- MINOR (accepted): make `v1_target` immutable via the existing `checkImmutability` origin/main pattern (else it can be lowered to meet `required_now`).
- MINOR (accepted): clarify how many of the 56 phoneme/digraph assets land in Phase 1 vs Phase 2.
- Confirmed sound: "no scheduler change needed for K" (planner builds from `content.units`).

### ADR-002 — Audio strategy — SOUND (carry two items into 002e Task 4)
- Accurately documents that app audio is net-new and the manifest lacks `src`.
- Under-specified (accepted into 002e Task 4): Web Speech **voice-load race** (`onvoiceschanged`, async enumeration, no guaranteed English voice on iPadOS Safari); **asset licensing** must be a blocking checklist item before "done."

### 002f — Landing — NEEDS REVISION
- **BLOCKER (accepted): `support.email` does not exist** in `packages/copy/index.ts` (only `support.displayName`). Must **extend** the existing `support` object (not replace) in 002f Task 1.
- MINOR (accepted): the existing `LandingRoute` has hard-coded "How it works"/"No streaks" prose; the plan must say whether to replace it with copy constants or keep it, to avoid duplicate/overlapping content.

### 002g — Privacy/Terms — NEEDS REVISION
- IMPORTANT (accepted): **owner-review must be a hard STOP** before Task 2, not an advisory (child-data posture, §12).
- IMPORTANT (accepted): **`support.email` dependency** — 002g consumes it but 002f Task 1 adds it; make 002g depend on that (or add a shared prerequisite). Strict order: **002g before/with 002f**, and 002f footer links must not ship before the routes exist.
- IMPORTANT (accepted): extend **`isPublicRoute` (App.tsx line 615)** to include `/privacy` and `/terms` or guardian nav leaks onto public legal pages.
- IMPORTANT (accepted, FR37/I5): add a **contact link in the authenticated guardian area**, not only public pages.

### 002h — UI polish & a11y — NEEDS REVISION
- IMPORTANT (accepted, cross-plan B1): **own FR13 + FR15** — audit drill flow + completion/progress copy for adult-supported framing and non-reward language. Add to Resolves + a task.
- IMPORTANT (accepted, cross-plan B2): **verify AC20** (no payment wall on any pilot route) — add to verification.
- IMPORTANT (accepted): **missing surfaces** — `/guardian/diag`, `/guardian/:id/settings`, and the guardian dashboard are pilot-visible but absent from the FR34 inventory.
- IMPORTANT (accepted, I2): **own the ADR-002 device-QA matrix** explicitly (single owner; currently split between 002e and 002h).
- MINOR (accepted): wire `expect.extend(toHaveNoViolations())` via a `setupFiles` entry (app `vite.config.ts` has no `test` block) or per-test; otherwise the matcher errors.
- Confirmed sound: jest-axe works against the `container` div; jsdom can't compute contrast (manual is correct).

### Cross-plan
- IMPORTANT (accepted, I1): AC11 and full AC7 are **partial until 002e Phase 2** (1st-grade content); pilot for 1st-grade students should be gated on Phase 2. Note in INDEX.
- MINOR (accepted, M1/M2): INDEX 002e row should say "(phased; full AC11 after Phase 2)"; 002d self-review should note FR20/FR21 are owned by shipped 002a.
- Beads cross-references (rw-1gz.7–.11) are internally consistent.

## Ship gate
Revisions applied to all five plans + ADR-002 + INDEX on branch `plan/002-sonnet-review-revisions`. After merge, the plans are implementation-ready.

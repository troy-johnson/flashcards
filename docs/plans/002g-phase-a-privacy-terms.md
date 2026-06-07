# Reader's Way Privacy Policy & Terms + Contact Route Implementation Plan

> **For agentic workers:** Use the project's TDD workflow for render/coverage tests. Steps use checkbox (`- [ ]`) syntax.

**Goal:** Add basic plain-language Privacy Policy and Terms pages plus a manual support contact route (FR27–29, FR37–39 / AC14, AC18–19).

**Architecture:** Two new public routes (`/privacy`, `/terms`) in the `app/src/App.tsx` path router, added to `isPublicRoute`, rendering `PrivacyRoute`/`TermsRoute`. Copy is plain-language static content (copy-package constants or co-located content modules). The contact route is the shared support email (`support.email`) surfaced as a `mailto:` on both pages and the guardian area (AC18). No self-serve settings (AC19); manual support per FR39.

**Tech Stack:** React + Vite, `packages/copy`, Vitest (jsdom).

**Resolves:** Spec 002 FR27–FR29, FR37–FR39 / AC14, AC18–AC19. Beads epic `rw-1gz.10`.

## Decisions (embedded)

- **Copy: LLM-assisted plain-language draft for owner review.** Lightweight, no DPA/procurement packet (FR29). **Owner review required before pilot publish** — child data is involved and §12 rests the posture on the trusted-pilot boundary.
- **Contact = `support.email` via `mailto:`** (shared with landing 002f and FR39 manual support).
- **No self-serve account/student deletion or settings UI** (NG2/FR38/AC19) — deletion/data requests go through the contact route, handled manually (FR39).

---

### Task 1: Draft Privacy + Terms copy (owner-reviewed)

**Files:** `app/src/content/legal/privacy.ts` + `terms.ts` (or copy-package modules).

- [ ] Draft plain-language **Privacy Policy** covering all FR28 topics: guardian accounts, child/student profile data, practice/session data, restrained telemetry, email/magic-link usage, contact route for account/student deletion + data questions, no ads, no selling data, pilot/early-access status.
- [ ] Draft plain-language **Terms** (pilot scope, acceptable use, no warranty/liability basics, manual-support expectation, pilot/early-access status).
- [ ] **Owner review gate** — flag for owner sign-off before publish. Commit `docs(legal): draft plain-language privacy + terms`.

### Task 2: Privacy/Terms routes + contact (RED → GREEN)

**Files:** Test `app/src/routes/legal.test.tsx` (new); Modify `app/src/App.tsx` (add `PrivacyRoute`, `TermsRoute`, register routes, extend `isPublicRoute`).

- [ ] **RED:** render tests asserting `/privacy` covers the FR28 topics (assert key topic phrases present) and that both `/privacy` and `/terms` surface the `mailto:` contact for deletion/data questions (AC18). Confirm failing.
- [ ] **GREEN:** add the two routes + components rendering the drafted copy + contact `mailto:`; register in the dispatcher and `isPublicRoute`; link from landing footer (002f) and guardian nav.
- [ ] Full app suite + typecheck + build green. Commit `feat(app): add privacy + terms pages and contact route`.

### Task 3: Verification

- [ ] `pnpm -r typecheck && pnpm -r test`; build clean.
- [ ] Confirm: FR28 topics covered (AC14); contact route present for deletion/email-change/data questions (AC18); no self-serve settings added (AC19).
- [ ] Update workflow-state; close `rw-1gz.10`.

## AC coverage

- **AC14** Privacy + Terms cover FR28 topics · **AC18** contact route for deletion/data · **AC19** no self-serve settings required. Responsive/a11y polish owned by 002h.

## Self-review

- Owner review is a hard gate before pilot publish (child-data posture, §12). Copy is plain-language and lightweight (FR29). Contact reuses `support.email` (single source). Sequence: land before/with 002f so footer links resolve.

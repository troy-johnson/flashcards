# Reader's Way Public Landing Page Implementation Plan

> **For agentic workers:** Use the project's TDD workflow for the render tests. Steps use checkbox (`- [ ]`) syntax.

**Goal:** Build the simple public landing page that explains Reader's Way and offers an invited-pilot contact path (FR24–26 / AC13).

**Architecture:** The app uses a path-based router in `app/src/App.tsx`; `LandingRoute` already renders at `/` (the fallback) with a copy-package-sourced hero. Expand `LandingRoute` with the FR25 content sections and a contact path, all sourced from `packages/copy`. Add footer links to `/privacy` and `/terms` (pages built in plan 002g). Static, edge-cacheable; no API calls.

**Tech Stack:** React + Vite, `packages/copy`, Vitest (jsdom).

**Resolves:** Spec 002 FR24–FR26 / AC13. Beads epic `rw-1gz.9`.

## Decisions (embedded)

- **Contact-only, invite-only** — no public waitlist/signup (the pilot is invite-only). FR25's "contact or waitlist path" is satisfied by a contact path.
- **Contact = support email via `mailto:`** — address stored as a copy-package constant (`support.email`), shared with privacy/terms (002g) and manual support (FR39).
- **No pricing / procurement / marketing IA** (FR26).

---

### Task 1: Add landing + support copy constants

**Files:** `packages/copy/index.ts`.

- [ ] Extend the copy package with the FR25 landing sections (what it is, who it's for, short adult-supported practice, evidence-based phonics/decoding/heart-word/fluency focus, privacy stance: no ads / no selling data, pilot/early-access status) and `support.email`. Keep brand-chrome-only (instructional content stays in `content/`).
- [ ] Typecheck. Commit `feat(copy): add landing sections + support email`.

### Task 2: Build out LandingRoute (RED → GREEN)

**Files:** Test `app/src/routes/landing.test.tsx` (new); Modify `app/src/App.tsx` (`LandingRoute`), `app/src/App.css` as needed.

- [ ] **RED:** render test asserting the landing page shows the positioning, audience, privacy stance, pilot/early-access status, a `mailto:` contact link, and footer links to `/privacy` and `/terms`. Confirm it fails.
- [ ] **GREEN:** expand `LandingRoute` to render the copy sections + contact `mailto:` + footer privacy/terms links. Source all strings from `packages/copy`.
- [ ] Full app suite + typecheck + build green. Commit `feat(app): build out landing page (FR25, AC13)`.

### Task 3: Verification

- [ ] `pnpm -r typecheck && pnpm -r test`; app build clean.
- [ ] Manual check: landing renders coherently; contact link opens mail client; privacy/terms links resolve (after 002g) or are present.
- [ ] Update workflow-state; close `rw-1gz.9`.

## AC coverage

- **AC13** — landing includes positioning, audience, privacy stance, pilot/early-access status, and a contact path. Polish/responsive sweep is owned by 002h.

## Self-review

- Copy from `packages/copy` (FR2). No pricing/procurement (FR26). Footer links wire to 002g pages; if 002g not yet merged, links can ship pointing at the soon-to-exist routes (or gate this task behind 002g) — sequence 002g before/with 002f.

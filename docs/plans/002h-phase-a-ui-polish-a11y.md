# Reader's Way Pilot UI Polish & Accessibility Implementation Plan

> **For agentic workers:** Mixed — TDD for added automated a11y checks; manual checklist passes for responsive/SR/contrast. Steps use checkbox (`- [ ]`) syntax.

**Goal:** Bring every pilot-visible surface to coherent, responsive, accessible-enough quality for trusted pilot use (FR33–36 / AC16–17).

**Architecture:** A cross-cutting pass over the FR34 surfaces. Sequenced **last** — depends on the landing (002f) and privacy/terms (002g) pages existing (Beads `rw-1gz.11` is blocked-on `rw-1gz.9` + `rw-1gz.10`). No new product behavior; styling, states, and a11y only.

**Tech Stack:** React + Vite, `app/src/App.css` / `tokens.css`, Vitest (jsdom) + an a11y assertion lib, manual device QA.

**Resolves:** Spec 002 FR33–FR36 / AC16–AC17. Beads epic `rw-1gz.11` (resolves `rw-1gz.11.1` a11y method, `rw-1gz.11.2` breakpoints).

## Decisions (embedded — resolves the open items)

- **Accessibility verification method (C3 / `rw-1gz.11.1`):** pilot-level, not the formal audit OQ6 defers.
  - **Automated** in component/route tests: `jest-axe` (axe-core) for roles, labels, landmarks, and name/role/value on interactive controls.
  - **Manual checklist** (jsdom can't compute layout/color): WCAG 2.1 AA **contrast** via browser devtools/Lighthouse on each surface; **reduced-motion** by auditing that every animation respects `prefers-reduced-motion`; **SR practice-status messaging** via a VoiceOver/NVDA pass on the drill flow.
- **Breakpoints (C4 / `rw-1gz.11.2`):** sanity-check at **mobile 375px**, **tablet/iPad 768px**, **desktop 1280px** (iPad overlaps the ADR-002 audio QA device).

## FR34 surface inventory

landing · sign-in · magic-link requested/check-email · auth error/expired-link · add/select child · grade selection · practice start · drill flow · completion/progress · empty states · error states · Privacy · Terms.

---

### Task 1: A11y test harness + baseline (RED → GREEN)

**Files:** add `jest-axe` (or `vitest-axe`) dev dep; extend route tests with axe assertions.

- [ ] Add the a11y matcher; write axe assertions for a first surface (e.g. landing + sign-in). Fix any violations surfaced. Commit.

### Task 2: Per-surface polish passes

**Files:** `app/src/App.tsx`, `app/src/App.css`, `app/src/tokens.css`, components.

- [ ] For each FR34 surface: coherent responsive layout at the three breakpoints; semantic HTML; visible focus states; keyboard reachability; empty + error states present and styled; axe assertion added where practical. Commit per logical group (public, onboarding, practice).
- [ ] Drill flow: add screen-reader-friendly status messaging for practice feedback (FR36) — e.g. `aria-live` on score/advance.

### Task 3: Contrast + reduced-motion + manual SR pass

- [ ] WCAG 2.1 AA contrast check on each surface (devtools/Lighthouse); adjust `tokens.css` as needed.
- [ ] Verify all animations respect `prefers-reduced-motion`.
- [ ] Manual SR pass (VoiceOver on iPadOS Safari + desktop) through onboarding → drill → completion.

### Task 4: Device QA matrix + verification

- [ ] Mobile (375) + desktop (1280) + iPad (768) sanity on the FR34 surfaces (AC16).
- [ ] `pnpm -r typecheck && pnpm -r test` (incl. axe assertions) green; build clean.
- [ ] Record the a11y verification results; update workflow-state; close `rw-1gz.11` (+ `.11.1`, `.11.2`).

## AC coverage

- **AC16** mobile+desktop sanity on FR34 surfaces (breakpoints named above).
- **AC17** keyboard-reachable + visible focus (automated) **and** AA contrast + reduced-motion + SR practice-status messaging (manual checklist). Formal audit remains deferred (OQ6).

## Self-review

- Pilot-level a11y, not a formal audit (OQ6). Automated where jsdom allows; manual where it doesn't. Sequenced after 002f/002g so all FR34 surfaces exist to polish. No behavior change — pure polish/states/a11y.

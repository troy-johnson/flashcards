# Family-Device Guardian Experience Implementation Plan

> **Execution:** Use bounded specialist subagents task-by-task with review between tasks. Follow RED → GREEN → REFACTOR. Plan 004a runs in Wave 2 after Plan 005a's client capability contract is green.

**Goal:** Deliver a compact branded guardian shell, redirect-and-confirm student creation, and a safe practice exit that preserves active progress.

**Beads:** `rw-arr`, `rw-cwm`, `rw-a92`
**Spec:** [004-family-device-guardian-experience](../specs/004-family-device-guardian-experience.md)
**Dependency:** [Plan 005a](005a-production-operator-capabilities.md) Task 3
**Status:** Approved (adversarial plan review round 2)

## Architecture

Keep the existing SPA router. Extend `navigate` with narrow transient history state for created-student confirmation. A guardian-layout wrapper top-aligns only authenticated guardian pages; public and student mode remain centered. Mobile navigation uses `productName`, a controlled Menu button, and Plan 005a capabilities.

Practice resume keeps the existing contract: the API-issued session ID and plan are cached with client-owned `index` and `shown_at` in `sessionStorage`. The API remains authoritative for accepted attempts/completion. This plan adds no resume/abandon endpoint or server-owned index.

## File surface

- Modify `app/src/App.tsx`, `App.css`, `routes/guardian.test.tsx`, and `routes/play.test.tsx`.
- Modify `app/src/copy.test.ts` only if needed to extend existing brand-consumption assertions.
- No API, D1, content, scheduler, or scoring change is expected.

## Task 1 — Responsive branded guardian shell

**Specialist:** React/accessibility specialist

- [ ] Add RED tests for `productName`, labeled Menu, `aria-expanded`, capability-filtered actions, sign out, `Escape`, first-action focus on open, and Menu focus restoration on close without navigation.
- [ ] In jsdom, assert semantic/class hooks rather than claiming computed media-query layout.
- [ ] Run `pnpm --filter app test -- src/routes/guardian.test.tsx` and observe RED.
- [ ] Refactor `GuardianNav` into semantic header/navigation, importing `productName` from `copy`.
- [ ] Desktop keeps inline actions. Mobile uses one brand/Menu row and a controlled action panel closed by `Escape`, selection, or repeated button activation.
- [ ] Use Plan 005a's literal-true capability for operator actions.
- [ ] Wrap authenticated navigation and route in `.guardian-layout`; top-align its descendant `.page-shell` without changing public/student mode.
- [ ] Give all controls at least a 44 × 44 CSS-pixel target and prevent horizontal overflow.
- [ ] Run focused tests and app typecheck green.

## Task 2 — Redirect and confirm student creation

**Specialist:** React state/accessibility specialist

- [ ] Add RED tests proving success navigates once to `/guardian`, focuses the dashboard heading, announces one named status, and marks the correct row; reload/re-render does not announce again.
- [ ] Add a RED failure case proving the form and entered values remain and no redirect occurs.
- [ ] Extend `navigate(path, state?)` with `{ createdStudent?: { id; displayName } }`.
- [ ] On success, navigate immediately and remove the inline `created` branch.
- [ ] In `GuardianRoute`, consume state once, clear it with `history.replaceState`, focus an `h1` with `tabIndex={-1}`, and emphasize only the matching student row.
- [ ] Keep the failure message as `role=alert`.
- [ ] Run focused tests and app typecheck green.

## Task 3 — Safe exit from active practice

**Specialist:** practice-state specialist

- [ ] Add RED tests proving Exit practice appears on a ready start screen and active drill, not on done; carries a stable target hook; navigates to the student dashboard; and never calls score/complete by itself.
- [ ] Cover:
  - pre-submit exit/resume at the same cached index;
  - disabled exit while a deferred score request is pending;
  - post-Correct, Try again, and Skip exit preserving the accepted attempt and locally advanced cached index;
  - same-tab reload/re-render loading cached `ActivePractice`;
  - normal completion with no exit control.
- [ ] Assert cached session ID/plan remain server-issued and exit itself never changes index, attempts, mastery, or completion.
- [ ] Run the focused play test and observe RED.
- [ ] Add one quiet reusable control on active start/drill surfaces. It only navigates to `/guardian/:studentId`.
- [ ] Disable exit from score initiation through response/advancement. Never clear `sessionStorage` on exit.
- [ ] Do not add an API resume/abandon endpoint or server-owned card index.
- [ ] Run focused and full app gates green.

## Task 4 — Integration regression review

**Specialist:** app integration reviewer

- [ ] Verify desktop nav, sign out, direct routes, student selection, score retry, completion, and fail-closed missing capabilities.
- [ ] Refactor only duplicated focus/menu/route-state mechanics after green.
- [ ] Review the diff for accidental API, scheduler, content, scoring, or brand-copy duplication.
- [ ] Run all app tests, typecheck, and `git diff --check`.

## Task 5 — Device and assistive-technology verification

**Specialist:** independent device QA reviewer

- [ ] At 320, 375, 768, and 1280 CSS pixels, record branding, alignment, overflow, clipping, header-to-content spacing, confirmation, and PA rendering if Plan 006a is present.
- [ ] Measure Menu, every visible guardian navigation/action control, and Exit practice at every viewport; each target must be at least 44 × 44 CSS pixels.
- [ ] With iPhone Safari/VoiceOver or equivalent WebKit, verify Menu name/state, focus on open, close behavior, focus restoration, dashboard-heading focus, and exactly-once status announcement.
- [ ] Verify operator/non-operator entry points after Plan 005a.
- [ ] Verify start and every active card mode show Exit; done does not.
- [ ] Record device/OS/browser/viewport and pass/fail without personal account data.

## Quality gate

```bash
pnpm --filter app test
pnpm --filter app typecheck
pnpm -r test
pnpm -r typecheck
git diff --check
```

Rollback is UI-only; no data or server-state rollback is required.

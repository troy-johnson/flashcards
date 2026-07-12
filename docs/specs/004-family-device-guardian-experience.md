# Family-Device Guardian Experience

**Beads:** `rw-arr`, `rw-cwm`, `rw-a92`
**Planning bead:** `rw-15y`
**Status:** Approved (adversarial review round 3)
**Date:** 2026-07-11

> Adversarial verdict: **APPROVED** after two standard rounds and one user-approved confirmation round. Evidence: [round 1](../../.agents/snapshots/family-device-specs-adversarial-review-round-1-2026-07-11.md), [round 2](../../.agents/snapshots/family-device-specs-adversarial-review-round-2-2026-07-11.md), [round 3](../../.agents/snapshots/family-device-specs-adversarial-review-round-3-2026-07-11.md).

## Goal

Make the production guardian experience clear and usable on a family phone: recognizable branding, compact navigation, an unambiguous student-creation outcome, and a safe way to leave and resume practice.

The design is grounded in the mobile reflow, target-size, consistent-navigation, and status-message guidance registered in [`docs/research/SOURCES.md`](../research/SOURCES.md). The current-state evidence and code surface are documented in [`2026-07-11-family-device-qa-remediation-research.md`](../research/2026-07-11-family-device-qa-remediation-research.md).

## Scope

### Goals

- Show the Reader's Way identity and usable guardian navigation on mobile.
- Use a compact single-row mobile header with “Reader's Way” and a labeled Menu button.
- Keep desktop navigation inline.
- After student creation, return to the guardian dashboard, announce success accessibly, and identify the new student visually.
- Provide an always-visible, touch-safe “Exit practice” control.
- Preserve unfinished practice and resume it on the same card.

### Non-goals

- A full guardian navigation menu during child practice.
- A redesign of the overall visual system.
- Marking an exited session complete.
- Changes to practice scheduling or scoring.
- A general-purpose notification system.

## Required Behavior

### Mobile guardian shell

- At mobile widths, one aligned header row contains “Reader's Way” and a labeled Menu button.
- Opening Menu exposes Students, Diagnostics and Audio catalog when authorized, plus Sign out.
- Desktop retains inline navigation.
- Navigation targets are at least 44 × 44 CSS pixels.
- Page content begins directly below the header without viewport-centering gaps.
- Existing card styling and desktop behavior remain intact.
- The Menu button exposes an accessible name and `aria-expanded` state.
- Opening the menu moves focus to its first navigation action. `Escape`, selecting an action, or activating the Menu button again closes it; a close without navigation returns focus to the Menu button.
- The menu supports touch and keyboard operation without relying on hover.

### Student creation

- A successful creation navigates to `/guardian` exactly once.
- The dashboard displays a temporary success message, for example: “Theo was added and is ready for practice.”
- The success message is exposed exactly once as an accessible status announcement for that navigation event.
- The newly created student row receives temporary visual emphasis.
- After the client-side route transition, focus moves to the guardian-dashboard heading. The status announcement and highlighted row provide the outcome without moving focus into a transient element.
- Submission failures remain on the form with entered values preserved and do not redirect.
- The transient confirmation may be transported in navigation state; it is not durable student data and need not survive a later reload.

### Practice exit

- Every active practice screen displays a quiet “Exit practice” control with at least a 44 × 44 CSS-pixel target.
- Active practice screens include the pre-drill practice-start screen and every active drill/current-card screen. The completed-practice screen is not active and need not display Exit practice.
- Exiting returns to that student's dashboard.
- The unfinished server-backed session remains active and resumes at the same unanswered card.
- Exiting does not submit an answer, advance the card, or complete the session.
- Practice mode does not expose the full guardian navigation.
- While an answer action is awaiting its server response, Exit practice is disabled so navigation cannot race the mutation.
- Before an answer action is submitted, exit leaves the current card and all progress unchanged; resume returns to that card.
- After Correct, Try again, or Skip has been accepted by the server, that action's normal recorded effect remains. Exit adds no mutation, rollback, duplicate attempt, or extra advancement; resume returns the server-selected current unanswered card.
- Reloading before exit does not change these rules: the server-provided active-practice state is authoritative.

## Preserve

- Existing desktop navigation and sign-out behavior.
- Student selection and dashboard behavior outside the creation confirmation.
- Answer submission, scoring, scheduling, resume, and completed-practice behavior.
- Server ownership of active-practice state.

## Acceptance Criteria

1. At 320, 375, 768, and 1280 CSS pixels wide, the guardian shell has no horizontal scrolling, clipped branding, overlapping controls, or excessive blank space above content.
2. Mobile users can open and close the menu with touch and keyboard; the Menu button exposes its accessible name and expanded state, focus moves to the first action on open, `Escape` closes it, and a close without navigation returns focus to the button.
3. Authorized operator links appear in the mobile menu; ordinary guardians do not see them, subject to Spec 005.
4. Creating a student redirects to the dashboard exactly once, moves focus to its heading, announces success exactly once, and highlights the correct student.
5. A failed creation does not redirect and retains entered form values.
6. Before submission, exit produces no practice mutation and resume returns the same card. While submission is pending, exit is disabled.
7. After a Correct, Try again, or Skip response is accepted, exit preserves that action's ordinary result but produces no additional attempt, progress change, completion, rollback, or advancement; resume returns the current server-selected unanswered card. The same behavior holds after reload.
8. Existing desktop navigation, sign-out, student selection, answer submission, and completed-practice behavior continue to work.
9. The practice-start screen and every active drill/current-card screen display Exit practice with a measured target of at least 44 × 44 CSS pixels; the completed-practice screen is excluded.

## Verification

- Focused guardian-shell component tests for mobile/desktop rendering, accessible menu name/state, open/close focus, `Escape`, touch-equivalent activation, and capability-filtered links.
- Route/navigation tests for successful and failed student creation, dashboard-heading focus, exactly-once status announcement, and new-row emphasis.
- Practice route tests for pre-submit exit, disabled exit while pending, post-Correct, post-Try again, post-Skip, and post-reload exit. Each asserts the attempt/progress delta caused by the answer action separately from the zero delta caused by exit, then asserts the server-provided resume card.
- Practice-surface tests assert that Exit practice is rendered on practice start and each active drill/current-card mode, absent on the completed screen, and styled with a minimum 44 × 44 CSS-pixel target; manual device QA confirms the measured touch target.
- Regression tests for ordinary answer submission and session completion.
- Manual layout checks at 320, 375, 768, and 1280 CSS pixels.
- A recorded VoiceOver/Safari smoke check on an iPhone or equivalent WebKit device verifies the Menu button name/state, focus on open, `Escape` or close behavior available to the platform, focus restoration, route-heading focus, and one-time success announcement.

No data migration is required. The shell and confirmation changes can be rolled back independently. The exit control adds no new persistence behavior and can be rolled back without altering the active-practice contract.

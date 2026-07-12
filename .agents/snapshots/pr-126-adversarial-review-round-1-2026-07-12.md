# PR #126 adversarial code review — round 1

**Date:** 2026-07-12  
**Target:** PR #126, commit `2bdae36642d01dcb6edf9966f00385cb74c463b7` against `471f1b871e1e6d8dc2a1f28a10d43c997e5f328e`  
**Profile:** code  
**Scope:** Plan 004a Task 1 / bead `rw-arr` only  
**Final synthesized verdict:** **APPROVED WITH NITS**

## Reviewers

1. `vercel/zai/glm-5.2` through OpenCode/Vercel, high effort, fresh sealed-packet run. Raw verdict: **APPROVED WITH NITS**.
2. `vercel/moonshotai/kimi-k2.7-code` through OpenCode/Vercel, high effort, fresh sealed-packet run. Raw verdict: **BLOCKED**.

Both reviewers received the same bounded packet: complete PR diff, Spec 004, Plan 004a, `rw-arr`, and verification claims. Earlier exploratory attempts that did not return a structured verdict were discarded.

## Synthesized findings

### Accepted non-blocking nits

1. **Initial auth bootstrap can briefly omit the header.** `GuardianNav` returns `null` until `/auth/me` resolves (`app/src/App.tsx:73`). This can cause a first-load layout shift on a direct guardian route. It is not a Task 1 acceptance failure: the approved plan retains capability-driven rendering after `getCurrentGuardian`, and the required loaded shell is present. Consider reserving stable branded header space in later polish if real-device QA finds the flash noticeable.
2. **Menu-structure tests could be more explicit.** Tests cover the accessible name, expanded state, focus, Escape, repeated toggle, action close, sign-out, and capability filtering. They do not directly assert that `aria-controls` resolves to the action container or scope privileged-link assertions to that container. This is a test-hardening opportunity, not evidence of broken behavior.
3. **`overflow-x: hidden` creates a scroll-container side effect.** The current layout passes all required viewport checks, but the CSS may affect future sticky positioning or focus scrolling. Prefer `clip` or remove the guard if future layout work no longer needs it.

No nit was independently duplicated closely enough to auto-create a follow-up bead under the adversarial-review policy.

## Rejected findings

1. **Kimi blocker: Tasks 2 and 3 are missing — rejected as a scope error.** PR #126 explicitly implements Plan 004a Task 1 and bead `rw-arr`. Student creation and practice exit are separately owned by `rw-cwm` and `rw-a92`; their absence is correct scope control, not an incomplete diff.
2. **Brand link leaves the menu open — rejected.** The brand is outside the disclosed action panel and uses ordinary anchor navigation. Navigation reloads/unmounts the shell, resetting local menu state. The specification only requires menu actions, Escape, and repeated Menu activation to close the disclosure.
3. **`aria-haspopup` is required — rejected.** This is a disclosure inside semantic navigation, not an ARIA menu widget. `aria-expanded` and `aria-controls` express the implemented contract; `aria-haspopup` would imply popup semantics not otherwise implemented.
4. **The action container needs `role=menu` or a region label — rejected.** The links are already inside `<nav aria-label="Guardian navigation">`. Adding `role=menu` would require menu-widget keyboard behavior and would be semantically misleading.
5. **Outside-click dismissal is required — rejected.** Spec 004 explicitly requires Escape, selection, and repeated Menu activation. Outside-click dismissal is optional behavior and is not needed for keyboard or touch operability.
6. **The first-action selector is too brittle — rejected.** The selector deliberately distinguishes the Students action from the brand link and currently resolves uniquely; this is not a correctness risk.

## Verification evidence

- GLM independently ran the focused guardian suite: 14/14 passed.
- GLM independently ran repository tests and typechecks: app 52/52, API 121/121, typechecks passed.
- `git diff --check` passed.
- Existing authenticated browser QA covered 320, 375, 768, and 1280 CSS pixels, focus behavior, 44-pixel targets, overflow, and runtime errors.
- All PR checks are green, including frontend Static Assets preview build `829c518e` and version `7c0972ad-a8da-49cb-8214-b54ed394d38d`.

## Merge disposition

No blocker, major correctness defect, accessibility defect, security regression, or scope mismatch remains after evidence-based disposition. PR #126 is suitable for owner merge consideration, subject to the repository's explicit per-PR merge confirmation gate. iPhone Safari/VoiceOver remains a post-deployment manual smoke check.

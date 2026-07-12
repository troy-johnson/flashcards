# Draft Implementation Plans — Family-Device QA Remediation

**Specs:** 004, 005, 006
**Planning bead:** `rw-15y`
**Execution choice:** dependency-aware waves; bounded specialist subagents; review between waves
**Protected path:** Spec 005 authorization/configuration uses mandatory security review and separate deployment verification

## Packet execution order

1. **Wave 1:** Execute Plan 005a completely. Its server-authoritative capability contract must be green and security-reviewed before Plan 004a changes guardian navigation.
2. **Wave 2:** Execute Plans 004a and 006a in parallel with separate specialist subagents. Plan 004a consumes the capability contract delivered by 005a; Plan 006a is independent.
3. **Wave 3:** Run the combined verification matrix, manual family-device checks, and requirement-to-evidence review. Do not deploy a production change until its own plan's gates pass.

Each implementation task follows RED → GREEN → REFACTOR. The assigned specialist must record the failing test before production-code changes. Review occurs after each task and at each wave boundary. Commits and pushes occur only when repository authority is active; every commit ends with `Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>`.

---

# Plan 005a — Production Operator Capabilities

**Goal:** Restore production operator access while making one fail-closed server policy authoritative for `/auth/me`, Diagnostics, Audio catalog, and client entry-point visibility.

**Bead:** `rw-r6r`
**Spec:** `docs/specs/005-production-operator-capabilities.md`
**ADR:** `docs/adrs/003-server-authoritative-guardian-capabilities.md`
**Risk:** Protected authentication-derived authorization and production secret configuration

## Architecture

Create a pure operator-policy module in the API. It receives the trusted authenticated guardian and a narrow structural binding, rejects absent/empty/whitespace/non-matching configuration, and returns `{ operator_tools: boolean }`. `/auth/me` returns this additive object; both protected routes call the same policy before serving data. The app treats only the literal boolean `true` as authorization-display evidence. Server routes remain authoritative. The deployed Worker `Env` binding remains required, but the pure policy deliberately accepts an optional value so runtime absence is testable without a cast and fails closed.

## File surface

- Create `api/src/auth/operator-policy.ts`.
- Create `api/src/auth/operator-policy.test.ts`.
- Modify `api/src/routes/auth.ts` and `api/src/routes/auth.test.ts`.
- Modify `api/src/routes/diag.ts` and `api/src/routes/practice.test.ts` (current Diagnostics authorization coverage).
- Modify `api/src/routes/audio-catalog.ts` and `api/src/routes/audio-catalog.test.ts`.
- Modify `app/src/api/types.ts` and `app/src/api/literacy.ts`.
- Modify `app/src/App.tsx` and `app/src/routes/guardian.test.tsx`.
- Modify `api/wrangler.toml`.
- Modify `scripts/d1-deployment-contract.test.ts` to lock the production-secret boundary.
- Modify `docs/state/deployment-setup.md` with secret setup and smoke verification, never the value.

## Task 1 — Add the fail-closed shared policy

**Specialist:** API/security specialist
**Produces:** the sole operator-capability decision function; its structural environment type permits a no-cast missing-binding test while the Worker `Env` remains required

- [ ] Add RED tests in `api/src/auth/operator-policy.test.ts` for absent, empty, whitespace-only, exact matching, non-matching, and surrounding-whitespace configuration. Assert only the exact configured value matching the already normalized guardian email returns true.
- [ ] Run `pnpm --filter api test -- src/auth/operator-policy.test.ts`; observe failure because the module/behavior does not exist.
- [ ] Implement:

  ```ts
  export type GuardianCapabilities = { operator_tools: boolean };

  type OperatorPolicyEnv = { DIAG_GUARDIAN_EMAIL?: string | null };

  export function guardianCapabilities(
    env: OperatorPolicyEnv,
    guardian: Pick<AuthenticatedGuardian, "email">
  ): GuardianCapabilities;

  export function canUseOperatorTools(
    env: OperatorPolicyEnv,
    guardian: Pick<AuthenticatedGuardian, "email">
  ): boolean;
  ```

  `canUseOperatorTools` must delegate to `guardianCapabilities`; it must not duplicate comparison logic. A missing/null/blank-after-trim value returns false, and otherwise the configured bytes must equal `guardian.email` exactly. Keep `api/src/types.ts` and `api/src/cloudflare-test.d.ts` bindings required; no cast or global type weakening is needed for the pure-policy absence test.
- [ ] Run the focused test green, then `pnpm --filter api typecheck`.
- [ ] Refactor only after green; do not introduce roles, database columns, request-header policy, or a client-writable capability.

## Task 2 — Use the policy in every API surface

**Specialist:** API specialist
**Consumes:** Task 1 policy
**Produces:** additive auth contract and non-drifting route authorization

- [ ] Extend `api/src/routes/auth.test.ts` with RED cases proving authenticated `/auth/me` returns `{ guardian, capabilities: { operator_tools: true|false } }`; unauthenticated remains 401; missing/blank config returns false.
- [ ] Extend Diagnostics and Audio catalog tests with RED cases for the same matching guardian/config matrix. Preserve 401 for no session and 403 for an authenticated non-operator.
- [ ] In `api/src/routes/auth.test.ts`, add one cross-route matrix test using the same authenticated session and environment for all calls. Matching config expects `/auth/me` 200 with `operator_tools: true`, Diagnostics 200, and Audio catalog 200. Non-matching config expects `/auth/me` 200 with false and both protected routes 403. With no session, all three return 401. Individual route files retain their focused payload tests.
- [ ] Run:

  ```bash
  pnpm --filter api test -- src/routes/auth.test.ts src/routes/practice.test.ts src/routes/audio-catalog.test.ts
  ```

  Observe RED against the old direct comparisons and old `/auth/me` payload.
- [ ] Modify `auth.ts`, `diag.ts`, and `audio-catalog.ts` to call the Task 1 module. Do not accept identity or capability input from a request body, query, cookie field other than the existing authenticated session, or header.
- [ ] Run the focused tests and API typecheck green.
- [ ] **Protected-path gate:** a security reviewer checks session trust boundary, fail-closed behavior, 401/403 preservation, no secret disclosure, and the absence of a second authorization implementation. Block Wave 1 on any finding.

## Task 3 — Consume the capability in the guardian client

**Specialist:** React/accessibility specialist
**Consumes:** Task 2 `/auth/me` contract

- [ ] Add `GuardianCapabilities` and `AuthMeResponse` types in `app/src/api/types.ts`; make `getCurrentGuardian()` return the named response.
- [ ] Add RED guardian tests for capability true, false, missing, and malformed. True shows Diagnostics, Audio catalog, and the dashboard Diagnostics entry point; every other case hides all operator entry points. Direct protected routes are not made public.
- [ ] Run `pnpm --filter app test -- src/routes/guardian.test.tsx`; observe RED.
- [ ] Store session capabilities alongside the guardian in `App`. Pass a derived `operatorTools={capabilities?.operator_tools === true}` into guardian navigation and dashboard rendering.
- [ ] Keep loading/missing state fail-closed; do not infer access from guardian email in the browser.
- [ ] Run focused app tests and `pnpm --filter app typecheck` green.

## Task 4 — Move production designation to a Worker secret

**Specialist:** Cloudflare operations specialist
**Consumes:** green Tasks 1–3 and security approval

- [ ] Add a RED deployment-contract test in `scripts/d1-deployment-contract.test.ts` proving `DIAG_GUARDIAN_EMAIL` remains available as a local/preview placeholder but is absent from `[env.production.vars]` and no real operator email is committed.
- [ ] Run `pnpm test:scripts`; observe RED while the production placeholder remains.
- [ ] Remove `DIAG_GUARDIAN_EMAIL` from `[env.production.vars]` in `api/wrangler.toml`. Keep the `Env` binding required: Cloudflare supplies it as a production secret.
- [ ] Update `docs/state/deployment-setup.md` with this value-free procedure:

  ```bash
  pnpm --filter api exec wrangler secret put DIAG_GUARDIAN_EMAIL --env production
  pnpm --filter api exec wrangler secret list --env production
  ```

  The operator types the value interactively. Never place it in command history, docs, test fixtures, logs, screenshots, or tool output.
- [ ] Run `pnpm test:scripts`, `pnpm --filter api test`, `pnpm --filter app test`, and both package typechecks.
- [ ] Inspect `git diff` and `rg` for the real operator address before any commit or deployment.

## Task 5 — Protected deployment verification and rollback

**Specialist:** operations verifier; must not be the Task 4 implementer
**Precondition:** explicit deployment authority; this plan never grants merge authority

- [ ] Confirm `wrangler secret list --env production` names `DIAG_GUARDIAN_EMAIL` without displaying its value.
- [ ] Deploy the API through the repository's approved production path only after security review and green tests.
- [ ] With the configured operator session, verify `/auth/me` returns true and both tools load.
- [ ] With a separate authenticated guardian, verify `/auth/me` returns false, entry points are absent, and direct API requests return 403. Verify an unauthenticated request returns 401.
- [ ] Record status codes and pass/fail evidence without emails, cookies, tokens, or secret values.
- [ ] Rollback order if verification fails: restore the prior Worker version; keep or remove/rotate the secret as appropriate. Secret removal intentionally disables operator tools and is the safe failure mode.

## Plan 005a quality gate

```bash
pnpm --filter api test
pnpm --filter app test
pnpm test:scripts
pnpm --filter api typecheck
pnpm --filter app typecheck
git diff --check
```

Wave 1 exits only after the security reviewer and independent deployment verifier pass.

---

# Plan 004a — Family-Device Guardian Experience

**Goal:** Deliver a compact branded guardian shell, redirect-and-confirm student creation, and a safe practice exit that preserves active progress.

**Beads:** `rw-arr`, `rw-cwm`, `rw-a92`
**Spec:** `docs/specs/004-family-device-guardian-experience.md`
**Dependency:** Plan 005a Task 3 capability contract must be green before Task 1 navigation implementation

## Architecture

Keep routing in the existing React SPA. Extend the internal `navigate` helper to carry typed, transient history state for a created student. A guardian-layout wrapper changes only authenticated guardian page alignment; public and student-mode centering remain intact. The mobile header uses the shared `productName`, a controlled Menu button, and capability-filtered actions. Practice exit performs client navigation only and never calls score/complete APIs or clears `sessionStorage`. Resume uses the existing `ActivePractice` contract: the API-issued practice-session ID and plan are cached with a client-owned `index` and `shown_at` in `sessionStorage`; the API remains authoritative for accepted attempts and completion, but no new server resume endpoint or server-owned index is introduced.

## File surface

- Modify `app/src/App.tsx`.
- Modify `app/src/App.css`.
- Modify `app/src/routes/guardian.test.tsx`.
- Modify `app/src/routes/play.test.tsx`.
- Modify `app/src/copy.test.ts` only if an existing brand-consumption assertion needs extension; do not duplicate the product name locally.
- No API, D1, content, scheduler, or scoring-code change is expected.

## Task 1 — Responsive branded guardian shell

**Specialist:** React/accessibility specialist
**Consumes:** Plan 005a client capability contract

- [ ] Add RED tests in `guardian.test.tsx` for shared `productName`, labeled Menu button, `aria-expanded`, capability-filtered actions, sign out, `Escape`, first-action focus on open, and Menu-button focus restoration on close without navigation.
- [ ] Where jsdom cannot calculate media queries or pixel layout, assert stable semantic/class hooks and leave measurements to Task 5; do not claim computed-layout proof from jsdom.
- [ ] Run `pnpm --filter app test -- src/routes/guardian.test.tsx`; observe RED.
- [ ] Refactor `GuardianNav` into a semantic header/navigation while keeping it local to `App.tsx` unless extraction materially improves testability. Import `productName` from `copy`.
- [ ] Desktop renders inline actions. At the mobile breakpoint, render one header row with brand and Menu; the controlled action panel opens/closes with button, `Escape`, action selection, and repeated button activation.
- [ ] Use the Plan 005a literal-true capability to include Diagnostics and Audio catalog. Keep Sign out available.
- [ ] Add a `.guardian-layout` wrapper around nav plus guardian route. Override descendant `.page-shell` to top-align directly below the header without changing public/student mode.
- [ ] Ensure interactive targets are at least 44 × 44 CSS pixels and no horizontal overflow is introduced.
- [ ] Run focused tests and app typecheck green.

## Task 2 — Redirect and confirm student creation

**Specialist:** React state/accessibility specialist

- [ ] Replace the existing success-on-form test with RED tests that assert: successful creation navigates once to `/guardian`; dashboard heading receives focus; one `role=status` message names the new student; the matching row has a temporary emphasis hook; re-render/reload does not announce again; failure stays on the form, preserves DOM-entered values, and does not redirect.
- [ ] Run the focused guardian test and observe RED.
- [ ] Extend `navigate(path, state?)` with a narrow typed state such as `{ createdStudent?: { id: string; displayName: string } }`.
- [ ] On success, navigate immediately with the created-student state; remove the local `created` success branch from `AddStudentRoute`.
- [ ] In `GuardianRoute`, consume the state once, clear it with `history.replaceState`, focus an `h1` carrying `tabIndex={-1}`, render the status once, and add a temporary class/data attribute only to the matching student row. Do not persist confirmation in student/API data.
- [ ] Preserve submitted form controls on API rejection and keep the error as `role=alert`.
- [ ] Run the focused tests and app typecheck green.

## Task 3 — Safe exit from active practice

**Specialist:** practice-state specialist

- [ ] Add RED tests in `play.test.tsx` proving Exit practice appears on a ready practice-start screen and active drill, not on done; carries a stable touch-target class; navigates to `/guardian/:studentId`; and never calls `scoreAttempt` or `completePractice` by itself.
- [ ] Add cases for: pre-submit exit/resume the same cached index; disabled exit while a deferred score request is pending; post-Correct, post-Try again, and post-Skip exit preserving the accepted API attempt and resuming the locally advanced cached index; same-tab reload/re-render loading the cached `ActivePractice`; completion still reaching done with no exit control. Assert the cached session ID/plan remain the server-issued values and the exit action itself never changes index, attempts, mastery, or completion.
- [ ] Run `pnpm --filter app test -- src/routes/play.test.tsx`; observe RED.
- [ ] Add one quiet reusable Exit practice control inside `App.tsx` or a small local component. Render it only when a practice session is active on start/drill surfaces. It calls only `navigate(`/guardian/${studentId}`)`. Do not add an API resume/abandon endpoint or server-owned card index in this plan.
- [ ] Pass `busy` to the drill surface's exit control and disable it from score initiation until response handling/advancement completes. Do not clear `sessionStorage`; do not create an abandon endpoint.
- [ ] Style the control with a measured minimum 44 × 44 CSS-pixel target without competing visually with scoring buttons.
- [ ] Run focused play tests, then all app tests and typecheck.

## Task 4 — Regression cleanup

**Specialist:** app integration reviewer

- [ ] Refactor only duplicated focus/menu/route-state mechanics while keeping behavior green.
- [ ] Verify desktop nav, sign out, direct guardian routes, student selection, scoring retry, normal completion, and missing-capability behavior.
- [ ] Run:

  ```bash
  pnpm --filter app test
  pnpm --filter app typecheck
  git diff --check
  ```

- [ ] Review the diff for accidental changes to API calls, scheduler state, content, or brand-string duplication.

## Task 5 — Family-device and assistive-technology verification

**Specialist:** independent device QA reviewer
**Consumes:** green Tasks 1–4 and completed Plan 005a

- [ ] At 320, 375, 768, and 1280 CSS pixels, record pass/fail for branding, menu alignment, no horizontal scrolling, no clipped/overlapping controls, content directly below the header, student confirmation, PA card if Plan 006a is present, and measured target dimensions for the Menu button, every visible guardian navigation/action control, and Exit practice. Each must be at least 44 × 44 CSS pixels.
- [ ] On iPhone Safari with VoiceOver (or an equivalent WebKit device), verify Menu name/state, focus on open, close behavior available to the platform, focus restoration, post-create dashboard-heading focus, and exactly-once success announcement.
- [ ] Verify ordinary guardians see no operator entry points and the operator sees both after Plan 005a.
- [ ] Verify practice start and every active card mode show Exit practice; done does not.
- [ ] Record device/OS/browser, viewport, observed result, and defects in bead notes without personal account data.

## Plan 004a quality gate

```bash
pnpm --filter app test
pnpm --filter app typecheck
pnpm -r test
pnpm -r typecheck
git diff --check
```

Rollback is UI-only: revert the shell/confirmation/exit deployment. No data migration or server-state rollback is required.

---

# Plan 006a — Caregiver-Ready Phonemic Awareness

**Goal:** Replace specialist shorthand with explicit adult and child instructions while preserving saved-card compatibility and practice behavior.

**Bead:** `rw-gmi`
**Spec:** `docs/specs/006-caregiver-ready-phonemic-awareness.md`
**Dependency:** independent of Plan 005a; may run in parallel with Plan 004a

## Architecture

Add canonical `guardian_script` and `student_task` strings to live `pa_` content items. The content validator rejects missing/blank canonical fields. Scheduler normalization and planner projection carry them into new plan cards. The app renders separate adult and child regions when both fields exist; a card saved before this change falls back to existing `text`/`answer` rendering. No database or local-storage migration occurs.

## File surface

- Modify `content/items/seed.json`.
- Modify `scripts/content-validate.ts` and `scripts/content-validate.test.ts`.
- Modify `api/src/scheduler/content.ts` and `api/src/scheduler/content.test.ts`.
- Modify `api/src/scheduler/planner.ts` and `api/src/scheduler/planner.test.ts`.
- Modify API practice-route fixtures/assertions in `api/src/routes/practice.test.ts` if required to prove serialized propagation.
- Modify `app/src/api/types.ts`.
- Modify `app/src/components/cards/DrillCard.tsx`, `cardCopy.ts`, and `cards.test.tsx`.
- Modify `app/src/App.css`.
- Record family and educator review evidence on bead `rw-gmi`; do not create an untracked markdown TODO.

## Task 1 — Enforce the canonical content contract

**Specialist:** content-schema specialist

- [ ] Extend the validator's `Item` type with optional `answer`, `guardian_script`, and `student_task`.
- [ ] Add RED fixtures in `scripts/content-validate.test.ts` proving every live `pa_` item fails when any of the three fields is missing, empty, or whitespace-only. Non-PA items and deprecated PA items remain unaffected.
- [ ] Add a green fixture with all three nonblank fields. Preserve existing prompt/text validation.
- [ ] Run `pnpm test:scripts`; observe RED.
- [ ] Implement the narrow PA validation in `scripts/content-validate.ts`.
- [ ] Update `pa_k_u1_blend_at` in `content/items/seed.json`, retaining `prompt` and `answer` for legacy/readability fallback, with these exact provisional strings:

  ```json
  {
    "guardian_script": "Say, ‘/a/ /t/.’ Stretch /a/ slightly, then say /t/ right after it.",
    "student_task": "Your child puts the sounds together and says the word."
  }
  ```

  These strings make the implementation slice deterministic but are not approved release copy. Task 5 owner/curriculum review may revise them; any revision reruns validation, propagation, rendering, and viewport evidence before family rollout.
- [ ] Run `pnpm test:scripts` and `pnpm content:validate` green.

## Task 2 — Propagate the fields through scheduler and API

**Specialist:** scheduler/API specialist

- [ ] Add RED content-loader tests proving both fields survive normalization and remain absent when not authored.
- [ ] Add RED planner tests proving both fields appear on PA `PlanCard`s and are omitted from unrelated cards. Add/extend a practice-route assertion to prove the serialized start response carries them.
- [ ] Run:

  ```bash
  pnpm --filter api test -- src/scheduler/content.test.ts src/scheduler/planner.test.ts src/routes/practice.test.ts
  ```

  Observe RED.
- [ ] Extend `RawItem`, `PlanCard`, and `toCard` with optional `guardian_script` and `student_task`. Keep them additive; do not recompute or concatenate scripts in the client.
- [ ] Run focused API tests and API typecheck green.

## Task 3 — Render explicit adult and child roles with legacy fallback

**Specialist:** React/instructional-UX specialist

- [ ] Extend `PracticeCard` in `app/src/api/types.ts` with optional fields.
- [ ] Add RED `cards.test.tsx` cases for canonical PA rendering: visible labels “What you say” and “What your child does,” exact authored strings, expected answer, preserved Correct/Try again/Skip controls, and no reliance on the old raw prompt as primary instruction.
- [ ] Add a RED legacy case with only `text`, `kind: "pa"`, and `answer`; assert the existing prompt/answer experience remains usable.
- [ ] Add regression assertions that scoring fires once and reset-on-rejection behavior is unchanged.
- [ ] Run `pnpm --filter app test -- src/components/cards/cards.test.tsx`; observe RED.
- [ ] Add role labels to `cardCopy.pa`; update `PhonemicAwarenessCard` to use the canonical two-region layout only when both fields are present, otherwise render the existing fallback.
- [ ] Add restrained CSS hooks for adult script, child task, and answer. Do not move instructional strings into `packages/copy`.
- [ ] Run focused tests and app typecheck green.

## Task 4 — Cross-layer and viewport verification

**Specialist:** integration reviewer

- [ ] Run all content, API, and app gates:

  ```bash
  pnpm content:validate
  pnpm test:scripts
  pnpm --filter api test
  pnpm --filter app test
  pnpm -r typecheck
  git diff --check
  ```

- [ ] At 320, 375, 768, and 1280 CSS pixels, verify adult, child, and answer regions remain distinct with no clipping or horizontal scroll.
- [ ] Exercise Correct, Try again, Skip, resume, and completion on a canonical PA card and a constructed legacy saved card.
- [ ] Confirm no migration, scoring, scheduler-selection, audio-recording, or non-PA rendering change entered the diff.

## Task 5 — Instructional review gates

**Specialist:** product/curriculum reviewer for family gate; SLP reviewer for educator gate

- [ ] Before the family pilot, record on `rw-gmi`: reviewer identity, date, exact content revision, pass/fail, and explicit results for all five Spec 006 readability-rubric items. Any failed item returns to Task 1 wording and repeats Tasks 1–4 as affected.
- [ ] Before the educator pilot, record on `rw-gmi`: SLP name and role/credential, date, exact content revision, scope, changes requested, and pass/fail. Only pass opens the educator gate.
- [ ] A family-wave pass does not imply educator approval. Lack of SLP availability does not block family use but keeps educator rollout closed.

Rollback restores the legacy PA rendering while additive fields may remain in content/plans. No saved-state migration or rollback is required.

---

# Combined Wave 3 Verification

After 005a is complete and 004a/006a have independently passed:

```bash
pnpm content:validate
pnpm audio:manifest:check
pnpm -r test
pnpm test:scripts
pnpm -r typecheck
pnpm --filter app build
git diff --check
git status --short
```

Map every acceptance criterion in Specs 004–006 to a test, inspection, device record, security review, deployment smoke result, or instructional approval. Unmet external gates remain explicit rollout blockers; they do not get converted into implementation success.

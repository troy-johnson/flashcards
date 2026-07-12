# Production Operator Capabilities Implementation Plan

> **Execution:** Use bounded specialist subagents task-by-task with review between tasks. Follow RED → GREEN → REFACTOR. Plan 005a is Wave 1 and must finish before Plan 004a changes guardian navigation.

**Goal:** Restore production operator access while making one fail-closed server policy authoritative for `/auth/me`, Diagnostics, Audio catalog, and client entry-point visibility.

**Bead:** `rw-r6r`
**Spec:** [005-production-operator-capabilities](../specs/005-production-operator-capabilities.md)
**ADR:** [ADR 003](../adrs/003-server-authoritative-guardian-capabilities.md)
**Status:** Approved (adversarial plan review round 2)
**Risk:** Protected authentication-derived authorization and production secret configuration

## Architecture

Create a pure operator-policy module. It receives the trusted authenticated guardian and a narrow structural binding and returns `{ operator_tools: boolean }`. Missing, null, empty, whitespace-only, and non-matching values fail closed. The deployed Worker `Env` keeps `DIAG_GUARDIAN_EMAIL` required, while the pure policy accepts an optional value so runtime absence is testable without casts.

`/auth/me`, Diagnostics, and Audio catalog use this one policy. The app treats only literal `true` as display authorization; server routes remain authoritative.

## File surface

- Create `api/src/auth/operator-policy.ts` and `operator-policy.test.ts`.
- Modify `api/src/routes/auth.ts`, `auth.test.ts`, `diag.ts`, `practice.test.ts`, `audio-catalog.ts`, and `audio-catalog.test.ts`.
- Modify `app/src/api/types.ts`, `app/src/api/literacy.ts`, `app/src/App.tsx`, and `app/src/routes/guardian.test.tsx`.
- Modify `api/wrangler.toml`, `scripts/d1-deployment-contract.test.ts`, and `docs/state/deployment-setup.md`.
- Keep `api/src/types.ts` and `api/src/cloudflare-test.d.ts` bindings required.

## Task 1 — Add the fail-closed shared policy

**Specialist:** API/security specialist

- [ ] Add RED tests for absent, null, empty, whitespace-only, exact matching, non-matching, and surrounding-whitespace configuration.
- [ ] Run `pnpm --filter api test -- src/auth/operator-policy.test.ts` and record the failure.
- [ ] Implement:

  ```ts
  type OperatorPolicyEnv = { DIAG_GUARDIAN_EMAIL?: string | null };
  export type GuardianCapabilities = { operator_tools: boolean };

  export function guardianCapabilities(
    env: OperatorPolicyEnv,
    guardian: Pick<AuthenticatedGuardian, "email">
  ): GuardianCapabilities;

  export function canUseOperatorTools(
    env: OperatorPolicyEnv,
    guardian: Pick<AuthenticatedGuardian, "email">
  ): boolean;
  ```

- [ ] Make `canUseOperatorTools` delegate to `guardianCapabilities`; do not duplicate comparison logic.
- [ ] A missing/null/blank-after-trim value returns false. Otherwise configured bytes must equal the already normalized guardian email exactly.
- [ ] Run the focused test and `pnpm --filter api typecheck` green.
- [ ] Do not add roles, database columns, request-header policy, or client-writable capabilities.

## Task 2 — Use the policy in every API surface

**Specialist:** API specialist

- [ ] Add RED `/auth/me` cases for true, false, missing, and blank capability configuration; preserve unauthenticated 401.
- [ ] Add RED Diagnostics and Audio catalog cases for the same matrix; preserve 401 without a session and 403 for authenticated non-operators.
- [ ] In `api/src/routes/auth.test.ts`, add one cross-route matrix using the same session/configuration:
  - matching: `/auth/me` 200/true, Diagnostics 200, Audio catalog 200;
  - non-matching: `/auth/me` 200/false, protected routes 403;
  - no session: all three 401.
- [ ] Run the three focused route-test files and observe RED.
- [ ] Refactor all three surfaces to call the Task 1 module. Never accept identity or capability from request data.
- [ ] Run focused tests and API typecheck green.
- [ ] **Protected-path gate:** an independent security reviewer verifies the session trust boundary, fail-closed behavior, 401/403 preservation, no disclosure, and absence of a second authorization implementation.

## Task 3 — Consume the capability in the client

**Specialist:** React/accessibility specialist

- [ ] Add named `GuardianCapabilities` and `AuthMeResponse` types; make `getCurrentGuardian()` return the named response.
- [ ] Add RED guardian tests for true, false, missing, and malformed capabilities. Only true shows Diagnostics, Audio catalog, and the dashboard Diagnostics entry point.
- [ ] Run the focused guardian test and observe RED.
- [ ] Store capabilities alongside the guardian and pass `operatorTools={capabilities?.operator_tools === true}` to navigation/dashboard rendering.
- [ ] Do not infer access from email or make direct routes public.
- [ ] Run app tests and app typecheck green.

## Task 4 — Move production designation to a Worker secret

**Specialist:** Cloudflare operations specialist

- [ ] Add a RED deployment-contract test proving local/preview placeholders remain allowed while `DIAG_GUARDIAN_EMAIL` is absent from `[env.production.vars]` and no real operator email is committed.
- [ ] Run `pnpm test:scripts` and observe RED.
- [ ] Remove the production placeholder from `api/wrangler.toml`.
- [ ] Document this value-free procedure:

  ```bash
  pnpm --filter api exec wrangler secret put DIAG_GUARDIAN_EMAIL --env production
  pnpm --filter api exec wrangler secret list --env production
  ```

- [ ] The value is entered interactively and never appears in commands, docs, fixtures, logs, screenshots, or review output.
- [ ] Run script, API, app, and typecheck gates; inspect the diff and search for the real address before deployment.

## Task 5 — Protected deployment verification

**Specialist:** independent operations verifier; not the Task 4 implementer

- [ ] Require explicit deployment authority. This plan never grants merge authority.
- [ ] Confirm the production secret list contains the binding name without exposing its value.
- [ ] Deploy only after green gates and security approval.
- [ ] Verify an operator gets `/auth/me` true and both tools load.
- [ ] Verify a separate guardian gets false, no entry points, and 403 from both APIs.
- [ ] Verify unauthenticated requests get 401.
- [ ] Record status/pass evidence without emails, cookies, tokens, or secret values.
- [ ] If verification fails, restore the previous Worker version. Removing/rotating the secret is a safe fail-closed action.

## Quality gate

```bash
pnpm --filter api test
pnpm --filter app test
pnpm test:scripts
pnpm --filter api typecheck
pnpm --filter app typecheck
git diff --check
```

Wave 1 exits only after security review and independent deployment verification pass.

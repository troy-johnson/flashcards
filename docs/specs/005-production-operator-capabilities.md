# Production Operator Capabilities

**Bead:** `rw-r6r`
**Planning bead:** `rw-15y`
**ADR:** [ADR 003 — Server-Authoritative Guardian Capabilities](../adrs/003-server-authoritative-guardian-capabilities.md)
**Status:** Approved (adversarial review round 3)
**Date:** 2026-07-11

> Adversarial verdict: **APPROVED** after two standard rounds and one user-approved confirmation round. Evidence: [round 1](../../.agents/snapshots/family-device-specs-adversarial-review-round-1-2026-07-11.md), [round 2](../../.agents/snapshots/family-device-specs-adversarial-review-round-2-2026-07-11.md), [round 3](../../.agents/snapshots/family-device-specs-adversarial-review-round-3-2026-07-11.md).

## Goal

Restore the designated production operator's access to Diagnostics and Audio catalog while keeping authorization server-owned, least-privileged, and fail-closed.

The current-state evidence and security rationale are documented in [`2026-07-11-family-device-qa-remediation-research.md`](../research/2026-07-11-family-device-qa-remediation-research.md). This spec adopts ADR 003.

## Scope

### Goals

- Make the API authoritative for operator-tool access.
- Return an `operator_tools` capability from the authenticated-session response.
- Show operator navigation only when that capability is true.
- Designate the production pilot operator with a Cloudflare Worker secret without committing the email address.
- Keep Diagnostics and Audio catalog routes independently protected.

### Non-goals

- A general roles or permissions system.
- An operator-management screen.
- Granting operator tools to every guardian.
- Treating hidden navigation as authorization.
- Changing Diagnostics or Audio catalog functionality.

## Required Behavior

### API contract

- For an authenticated guardian, `/auth/me` returns `capabilities: { operator_tools: boolean }` in addition to the existing session payload.
- The value is computed by the same server-owned operator policy used by the protected routes.
- Missing, empty, or whitespace-only operator configuration evaluates to false. A configured value that does not exactly match the authenticated guardian's normalized email also evaluates to false; no separate client-side or request-supplied identity participates in the decision.
- Existing unauthenticated behavior remains unchanged.
- Existing authenticated fields remain backward-compatible; the new object is additive.

### Authorization

- Diagnostics and Audio catalog routes enforce authorization on every request.
- A client-supplied capability, email, header, or route state cannot grant access.
- Both routes and `/auth/me` use one shared operator-policy function so navigation and route authorization cannot drift.
- Authorization compares the authenticated, server-resolved guardian identity with configured policy; it does not trust a request-body identity.

### Configuration

- Production receives `DIAG_GUARDIAN_EMAIL` as a Cloudflare Worker secret.
- The real operator email is never committed to source control or returned in client responses.
- Local and preview environments may use explicit placeholder values.
- Deployment documentation names the secret and the smoke-test procedure without recording its value.

### Client behavior

- The guardian shell displays Diagnostics and Audio catalog only when `operator_tools` is true.
- Ordinary guardians do not see those links.
- Direct navigation by an unauthorized guardian still produces an access-denied state from the server.
- Missing or malformed capability data is interpreted as false.

## Preserve

- Existing authentication and unauthenticated response behavior.
- Server-side protection of both operator routes.
- Current Diagnostics and Audio catalog contents and operations.
- The single designated-operator policy for the pilot.

## Acceptance Criteria

1. The configured production operator receives `operator_tools: true` and can load both protected tools.
2. Another authenticated guardian receives `operator_tools: false`, sees neither link, and receives an authorization failure from both routes.
3. Unauthenticated requests remain unauthorized.
4. Removing the secret, setting it to empty or whitespace-only text, or setting it to any non-matching value denies operator access without exposing its value.
5. Diagnostics, Audio catalog, and `/auth/me` cannot disagree about operator status for the same authenticated guardian and configuration.
6. Existing `/auth/me` consumers continue working with the additive capability field.
7. No committed file contains the production operator email.

## Verification

- Unit tests for the shared operator-policy function, including absent, empty, whitespace-only, matching, and non-matching configuration values and authorized/unauthorized guardians.
- API contract tests for `/auth/me` and both protected routes.
- Client tests for true, false, missing, and malformed capability data.
- Repository/configuration inspection confirming that the real operator email is not committed.
- Post-deployment smoke tests with an authorized account and a separate unauthorized account.

The client capability rendering can be rolled back while route enforcement remains intact. The production secret can be rotated or removed independently; removal intentionally fails closed.

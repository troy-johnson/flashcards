# ADR 003: Server-authoritative guardian capabilities

## Status

Accepted — 2026-07-11

## Context

Reader's Way has two operator-only guardian surfaces: Diagnostics and Audio catalog. Both APIs correctly enforce the same server-side rule: the authenticated guardian's email must match the configured designated operator.

The guardian UI currently cannot discover that authorization state. It displays both links to every signed-in guardian and lets the destination return `403`. During the first production family-device session, the real pilot operator was also denied because production still designated a placeholder address.

The app needs a server-authoritative way to:

- show operator tools only to the designated operator;
- keep ordinary guardians from being invited into inaccessible surfaces;
- preserve `401` for unauthenticated requests and `403` for authenticated non-operators; and
- avoid introducing a general roles/permissions system during the trusted micro-pilot.

Alternatives considered:

1. Add an operator capability to the existing `/auth/me` response.
2. Add a separate capability endpoint.
3. Keep restricted links visible and rely on destination `403` responses.
4. Infer access client-side from the guardian email or deployed configuration.

## Decision

Extend the authenticated guardian response with a server-computed capability:

```json
{
  "guardian": {
    "id": "…",
    "email": "…",
    "display_name": null
  },
  "capabilities": {
    "operator_tools": true
  }
}
```

- `/auth/me` computes `operator_tools` from the same server-owned designation policy used by Diagnostics and Audio catalog.
- The app uses this capability only to decide whether operator navigation is shown.
- Diagnostics and Audio catalog continue enforcing authorization independently on every request; hiding links is not a security control.
- Non-operators receive `operator_tools: false`.
- The response never exposes the configured operator identity or raw environment values.
- No general roles table, permissions framework, or separate capability request is introduced during the micro-pilot.
- Future privileged surfaces may reuse the capability pattern, but new capabilities require explicit specification rather than inferring permissions client-side.

## Consequences

Positive:

- Navigation reflects the same authorization policy enforced by the API.
- Ordinary guardians are not shown unusable operator destinations.
- The existing auth bootstrap request carries the capability, avoiding another network request and loading state.
- The pattern can support another explicitly approved capability without exposing configuration details.

Negative:

- `/auth/me` becomes more than an identity response and must remain stable for downstream clients.
- Authorization-policy drift is possible if capability computation and route enforcement use different predicates.
- Navigation may shift while authentication loads unless the shell reserves or deliberately handles the pending state.
- A capability boolean is intentionally less expressive than a general permission model.

Guardrails:

- Server routes remain the authoritative security boundary.
- Capability computation and route enforcement must share one policy function and regression tests.
- Unknown or missing capabilities fail closed in the client.
- The capability must not encode or reveal the designated operator's email.
- Production verification must cover unauthenticated, ordinary guardian, and designated operator accounts.
- Expanding beyond this bounded operator capability requires a new spec or ADR.

## Evidence

- Research: [`2026-07-11-family-device-qa-remediation-research.md`](../research/2026-07-11-family-device-qa-remediation-research.md)
- Source issues: `rw-r6r`, `rw-15y`
- Security basis: `NIST-800-53-AC6` in [`docs/research/SOURCES.md`](../research/SOURCES.md)

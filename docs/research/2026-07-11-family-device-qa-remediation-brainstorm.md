# Brainstorm: Family-device QA remediation

**Date:** 2026-07-11
**Active bead:** `rw-15y`
**Research:** [`2026-07-11-family-device-qa-remediation-research.md`](2026-07-11-family-device-qa-remediation-research.md)
**Specs to draft:** 004 guardian mobile shell and flows; 005 production operator access; 006 caregiver-ready PA instructions

## Purpose

Resolve the design choices surfaced by the first production family-device session before writing requirements. The outcome must preserve the trusted-pilot architecture, avoid expanding into the full educator-wave polish scope, and remain testable at 375/768/1280 widths.

## Spec 004 direction: guardian mobile shell and flows

### Mobile guardian header

| Approach | Tradeoff | Disposition |
| --- | --- | --- |
| One-row Reader's Way identity plus a labeled Menu button at phone width; inline navigation at wider widths | Adds disclosure state and menu interaction tests, but produces the most compact branded phone shell while retaining predictable destinations and touch targets | **Chosen** |
| Two compact rows with identity/sign-out above always-visible links | Keeps every destination visible, but repeats the height/wrapping pressure observed in production | Rejected |
| Bottom navigation plus a brand header | Familiar on mobile, but creates a second navigation model, complicates restricted operator links, and consumes persistent child-device space | Rejected |

The phone menu contains Students, capability-authorized operator links, and Sign out. The app name comes from centralized `productName`. The desktop/tablet header keeps the same relative destination order with inline navigation.

### Student-creation completion

| Approach | Tradeoff | Disposition |
| --- | --- | --- |
| Redirect to `/guardian`, announce success accessibly, and visually identify the new student | Matches the canonical journey and makes the state change unmistakable; requires one-time transition state and focus handling | **Chosen** |
| Redirect directly to the new student's dashboard | Minimizes taps to practice but hides the updated family roster and contradicts the owner-requested guardian-home destination | Rejected |
| Redirect to guardian home with no separate confirmation | Simple, but the new row alone can be missed and does not clearly communicate submission success | Rejected |

Failure remains on the form with entered values preserved and a programmatic alert.

### Practice exit semantics

| Approach | Tradeoff | Disposition |
| --- | --- | --- |
| Return to the student dashboard while preserving the unfinished session for same-card resume; do not count completion | Preserves work and telemetry meaning without requiring a new abandon API; needs explicit regression tests for persisted session state | **Chosen** |
| Confirm and abandon the session | Clear finality but discards work and requires explicit server/local abandonment semantics | Rejected |
| Treat early exit as completion | Easy to implement but corrupts completion telemetry and mastery interpretation | Rejected |

### Practice exit presentation

| Approach | Tradeoff | Disposition |
| --- | --- | --- |
| Quiet, always-visible “Exit practice” control with a touch-safe hit region | Discoverable and immediate while avoiding the full guardian shell; adds one low-emphasis element to child mode | **Chosen** |
| Guardian-controls disclosure containing Exit | Reduces visible chrome but adds a second action and a less obvious recovery path | Rejected |
| Always confirm after selecting visible Exit | Prevents accidental exit but adds interruption to a reversible, resumable action | Rejected |

## Spec 005 direction: production operator access

### Capability discovery

| Approach | Tradeoff | Disposition |
| --- | --- | --- |
| Add `capabilities.operator_tools` to `/auth/me` | Reuses auth bootstrap and prevents a second loading state; makes the auth response a stable capability contract | **Chosen; ADR 003** |
| Add a separate capabilities endpoint | Keeps identity response narrow but adds a request, cache/error state, and navigation flicker | Rejected |
| Keep links visible and rely on `403` | Server-safe but repeats the confusing production failure | Rejected |
| Infer access client-side from email/config | Avoids API work but duplicates and exposes authorization policy; not server-authoritative | Rejected |

Diagnostics and Audio catalog retain independent request authorization. Unknown/missing capability values fail closed in navigation.

### Production designation storage

| Approach | Tradeoff | Disposition |
| --- | --- | --- |
| Store production `DIAG_GUARDIAN_EMAIL` as a Cloudflare Worker secret; keep local/preview placeholders | Avoids committing the owner's email and preserves the bounded exact-email gate; requires explicit secret/deploy verification | **Chosen** |
| Commit the real email as a production variable | Simple and reproducible but publishes personal configuration in version control | Rejected |
| Add a database role/flag | More scalable but introduces schema, administration, and role semantics beyond the micro-pilot | Rejected |

## Spec 006 direction: caregiver-ready PA instructions

### Authored content contract

| Approach | Tradeoff | Disposition |
| --- | --- | --- |
| Add explicit `guardian_script`, `student_task`, and `answer` fields for PA items | Makes participant roles testable and reusable across blending/segmenting; expands the content and plan-card contract | **Chosen** |
| Add one free-form guardian script plus answer | Smaller schema but allows roles to blur again inside prose | Rejected |
| Rewrite only the current generic prompt | Fastest but preserves an ambiguous contract and repeats the problem when PA content expands | Rejected |

The UI distinguishes the adult's script, the child's action, and the expected response. Exact wording remains authored content, not brand copy.

### Legacy practice compatibility

| Approach | Tradeoff | Disposition |
| --- | --- | --- |
| Require new fields for canonical PA content while rendering saved legacy prompt/answer cards through a safe fallback | Preserves active local/server sessions without weakening the new authoring gate | **Chosen** |
| Discard and regenerate legacy sessions | Simplifies rendering but loses progress and can surprise the family mid-session | Rejected |
| Migrate persisted server and local sessions | Produces one shape but adds risky data/localStorage migration for a single current item | Rejected |

### Instructional approval

| Approach | Tradeoff | Disposition |
| --- | --- | --- |
| Owner/curriculum review before the family wave; SLP review before the educator wave | Supports immediate creator-family learning while preserving the existing higher-confidence educator gate | **Chosen** |
| Require SLP approval before family use | Highest pre-use confidence but blocks the creator-family feedback loop and duplicates the two-wave model | Rejected |
| Owner review for both waves | Fast but removes the independent instructional review expected before educator exposure | Rejected |

## Cross-spec assumptions

- The current history-based client router remains in place; adding a routing dependency is outside scope.
- Existing production session behavior already supports loading a saved practice at its current card; the plan must regression-test rather than redesign that behavior.
- The production operator remains one exact guardian identity during the micro-pilot.
- Audio modeling stays in `rw-1gz.8.2`; this work improves visual/scripted instructions only.
- Spec 002 plan 002h still owns the broad educator-wave accessibility pass; these specs own only observed family-wave failures and their direct regression coverage.

## Remaining implementation questions for plans

- Whether the mobile menu uses a popover, disclosure region, or other dependency-free DOM pattern; the spec will require behavior and accessibility outcomes, not a particular visual primitive.
- How one-time post-create confirmation is passed through the current history helper without persisting stale state across reloads.
- Where the shared operator predicate lives so `/auth/me`, Diagnostics, and Audio catalog cannot drift.
- How the production secret is checked during deployment without printing its value.
- How the PA legacy fallback is represented in TypeScript so old `plan_json` and localStorage remain readable while canonical content validation is strict.

## ADR assessment

The chosen server-authoritative capability contract has durable cross-cutting implications and is captured in [ADR 003](../adrs/003-server-authoritative-guardian-capabilities.md). The other choices remain bounded product/spec decisions and do not require standalone ADRs.

## Self-review

- Three ownership boundaries remain separate.
- Each decision documents at least two alternatives and explicit tradeoffs.
- No choice broadens operator access or creates a general role system.
- No choice adds audio, clinical assessment, automatic scoring, or the full educator-wave polish scope.
- All research unknowns are either resolved here or narrowed to implementation questions that do not change required outcomes.

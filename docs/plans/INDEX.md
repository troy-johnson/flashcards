# Plans Index

Implementation plans paired with specs. Numbered as `<spec#><letter>` (e.g., `001a`, `001b`) so a single spec can decompose into multiple shippable plans.

| # | Slug | Status | Date | Summary |
|---|------|--------|------|---------|
| 002d | [phase-a-email-provider](002d-phase-a-email-provider.md) | drafted — ready to implement | 2026-06-06 | Add a `resend` transactional magic-link issuer behind the ADR-001 abstraction (FR19/22/23, AC3). Beads epic `rw-1gz.7`. |
| 002c | phase-a-scheduler-practice | **shipped** (PR #21, #23) | 2026-06-03 | Scheduler/practice replacing the hardcoded stub: grade-aware K start, 1st-grade review advancement, mastery updates, and the 1st-grade review-exhausted terminal reason at the start route. |
| 002b | phase-a-telemetry | **shipped** (PR #19) | 2026-05-30 | Complete-session endpoint and gated diagnostic telemetry report for sessions, completion, duration, and friction items. |
| 002a | phase-a-copy-package | **shipped** (PR #22) | 2026-05-30 | Shared `packages/copy` workspace module for Reader's Way brand/UI chrome used by app and magic-link email. |
| 001a | literacy-app-v1 | shipped | 2026-05-17 | First previewable foundation slice with per-task payloads for workspace scripts, Wrangler/D1, content validation, magic-link auth, guardian-tap API/app loop, mandatory PR gates, telemetry, and replay scaffold. |

## Remaining Spec 002 workstreams (tracked in Beads; plan docs to follow)

| Beads | Workstream | Spec coverage | Status |
|---|---|---|---|
| rw-1gz.7 | Transactional email provider (Resend) | FR19/22/23, AC3 | plan drafted (002d) |
| rw-1gz.8 | v1.0 content bar | FR16–18, AC11–12 | epic only — plan pending |
| rw-1gz.9 | Public landing page | FR24–26, AC13 | epic only — plan pending |
| rw-1gz.10 | Privacy Policy & Terms + contact route | FR27–29/37–39, AC14/18–19 | epic only — plan pending |
| rw-1gz.11 | Pilot UI polish & accessibility | FR33–36, AC16–17 | epic only — plan pending (after .9 + .10) |

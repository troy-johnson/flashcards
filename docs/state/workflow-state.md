# Workflow State

**Active Phase:** Spec 002 — remaining-scope PLANNING on branch `plan/002-remaining-planning`. Shipped to main: copy (002a/#22), telemetry (002b/#19), scheduler+terminal-reason (002c/#21,#23), completion-failure test (#24). Remaining 002 broken into Beads epics A–E; email-provider plan (002d) drafted.  
**Active Branch:** plan/002-remaining-planning (off main)
**Active Artifacts:** docs/plans/002d-phase-a-email-provider.md; docs/plans/INDEX.md; docs/specs/002-readers-way-phase-a-micro-pilot.md; Beads: rw-1gz (Phase A epic) and children rw-1gz.7–.11  
**Current Gate:** Remaining Spec 002 scope mapped (delivered vs remaining) and tracked in Beads: rw-1gz.7 email provider (FR19/22/23, AC3) — plan 002d drafted with task beads rw-1gz.7.1–.3; rw-1gz.8 v1.0 content bar (FR16–18, AC11–12); rw-1gz.9 landing page (FR24–26, AC13); rw-1gz.10 privacy/terms + contact (FR27–29/37–39, AC14/18–19); rw-1gz.11 UI polish & a11y (FR33–36, AC16–17, blocked-on .9+.10). Recommended sequence: A+B → C/D → E. Also filed niceties rw-1gz.5 (all-caught-up UI) and rw-1gz.6 (onboarding copy wiring).  
**Blockers:** none. Open P3/nicety beads: rw-1gz.4 (completion-failure test — DONE/merged via #24), rw-1gz.5, rw-1gz.6.  
**Next Action:** merge this planning branch, then implement email provider (002d) starting with `rw-1gz.7.1` (widen issuer env typings) → `rw-1gz.7.2` (resend issuer, TDD) → `rw-1gz.7.3` (deploy config).  
**Active Snapshot Pointer:** branch `plan/002-remaining-planning`; remaining-002 epics created and email plan (002d) drafted; awaiting PR.

## Spec 002 review gate (all 3 rounds)

- **Round 1** (scope): 3 planning nits carried forward → resolved in planning-nits doc — `packages/copy` TS module (brand chrome only); 1st-grade advance = per-skill accuracy ≥ 90% over ≥ 4 attempts, automaticity recorded not gated; telemetry reuses `practice_session`/`attempt` + complete-session endpoint + extended `diag` JSON report.
- **Round 2** (doc consistency): numbering/cross-refs verified clean; ADR-001 link resolved by branch update from main.
- **Round 3** (testability & coverage), commit a0a51f7 — all 6 resolved in spec body:
  - 8. AC11 now keys to content manifest + AC12 validation gate (not "approximately").
  - 9. AC17 extended to verify WCAG 2.1 AA contrast, reduced-motion, SR practice status messaging.
  - 10. New §5 Soft Exit Markers: ≥10 creator sessions over ≥2 weeks; ≥2 non-creator households (≥4 sessions each or structured feedback); 1 operator telemetry/support review.
  - 11. FR16 gains audio assumptions: target iPadOS Safari + current desktop/mobile Chrome/Safari; gesture-initiated playback; verify TTS per-platform.
  - 12. FR8 states no K fast-advance; advanced K readers handled via manual support.
  - 13. New §12 bullet: Phase A relies on trusted-pilot boundary, not COPPA/FERPA consent; broadening reopens NG7.

> This file is a current pointer, not a full session log.

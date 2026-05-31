# Workflow State

**Active Phase:** Spec 002 Round 3 review resolved — spec ready for owner review/merge
**Active Branch:** docs/phase-a-planning-nits
**Active Artifacts:** docs/specs/002-readers-way-phase-a-micro-pilot.md; docs/specs/002-readers-way-phase-a-micro-pilot.adversarial-review.md; docs/specs/002-readers-way-phase-a-micro-pilot.planning-nits.md; docs/specs/INDEX.md; https://github.com/troy-johnson/flashcards/pull/18
**Current Gate:** PR #18 is open and mergeable. Spec 002 verdict `APPROVED WITH NITS` across 3 review rounds. Round 1 planning nits (1–3) resolved in planning-nits doc; Round 3 nits (8–13) resolved in spec body at commit a0a51f7.
**Blockers:** none
**Next Action:** owner review/merge PR #18, then turn the planning-nits decisions + Round 3 outcomes into the implementation plan alongside the scheduler/practice build. Implementation plans already drafted: docs/plans/002-phase-a-copy-package.md, docs/plans/002-phase-a-telemetry.md.
**Active Snapshot Pointer:** PR #18 (`docs/phase-a-planning-nits`)

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

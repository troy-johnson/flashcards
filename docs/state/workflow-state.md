# Workflow State

**Active Phase:** Telemetry plan (002b) implementation in progress (implement-tdd) on branch `plan/002b-telemetry` (off main). Sequenced before scheduler Wave 4, which depends on telemetry Task 3.
**Active Branch:** plan/002b-telemetry
**Active Artifacts:** docs/plans/002-phase-a-telemetry.md; docs/plans/002-phase-a-scheduler-practice.md; docs/specs/002-readers-way-phase-a-micro-pilot.md
**Current Gate:** Telemetry Tasks 1–3 of 5 COMPLETE (RED/GREEN per task). Task 1: `POST /practice/:studentId/complete` (idempotent, ownership-gated). Task 2: `GET /guardian/diag` extended with `sessions` + `friction` aggregates (additive). Task 3: app `completePractice` client + DrillRoute end-of-session call (best-effort, try/catch) — **this unblocks scheduler Wave 4**. api suite 13 green, app suite 13 green, both typecheck clean.
**Blockers:** none. (Scheduler branch `plan/002c-scheduler-practice` still 20 commits ahead of main, unmerged; its Wave 4 awaits this telemetry landing on main, then a rebase.)
**Next Action:** implement telemetry Task 4 (surface session/friction aggregates in GuardianDiagRoute) then Task 5 (full-workspace verification), then open the 002b PR.
**Active Snapshot Pointer:** branch `plan/002b-telemetry` at telemetry Task 3 GREEN; tree clean

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

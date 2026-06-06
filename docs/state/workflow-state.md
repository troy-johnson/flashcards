# Workflow State

**Active Phase:** Spec 002 scheduler/practice (Plan 002c) — Waves 1–5 COMPLETE; adversarial PR/QA gate is READY. Operational tracking now lives in **Beads** (`bd`, prefix `rw`); epic `rw-1gz.1` (Scheduler & practice).  
**Active Branch:** plan/002c-scheduler-practice (rebased onto main — includes Beads tracker + telemetry `completePractice` contract)
**Active Artifacts:** docs/plans/002-phase-a-scheduler-practice.md; docs/plans/002-phase-a-scheduler-practice.adversarial-review.md; docs/specs/002-readers-way-phase-a-micro-pilot.md (+ .planning-nits.md); Beads: rw-1gz (Phase A epic), rw-1gz.1 (scheduler epic)  
**Current Gate:** Waves 1–5 COMPLETE on branch `plan/002c-scheduler-practice`. Wave 1: content loader + review-rule helper. Wave 2: `api/src/scheduler/planner.ts` (buildPracticePlan, injected-content seam) + mastery upsert in `api/src/routes/practice.ts` (single D1 batch); Wave 2 adversarial Round 1 BLOCK resolved (BLOCK 1–3 fixed, IMPORTANT 4 documented, IMPORTANT 5 deferred, IMPORTANT 6 pushed back). Wave 3: route integration (grade-aware start plans, full review history retained). Wave 4 (verify-only, `rw-1gz.1.1` CLOSED): play.test.tsx uses telemetry's `completePractice` mock + contract, asserts call + navigation to `/play/student1/done`. Wave 5: adversarial review recorded in `.agents/snapshots/scheduler-adversarial-review-2026-06-06.md` with verdict **APPROVED WITH NITS**. Full reviewer gate green: tsc clean, **api 46 tests**, **app 13 tests**, content validation clean, app build clean.  
**Blockers:** none. Open Beads follow-ups: `rw-1gz.1.3` (deferred — surface 1st-grade empty-plan terminal reason at route/HTTP layer, IMPORTANT 5), `rw-1gz.4` (P3 — assert completion-failure best-effort in play.test.tsx, discovered in Wave 4).  
**Next Action:** return to Claude Code for normal branch/PR hygiene and merge readiness handling; merge is allowed on the recorded `APPROVED WITH NITS` verdict.  
**Active Snapshot Pointer:** `.agents/snapshots/scheduler-adversarial-review-2026-06-06.md`; branch `plan/002c-scheduler-practice` rebased onto main; Wave 5 adversarial gate complete.

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

# Workflow State

**Active Phase:** Spec 002 scheduler/practice plan APPROVED WITH NITS (nits resolved) — ready for implementation (implement-tdd)  
**Active Branch:** plan/002c-scheduler-practice
**Active Artifacts:** docs/specs/002-readers-way-phase-a-micro-pilot.md; docs/specs/002-readers-way-phase-a-micro-pilot.adversarial-review.md; docs/specs/002-readers-way-phase-a-micro-pilot.planning-nits.md; docs/plans/002-phase-a-copy-package.md; docs/plans/002-phase-a-telemetry.md; docs/plans/002-phase-a-scheduler-practice.md; docs/plans/002-phase-a-scheduler-practice.adversarial-review.md; docs/plans/INDEX.md; https://github.com/troy-johnson/flashcards/pull/18  
**Current Gate:** Waves 1–2 COMPLETE on branch `plan/002c-scheduler-practice`. Wave 1 (Tasks 1–4): `api/src/scheduler/content.ts`+`content.test.ts` (loadSchedulerContent, 9 tests), `api/src/scheduler/review.ts`+`review.test.ts` (evaluateReviewSkill, 6 tests). Wave 2 (Tasks 5–8): `api/src/scheduler/planner.ts`+`planner.test.ts` (buildPracticePlan, 4 tests, K no-fast-advance invariant covered), mastery upsert in `api/src/routes/practice.ts` (single D1 batch: attempt INSERT + skill/item upserts) with transitions in `practice.test.ts`. Full api suite green (32 tests), tsc clean. **Wave 2 requires adversarial review before Wave 3** (learning-progression core) — gate NOT yet cleared.  
**Blockers:** Wave 3 blocked on Wave 2 adversarial review. Wave 4 (app completion compatibility check) depends on `docs/plans/002-phase-a-telemetry.md` Task 3 merging first.  
**Next Action:** run adversarial review of the Wave 2 learning-progression core (planner + mastery upsert). After it clears, get owner approval for Wave 3 (route integration, Tasks 9–10). Sequence telemetry (002b) Task 3 before scheduler Wave 4.  
**Active Snapshot Pointer:** branch `plan/002c-scheduler-practice` (off main after merged PR #18) holding the scheduler/practice plan commit 81f6840 and the Round 1–3 adversarial review packet (002-phase-a-scheduler-practice.adversarial-review.md); clean tree, Wave 1 not yet started

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

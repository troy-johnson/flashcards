# Workflow State

**Active Phase:** Spec 002 — plans INDEPENDENTLY reviewed (Sonnet subagents) + revisions applied on branch `plan/002-sonnet-review-revisions`. All Phase A workstreams planned (002d–002h); 002a/b/c shipped.  
**Active Branch:** plan/002-sonnet-review-revisions (off main)
**Active Artifacts:** docs/plans/002d–002h; docs/adrs/002-phase-a-audio-strategy.md; docs/plans/INDEX.md; .agents/snapshots/plans-002d-h-adversarial-review-2026-06-07.md; Beads: rw-1gz + children  
**Current Gate:** Independent adversarial review of 002d–002h + ADR-002 by 3 read-only **Sonnet** subagents (verified vs code). Verdict APPROVED WITH NITS — all five plans revised (no scope change). Key corrections: (1) **002d test was wrong** — `vi.stubGlobal("fetch")` doesn't patch fetch in the workers pool → switched to **`fetch` dependency-injection**; (2) **FR13 + FR15 were unhomed** → assigned to 002h (drill/completion copy audit); (3) **AC20 untracked** → 002h verification; (4) **`support.email` missing** in packages/copy → 002f Task 1 extends `support`, 002g depends on it; (5) 002e: fix `allPassed` fixtures in planner.test.ts+practice.test.ts, audio count = real-`src` only (schema before count), validator must glob if items split, `v1_target` immutable; (6) 002h: add missing surfaces (diag/settings/dashboard) + axe `setupFiles` + own ADR-002 device QA; (7) order **002g before/with 002f**; pilot for 1st-grade gated on 002e Phase 2. Full detail per plan's "Review revisions" section + the snapshot packet. rw-1gz.14 closed.  
**Blockers:** none.  
**Next Action:** merge this revisions branch, then begin implementation — recommended order: 002d (email, `rw-1gz.7.1`) + 002e Phase 1 (`rw-1gz.8.1`) → 002g then 002f → 002h last.  
**Active Snapshot Pointer:** branch `plan/002-sonnet-review-revisions`; Sonnet review packet + per-plan revisions applied; awaiting PR.

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

# Workflow State

**Active Phase:** Spec 002 copy package (Plan 002 copy-package) — implementation COMPLETE on branch `plan/002d-copy-package`; PR/merge pending. Scheduler/practice (002c) shipped to main (PR #21). Beads epic `rw-1gz.2` (Copy package), in_progress.  
**Active Branch:** plan/002d-copy-package (off main)
**Active Artifacts:** docs/plans/002-phase-a-copy-package.md; docs/specs/002-readers-way-phase-a-micro-pilot.md (+ .planning-nits.md); packages/copy/index.ts; Beads: rw-1gz (Phase A epic), rw-1gz.2 (copy package)  
**Current Gate:** Copy package Tasks 1–4 COMPLETE on branch `plan/002d-copy-package`. Task 1: `packages/copy` workspace package (typed brand/UI chrome constants, single source of truth). Task 2: app LandingRoute hero reads from `copy` (+ cross-package resolution test). Task 3: `buildMagicLinkEmail` composes subject/body from `copy`; dev-log issuer logs it (RED→GREEN; auth test URL extractor updated for multi-line body). Task 4: full gate green — tsc app+api, **app 15 tests**, **api 48 tests**, content:validate ok, grep guard clean (no stray "Literacy practice"). FR1–FR3/AC1/AC2 covered. Low-risk (brand strings); no mandatory adversarial gate per plan.  
**Blockers:** none. Open Beads follow-ups: `rw-1gz.1.3` (deferred — 1st-grade empty-plan terminal reason at route layer), `rw-1gz.4` (P3 — completion-failure best-effort test). Onboarding copy constants exported but not yet wired (optional, not AC-required).  
**Next Action:** push `plan/002d-copy-package`, open the copy-package PR to main, confirm CI green, then merge and close `rw-1gz.2`.  
**Active Snapshot Pointer:** branch `plan/002d-copy-package` (3 feature commits off main); tree clean except this checkpoint; copy package implemented and gate-green, awaiting PR.

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

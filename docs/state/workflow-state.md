# Workflow State

**Active Phase:** Spec 002 — 1st-grade terminal-reason follow-up (`rw-1gz.1.3`) IMPLEMENTED on branch `plan/002e-terminal-reason`; PR/merge pending. Telemetry (002b), scheduler/practice (002c), copy package (002) all shipped to main.  
**Active Branch:** plan/002e-terminal-reason (off main)
**Active Artifacts:** api/src/scheduler/planner.ts (planTerminalReason); api/src/routes/practice.ts; docs/specs/002-readers-way-phase-a-micro-pilot.md; Beads: rw-1gz (Phase A epic)  
**Current Gate:** `rw-1gz.1.3` complete on `plan/002e-terminal-reason`. Added `planTerminalReason()` to the scheduler; `POST /practice/:studentId/start` now returns `terminal_reason: "review_complete_no_active_content"` when a 1st grader has review-passed every K skill (empty plan; no authored 1st-grade active content). Absent for normal/K starts. Covered by route tests (positive + negative) and planner unit tests. Gate green: tsc app+api, **app 15 tests**, **api 53 tests**, content:validate ok. Resolves Wave 2 review IMPORTANT 5.  
**Blockers:** none. Open Beads follow-up: `rw-1gz.4` (P3 — completion-failure best-effort test in play.test.tsx). Optional: wire app to show "all caught up" on `terminal_reason` (not yet done).  
**Next Action:** push `plan/002e-terminal-reason`, open the PR to main, confirm CI green, then merge and (epic `rw-1gz.1` then has no open children) consider closing the scheduler epic.  
**Active Snapshot Pointer:** branch `plan/002e-terminal-reason` (1 feature commit off main); terminal-reason implemented and gate-green, awaiting PR.

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

# Workflow State

**Active Phase:** Spec 002 — roadmap planned + ADVERSARIALLY REVIEWED; revisions applied on branch `plan/002-plan-review-revisions`. All Phase A workstreams planned (002d–002h shipped-ready); 002a/b/c shipped.  
**Active Branch:** plan/002-plan-review-revisions (off main)
**Active Artifacts:** docs/plans/002d-phase-a-email-provider.md; docs/plans/002e-phase-a-content-bar.md; docs/adrs/002-phase-a-audio-strategy.md; docs/plans/INDEX.md; Beads: rw-1gz + children .7–.13  
**Current Gate:** Adversarial review of drafted plans (002d–002h + ADR-002) run in-thread (subagents were quota-blocked). Verdict: roadmap COMPLETE & consistent; 002f/g/h SOUND; 002d + 002e needed revision — now applied: (1) 002d test mocks outbound via `vi.stubGlobal("fetch")` not `cloudflare:test` fetchMock (hand-written d.ts only exports env/SELF); (2) 002e Task 4 reframed — **app audio playback is net-new** (build asset loader + Web Speech TTS + gesture gating; manifest needs a `src` field), consider its own sub-plan; (3) 002e Task 3 — if items split, update validator (hard-reads seed.json); (4) 002e Task 5 — planner.test.ts/practice.test.ts assertions WILL break, update them; (5) manifest carries `v1_target` (fixed AC11 anchor) + `required_now` so AC11 can't be gamed; (6) ADR-002 notes audio layer is net-new + asset-path schema. Review notes added to rw-1gz.8.1/.8.2.  
**Blockers:** none.  
**Next Action:** merge this revisions branch, then begin implementation — recommended order: 002d (email, `rw-1gz.7.1`) + 002e Phase 1 (`rw-1gz.8.1` manifest+validator) → 002f/002g → 002h last.  
**Active Snapshot Pointer:** branch `plan/002-plan-review-revisions`; 002d/002e/ADR-002 revised per adversarial review; awaiting PR.

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

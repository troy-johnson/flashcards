# Workflow State

**Active Phase:** Spec 002 — content-bar PLANNING on branch `plan/002e-content-bar-planning`. Shipped to main: copy (002a/#22), telemetry (002b/#19), scheduler+terminal-reason (002c/#21,#23), completion-failure test (#24), remaining-scope planning (#25). Plans drafted: email (002d), content bar (002e). Spec-002 open items triaged + filed as beads.  
**Active Branch:** plan/002e-content-bar-planning (off main)
**Active Artifacts:** docs/plans/002e-phase-a-content-bar.md; docs/adrs/002-phase-a-audio-strategy.md; docs/plans/002d-phase-a-email-provider.md; docs/plans/INDEX.md; docs/adrs/INDEX.md; Beads: rw-1gz + children .7–.13  
**Current Gate:** Spec 002 open items triaged (register) and filed as beads under their workstreams: content bar `rw-1gz.8` → .8.1 manifest/validator, .8.2 audio, .8.3 authoring, .8.4 1st-grade U1 (Phase 2); polish `rw-1gz.11` → .11.1 a11y verification method, .11.2 sanity breakpoints; email `rw-1gz.7.4` rate-limit; `rw-1gz.12` multi-child verify; `rw-1gz.13` exit-marker diag reads. Content-bar plan (002e) drafted: **phased K U1–2 first, 1st-grade U1 second**; content manifest + validator count gate makes AC11 binary; audio per **ADR-002** (real phoneme/digraph assets + TTS fallback + gesture playback); LLM-assisted authoring for pilot (hand-author long-term). Deferred (later phases): OQ1–6.  
**Blockers:** none.  
**Next Action:** merge this planning branch, then implement — recommended order email provider (002d, `rw-1gz.7.1`→.7.3) and/or content bar Phase 1 (002e, `rw-1gz.8.1` manifest+validator first).  
**Active Snapshot Pointer:** branch `plan/002e-content-bar-planning`; ADR-002 + 002e plan + open-item beads created; awaiting PR.

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

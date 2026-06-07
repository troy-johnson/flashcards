# Workflow State

**Active Phase:** Spec 002 — ROADMAP COMPLETE (planning) on branch `plan/002-roadmap-remaining-plans`. Every Phase A workstream now has a plan. Shipped to main: 002a/b/c (+#24/#25/#26 planning). Drafted, ready to implement: 002d email, 002e content bar (+ADR-002), 002f landing, 002g privacy/terms, 002h polish.  
**Active Branch:** plan/002-roadmap-remaining-plans (off main)
**Active Artifacts:** docs/plans/002f-phase-a-landing-page.md; docs/plans/002g-phase-a-privacy-terms.md; docs/plans/002h-phase-a-ui-polish-a11y.md; docs/plans/INDEX.md; Beads: rw-1gz + children .7–.13  
**Current Gate:** Phase A roadmap fully planned. Plans: 002d (email, rw-1gz.7), 002e (content bar, rw-1gz.8, +ADR-002), 002f (landing, rw-1gz.9), 002g (privacy/terms+contact, rw-1gz.10), 002h (polish & a11y, rw-1gz.11). Decisions locked: content phased K-first; audio=real phoneme assets+TTS fallback+gesture (ADR-002); LLM authoring for pilot; contact=support email mailto (copy constant); landing invite-only (no waitlist); privacy/terms LLM-drafted for owner review. Open items all triaged into beads; later-phase OQ1–6 deferred.  
**Blockers:** none.  
**Next Action:** merge this planning branch, then begin implementation — recommended order: 002d (email, `rw-1gz.7.1`) + 002e Phase 1 (`rw-1gz.8.1` manifest+validator) → 002f/002g → 002h last.  
**Active Snapshot Pointer:** branch `plan/002-roadmap-remaining-plans`; 002f/g/h plans + landing/legal task beads created; INDEX shows full roadmap; awaiting PR.

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

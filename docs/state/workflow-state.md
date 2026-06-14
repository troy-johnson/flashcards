# Workflow State

**Active Phase:** 002e — validator test isolation done (rw-cvr + rw-8ea); awaiting ship-sync decision.
**Active Branch:** plan/rw-cvr-validator-test-isolation
**Active Bead:** none (rw-cvr + rw-8ea closed)
**Active Artifacts:** local changes in `scripts/content-validate.ts` and `scripts/content-validate.test.ts`; PR #36 MERGED (squash 812154a)
**Current Gate:** Local verification green; not committed, pushed, or opened as a PR under conservative workflow.
**Next ready work:**
- rw-1gz.8.4 (P2) — 1st-grade Unit 1 content + scheduler (Phase 2); NOW UNBLOCKED. The next content milestone; blocks rw-1gz.8.2 (audio).
- rw-brf (P3) — rw-385 nits: validate grade field values + positive grade-ordering test (non-blocking; pairs naturally with rw-1gz.8.4 since that's when multi-grade scope first exists).
**Blockers (downstream):** rw-1gz.8.2 (audio) still blocked by rw-1gz.8.4.
**Active Snapshot Pointer:** bd closed issues rw-cvr + rw-8ea

> Resumability pointer only. Beads (`bd`) is the canonical work tracker; use `bd ready` for work and `bd list --status=closed` for completed work.

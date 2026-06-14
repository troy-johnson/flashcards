# Workflow State

**Active Phase:** 002e — validator hardening merged (rw-385). No active bead; selecting next.
**Active Branch:** main
**Active Bead:** none (rw-385 closed)
**Active Artifacts:** PR #36 MERGED (squash 812154a); .agents/snapshots/rw-385-adversarial-review-2026-06-14.md + rw-385-independent-adversarial-review-2026-06-14.md
**Current Gate:** None — PR #36 merged (two adversarial passes, both APPROVED WITH NITS).
**Next ready work:**
- rw-1gz.8.4 (P2) — 1st-grade Unit 1 content + scheduler (Phase 2); NOW UNBLOCKED (both deps closed). The next content milestone; blocks rw-1gz.8.2 (audio).
- rw-cvr (P2) + rw-8ea (P3) — isolate validator tests from real content files (fix together).
- rw-brf (P3) — rw-385 nits: validate grade field values + positive grade-ordering test (non-blocking; pairs naturally with rw-1gz.8.4 since that's when multi-grade scope first exists).
**Blockers (downstream):** rw-1gz.8.2 (audio) still blocked by rw-1gz.8.4.
**Active Snapshot Pointer:** .agents/snapshots/rw-385-independent-adversarial-review-2026-06-14.md

> Resumability pointer only. Beads (`bd`) is the canonical work tracker; use `bd ready` for work and `bd list --status=closed` for completed work.

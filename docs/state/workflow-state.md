# Workflow State

**Active Phase:** Spec 003 / plan 003a audio assets + playback — design approved; Task 2 (schema-v2 manifest split, PR #41) and Task 3 (canonical sound/pattern schemas, PR #42) merged; next implementation step is Task 4 deterministic manifest/staging.
**Active Branch:** base after PR #42 merge commit `4be54d3`; create a new `plan/rw-1gz-8-2-*` branch before Task 4 work.
**Active Bead:** rw-yyl — Task 4 master-asset byte verification + public audio staging projection (child of `rw-1gz.8.2`)
**Active Artifacts:**
- `docs/specs/003-audio-assets-playback.md`
- `docs/research/2026-06-21-audio-inventory-and-architecture-research.md`
- `docs/research/2026-06-21-audio-inventory-slp-review-packet.md`
- `docs/research/SOURCES.md`
- `docs/plans/003a-audio-assets-playback.md`
- `content/audio/sounds.json` (44), `content/audio/patterns.json` (12), `scripts/audio-schema.ts`
**Current Gate:** PASSED for Task 3. PR #42 had two subagent + two Codex CLI review rounds (all P2/P3 findings resolved), CI-green, explicitly approved, squash-merged; feature branch deleted local+remote. `rw-1gz.8.6` closed (folded in). Task 4 is authorized next.
**Next work:**
- Claim `rw-yyl` and execute `docs/plans/003a-audio-assets-playback.md` Task 4: deterministic public runtime manifest + `stageAudioAssets` (app/public/audio projection), plus master-asset byte verification. Playback-asset byte verification (file existence + sha256 + traversal-safe) already landed in Task 3.
- Phase 0 is the real-iPad TTS spike; its evidence blocks final TTS implementation, not Task 4 staging work.
- Seek SLP review of the inventory/production guide before recording if scheduling permits. If unavailable, recording and protected catalog QA may proceed under explicit risk acceptance; learner-facing use remains blocked pending checksum-bound approval.
**Blockers:** none for Task 4 staging work. External dependencies remain for Phase 0 device evidence, physical recording, and SLP approval.
**Active Snapshot Pointer:** `.agents/snapshots/rw-1gz-8-2-design-adversarial-review-round-3-2026-06-21.md`.

> Resumability pointer only. Beads (`bd`) is the canonical work tracker; use `bd ready` for work and `bd list --status=closed` for completed work.

# PR #130 adversarial review

**Target:** PR #130, `plan/rw-ozz-audio-recording` at `674a125`

**Profile:** `docs/mechanical` with operational-executability and policy-coherence lenses

**Date:** 2026-07-14

**Verdict:** **BLOCKED**

## Reviewers

1. `vercel/zai/glm-5.2` via OpenCode/Vercel, high effort, fresh sealed-context run.
   Lens: zero-context recording-session execution and audio-pipeline compatibility.
   Raw verdict: **APPROVED WITH NITS**.
2. `vercel/moonshotai/kimi-k2.7-code` via OpenCode/Vercel, high effort, fresh pure-mode
   sealed-context run. Lens: canonical consistency, policy coherence, and failure modes.
   Raw verdict: **BLOCKED**.

The first two Kimi invocations returned no usable verdict. Those outputs were discarded. The
accepted Kimi evidence is a fresh pure-mode run constrained to the sealed evidence summary.

## Synthesis

The capture inventory, naming, processing command, validation thresholds, backup policy,
dialect-sensitive stop rules, and Aug 1 fallback are internally consistent. Both reviewers
independently verified that the runbook's 44 sound IDs match the canonical 44 sound definitions.
The processing profile and CLI flags match the implementation.

One shared major gap remains: the Stage 1 device-QA instructions ask the operator to stage and
play every candidate through the protected catalog, but the current runtime manifest includes
only sounds with current checksum-bound SLP approval. `audio:stage` stages only that manifest.
Before SLP approval, the generated manifest is empty and the documented catalog playback proof
cannot work through the named pipeline.

This is a documentation/workflow defect, not a production-code regression. GLM classified the
unsatisfiable QA step as **MAJOR** and Kimi classified it as **BLOCKER**. Per the disagreement
policy, the higher supported severity stands: the current manifest and stager directly prove the
runbook cannot complete its central Stage 1 device-QA step as written. Capture and local
processing can still proceed, and `rw-1gz.8.2` owns the underlying release-policy seam, but PR
#130 remains blocked until the runbook provides an executable Stage 1 path.

## Accepted findings

### BLOCKER — Stage 1 protected-catalog QA is not executable as written

Evidence:

- `docs/research/audio-spikes/recording-session.md:163` instructs staging playback files and
  verifying every candidate in the protected catalog.
- `scripts/audio-manifest.ts:22` projects only current checksum-bound SLP-approved sounds.
- `scripts/audio-stage.ts:32` stages only entries from that public manifest.
- Stage 1 records recorder and owner reviews; SLP approval is deliberately deferred to the
  educator-wave gate.

Impact: a zero-context operator can capture and process all 44 clips successfully but cannot
complete the runbook's central protected-catalog device-QA proof. The public manifest and staged
directory remain empty by design.

Minimum remediation: explicitly separate Stage 1 candidate QA from learner-facing manifest
staging. Either document a safe, concrete candidate-playback path that does not weaken the SLP
gate, or state that catalog/staging QA waits for the `rw-1gz.8.2` engineering seam and use a
clearly described direct local playback check in the interim. Do not bypass the generated-asset
policy by silently copying unapproved files into a public application directory.

### MAJOR — canonical import and metadata steps are under-specified

The runbook should name the exact canonical copy destinations and commands:

- selected masters to `content/audio/masters/<sound_id>.wav`;
- encodes to `content/audio/playback/<sound_id>.m4a`;
- media fields `master_path`, `master_sha256`, `playback_url`, and `playback_sha256`;
- review subjects computed with `computeReviewSubject()` after media hashes are present;
- `pnpm audio:manifest`, `pnpm audio:manifest:check`, and `pnpm audio:stage`, with their Stage 1
  SLP-gated behavior stated explicitly.

No follow-up bead was auto-created: remediation is local to PR #130 and the existing
`rw-1gz.8.2` release-policy seam.

## Rejected or narrowed suggestions

One reviewer suggested manually copying candidate files into `app/public/audio/` for catalog QA.
That specific remedy is not accepted without design work: it risks bypassing the generated-asset
and SLP-gated staging policy. The underlying finding is accepted; remediation returns to the
owning implementation workflow and `rw-1gz.8.2` boundary.

## Evidence checked

- PR #130 diff and metadata
- `docs/research/audio-spikes/recording-session.md`
- `rw-ozz`, `rw-odv`, `rw-5j6`, and `rw-1gz.8.2` tracker context
- `content/audio/sounds.json` and `content/audio/patterns.json`
- `scripts/audio-process.ts`, `scripts/audio-schema.ts`, `scripts/audio-manifest.ts`, and
  `scripts/audio-stage.ts`
- protected catalog API/UI and playback controller
- Spec 002 two-wave gates, Spec 003 audio design, user journeys, and SLP review packet
- focused audio tests: 82 passed before review
- reviewer rerun of `pnpm test:scripts`: 141 passed
- `pnpm audio:manifest:check`: passed
- `pnpm content:validate`: passed at the expected pre-capture state, 0/44 recordings
- PR CI and both Cloudflare Workers Builds: passed

## Next action

Return the accepted findings to the owning implementation workflow. Update the runbook before the
recording session, rerun the focused checks, then request a narrow confirmation review. PR #130
remains draft and must not be merged without explicit confirmation for that PR.

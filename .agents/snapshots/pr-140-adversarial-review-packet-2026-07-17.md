# Adversarial review packet: PR #140

## Target

- Repository: `/Users/troyjohnson/projects/flashcards`
- Pull request: #140, `feat(audio): stage recorded sound candidates for protected catalog`
- URL: https://github.com/troy-johnson/flashcards/pull/140
- Base: `origin/main`
- Head: `plan/rw-ozz-live-audio` at `ee6c260`
- Review the complete PR diff: `git diff origin/main...HEAD`.
- The PR currently has green checks and is open. Do not merge it or change the repository.

## Review profile

High-risk code/data/release review. The change adds user-facing audio assets and checksum-bound content metadata, and relies on a protected-catalog versus learner-release boundary.

## Scope and intended behavior

The PR contains two commits beyond `origin/main`: an earlier decodability-validator change (`e65d923`) and the audio candidate staging change (`ee6c260`). Determine whether both belong in this PR and whether either introduces a release or regression risk.

The audio change:

- adds 44 selected take-02 24-bit mono WAV masters under `content/audio/masters/`;
- adds 44 deterministic M4A playbacks under `content/audio/playback/`;
- adds `master_path`, `master_sha256`, `playback_url`, and `playback_sha256` to all 44 rows in `content/audio/sounds.json`;
- uses provisional processing: edge-silence trim, 100 ms padding for `sound_th_unvoiced`, +3 dB for `sound_v`, and +2 dB for `sound_z`;
- stages checksum-verified recorded candidates for the authenticated guardian audio catalog;
- intentionally leaves the learner-facing `content/audio/manifest.json` at 0/44 until current checksum-bound SLP approval exists;
- updates script tests so temporary content roots include the canonical media and subject hashes reflect current media hashes.

The raw recorder directory `readersway_sounds/` is local scratch and is not part of the PR. It must remain uncommitted.

## Relevant evidence

Read the actual files and diff, especially:

- `content/audio/sounds.json`
- `content/audio/manifest.json`
- `scripts/audio-manifest.ts`
- `scripts/audio-stage.ts`
- `scripts/audio-dist-check.ts`
- `api/src/routes/audio-catalog.ts`
- `app/src/routes/AudioCatalogRoute.tsx`
- `scripts/audio-schema.test.ts`
- `scripts/content-validate.ts`
- `scripts/content-validate.test.ts`
- `docs/research/audio-spikes/recording-session.md`
- the 44 WAV/M4A files and their metadata/hash relationships

The implementation verification reported for the head commit:

- `pnpm test:scripts` — 164/164
- `pnpm -r typecheck`
- `pnpm -r test` — app 73, API 127
- `pnpm content:validate` — recorded sound targets 0/44
- `pnpm audio:manifest:check`
- `pnpm audio:stage`
- `pnpm --filter app build`
- `pnpm audio:dist:check`
- `git diff --check`

GitHub PR checks reported green: `verify`, `Workers Builds: api-flashcards`, and `Workers Builds: flashcards`; `migrate` was skipped.

The linked Bead `rw-ozz` remains in progress. Its acceptance criteria include real-device protected-catalog playback, post-recording SLP review, and the Aug 1 fallback decision. It explicitly keeps learner-facing release blocked until checksum-bound SLP approval.

## Required review questions

Independently verify, with concrete file/line or asset/hash evidence:

1. Is the public learner gate actually preserved, and can any pending candidate leak into learner practice or a public manifest through staging, runtime URL construction, or build/deploy behavior?
2. Are all media paths, hashes, checksum-bound review subjects, generated runtime URLs, and staged bytes internally consistent for all 44 assets?
3. Do the test-fixture changes test the intended behavior without masking missing or mismatched canonical media?
4. Are the provisional audio transformations and edge cases (short clips, quiet voiced fricatives, padding, codec output) safe for the stated protected-catalog use, or is there a release-blocking risk?
5. Does the extra decodability commit belong in this PR, and does it introduce regressions outside the audio scope?
6. Are there security, authorization, deployment, caching, or operational risks in exposing these candidates through the protected catalog and static asset build?
7. What required device/owner/SLP follow-up remains before learner release?

## Output schema

Return only a concise independent review with:

- `VERDICT: APPROVED | APPROVED WITH NITS | BLOCKED | NEEDS CLARIFICATION`
- findings grouped by severity: `BLOCKER`, `MAJOR`, `MINOR`, `NIT`; each finding must include evidence and a concrete recommendation;
- `VERIFICATION`: commands or inspections actually performed;
- `OPEN QUESTIONS`: only questions that cannot be answered from the repository and supplied evidence.

Do not rely on parent chat history, unstated context, model memory, or an expected verdict. Do not edit files, commit, push, comment on GitHub, or merge.

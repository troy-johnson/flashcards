# PR #130 adversarial review — round 2

**Target:** PR #130, `plan/rw-ozz-audio-recording` at `5ce1b69` plus the local
release-gate remediation shown by `git diff`

**Profile:** code + operational docs, with executable-pipeline, release-policy,
failure-mode, and zero-context-operability lenses

**Date:** 2026-07-14

**Verdict:** **APPROVED WITH NITS**

## Reviewers

1. `vercel/zai/glm-5.2` via OpenCode/Vercel, high variant, fresh pure-context run.
   Role: executable pipeline and implementation correctness. Raw verdict:
   **APPROVED WITH NITS**.
2. `vercel/moonshotai/kimi-k2.7-code` via OpenCode/Vercel, high variant, fresh
   pure-context run. Role: release policy and failure modes. Raw verdict:
   **APPROVED WITH NITS**.

Both concrete model IDs were verified with `opencode models` immediately before
execution. Reviewers received only the target, Bead/spec/plan/runbook evidence,
verification results, prior-round evidence, profile, and verdict schema.

## Synthesis

Both reviewers independently found the round-1 blocker resolved. Candidate media now
has a separate checksum-verified staging projection, while
`content/audio/manifest.json` remains the learner-release projection. The protected
catalog receives the same generated runtime path that staging writes, and the app uses
that path rather than the canonical source URL. Tests prove a pending candidate is
staged without entering the learner manifest.

Both reviewers also found the under-specified runbook gap resolved. The runbook now
names canonical master and playback destinations, all four media fields, the exact
review shape, subject-hash command, manifest/staging commands, and LAN device-QA path.

The release gate was tightened during confirmation: learner release and
`recorded_sound_targets` now require current recorder, owner, and SLP approval. For
each reviewer kind and subject, the last appended disposition is authoritative, so a
later objection revokes approval and a later approval records resolution. Pending
media without a declared playback hash does not receive a catalog runtime URL.

No executable failure, security or data-loss risk, failing check, or direct spec
contradiction remains.

## Accepted non-blocking findings

- The Worker and Node implementations independently enumerate the stable review-subject
  fields. Drift could make catalog SLP status disagree with authoring/release checks.
  This was also identified by the separate standards review. Follow-up Bead: `rw-c9n`.
- The catalog's `slp_approved` headline reports SLP disposition, not full learner-release
  eligibility. The label is accurate; a future `learner_released` flag could make the
  distinction more explicit.
- Latest-disposition semantics intentionally trust append order. The runbook documents
  this; future validation could reject out-of-order review histories.
- `stageAudioAssets` remains exported for manifest-only unit coverage while the CLI
  entrypoint uses candidate staging. This is harmless but could be documented more
  explicitly.

## Round-1 finding disposition

- **BLOCKER — Stage 1 protected-catalog QA not executable:** resolved.
- **MAJOR — canonical import and metadata steps under-specified:** resolved.

## Verification evidence

- `pnpm -r test`: app 64/64, API 126/126
- `pnpm test:scripts`: 146/146
- focused manifest tests: 14/14
- focused protected-catalog API tests: 11/11
- focused recorded-sound coverage tests: 4/4
- `pnpm -r typecheck`: passed
- `pnpm content:validate`: passed at expected pre-capture `0/44`
- `pnpm audio:manifest:check`: passed
- `pnpm audio:stage`: passed
- `git diff --check`: passed

## Canonical status and next action

Bead `rw-ozz` remains in progress because the July 16 recording, real-device proof,
post-recording SLP review, and Aug 1 disposition are future operational work. PR #130
may advance beyond adversarial review after the local remediation is committed and
pushed, but remains draft and must not be merged without explicit confirmation for
this specific PR.

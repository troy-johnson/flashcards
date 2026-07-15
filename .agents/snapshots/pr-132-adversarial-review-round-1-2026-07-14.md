# PR #132 Adversarial Review — Round 1

- Target: PR #132, commit `b5e7ed917799f2637ad55c5132c3835466f15ed8`
- Profile: code
- Transport: OpenCode CLI via Vercel provider
- Run mode: two independent fresh-context headless reviews
- Date: 2026-07-14 America/Denver

## Reviewers

1. `vercel/zai/glm-5.2`
   - Role: correctness and release-integrity adversary
   - Effort: high
   - Raw verdict: `APPROVED WITH NITS`
2. `vercel/moonshotai/kimi-k2.7-code`
   - Role: tests and maintainability adversary
   - Effort: high
   - Raw verdict: `BLOCKED`

Both reviewers were limited to the committed diff `origin/main...HEAD`, the plan Task 11 contract,
the canonical audio schema/manifest/staging code, changed files, and read-only verification.
Neither reviewer received the other review or parent-session narrative.

## GLM 5.2 raw findings

- IMPORTANT: with zero recorded candidates, the current check compares an empty expected set to
  an empty distribution and passes; GLM recommended documenting this phased state or adding a
  non-empty end-to-end fixture before the gate becomes load-bearing.
- IMPORTANT: all new tests call `checkAudioDistAgainstManifest` with synthetic manifests; none
  call `checkAudioDist`, so the contract-critical choice of `projectStagedManifest` over
  `projectPublicManifest` is unpinned.
- MINOR: the generated URL prefix duplicates the canonical schema constant.
- MINOR: CI ordering coverage is string-based and only checks build before dist check.
- MINOR: URL-path handling is POSIX-oriented and defensive traversal/duplicate guards lack tests.
- MINOR, inherited: partial playback metadata is silently omitted by the existing staged
  projection.

GLM verified that staging, learner-manifest gating, SHA checks, missing/extra rejection, and CI
ordering match the intended contract. It ran the script suite, app build, and dist check
successfully.

Raw verdict: `APPROVED WITH NITS`.

## Kimi 2.7 Code raw findings

- IMPORTANT: `generatedRelativePath` normalizes traversal segments instead of rejecting them.
  `/audio/generated/../foo.m4a` proceeds as `foo.m4a`; later output-root containment prevents an
  escape, so this is not an exploit, but the guard does not enforce its stated safe-path contract.
- IMPORTANT: no test calls `checkAudioDist`, so no test proves that pre-SLP candidates from
  `projectStagedManifest` are required in the built distribution.
- MINOR: duplicate generated paths and malformed source boundaries are not tested.
- MINOR: CLI failure behavior lacks a subprocess test.
- MINOR: strict extra-file rejection should remain documented as an exclusive-directory contract.

Kimi verified the core SHA comparison, missing/extra rejection, prebuild staging path, and CI
ordering. It ran 152 script tests, the app build, and the dist checker successfully.

Raw verdict: `BLOCKED`.

## Synthesis

Final verdict: `BLOCKED`.

Accepted required remediation:

1. Add an end-to-end test through `checkAudioDist(root)` with canonical temporary audio sources,
   including a checksum-bound pre-SLP candidate. Prove that the candidate is required and that a
   missing built file fails. This pins the staged-candidate projection contract.
2. Make generated URL validation reject traversal/non-canonical path segments explicitly and add
   malformed-path tests. Although upstream canonical projection and output-root containment
   prevent directory escape today, the exported checker should enforce its own stated boundary.

Accepted non-blocking cleanup while touching the surface:

- Use the canonical `GENERATED_URL_PREFIX` constant.
- Test duplicate generated paths.

Rejected or downgraded findings:

- The empty candidate set is an intentional phased state, not a release false-pass. Until the
  July 16 recording session, `recorded_sound_targets.required_now` remains zero and content
  validation reports the expected `0/44`. A minimum-count sentinel now would contradict the
  approved phased rollout. The required non-empty end-to-end fixture still addresses test
  adequacy before recordings land.
- Stale distribution behavior is already covered behaviorally by missing and extra file tests,
  and CI deterministically builds immediately before the check. No additional blocker remains.
- Plan/commit-message wording differences are cosmetic.

## Next action

Return to the TDD implementation workflow, remediate the two accepted important findings, rerun
all gates, commit and push only with user authority, then run adversarial confirmation round 2.

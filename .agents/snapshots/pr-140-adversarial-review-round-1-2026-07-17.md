# PR #140 adversarial review — round 1

## Review execution

- Target: PR #140, head `ee6c260`, `plan/rw-ozz-live-audio`
- Profile: `code` / high-risk code-data-release review
- Transport: OpenCode headless CLI
- Model 1: `vercel/openai/gpt-5.6-sol`, variant `high`; role: correctness, release-gate, integrity, and regression review
- Model 2: `vercel/anthropic/claude-opus-4.8`, variant `high`; role: deployment, authorization, provenance, static-asset, and edge-case review
- Evidence packet: `pr-140-adversarial-review-packet-2026-07-17.md`
- Both reviewers were fresh-context sessions limited to the packet and repository evidence; neither edited, committed, pushed, commented, or merged.

## Reviewer A — GPT-5.6-Sol

`VERDICT: NEEDS CLARIFICATION`

Findings:

- `MAJOR`: candidate recordings are deployed as predictable static assets before recorder, owner, or SLP approval. Evidence cited: `app/package.json:8`, `docs/research/audio-spikes/recording-session.md:30-40,251-268`, and `content/audio/sounds.json`. Recommendation: confirm public distribution and provenance/consent authorization, or prevent candidate staging until authorization exists.
- `MINOR`: the unrelated decodability change in `e65d923` broadens scope and uses future multi-character graphemes in longest-first segmentation. Recommendation: split it or explicitly document and test the ambiguous-segmentation policy.
- `NIT`: session details, selected-take rationale, transformations, backup, owner review, and device QA remain blank in the recording log. Recommendation: complete the record before learner release.

Verification reported: 44/44 media hashes, `content:validate` at 0/44, `audio:manifest:check`, 164 script tests, diff check, and direct format probes. Build/staging commands were not rerun in the continuation because they write generated output.

## Reviewer B — Claude Opus 4.8

`VERDICT: APPROVED WITH NITS`

Findings:

- No blocker or major finding.
- `MINOR`: all 44 candidate M4A bytes are unauthenticated static assets at predictable `/audio/generated/<sound_id>.m4a` URLs even though catalog metadata is protected. The reviewer confirmed this is consistent with the documented design and not a learner-manifest leak. Recommendation: document world-readable-by-URL behavior or gate bytes if confidentiality is intended.
- `MINOR`: `e65d923` is orthogonal to the audio scope. Recommendation: split for clean revertability.
- `NITS`: clarify that the diagnostic email check is a single-operator allowlist, and optionally remove redundant `.gitkeep` files.

Verification reported: 44/44 master hashes and 44/44 playback hashes recomputed with zero mismatches; all 44 WAV/M4A format checks passed; path-traversal guards reviewed; learner manifest remained empty; fixtures were not masking missing media.

## Synthesis

The public learner gate is intact. `content/audio/manifest.json` remains `0/44`; all 44 rows have no reviews; the learner projection requires current recorder, owner, and SLP approvals. The protected catalog endpoint is authenticated and operator-gated, while its static bytes are deliberately staged separately. The recording runbook explicitly states that these bundled candidate bytes are ordinary static assets and that the manifest—not byte reachability—is the learner-release boundary. This direct evidence downgrades the static-byte exposure from a release blocker to an accepted design clarification.

No confirmed code or media-integrity blocker was found: the independent hash and format checks are clean, and the staged/public projections remain distinct. The higher reviewer severity is preserved as an unresolved clarification because the repository does not record whether world-readable candidate bytes and the recording provenance/consent are authorized. The orthogonal `e65d923` commit is a scope/revertability concern, not a correctness blocker; keep or split it deliberately.

Canonical disposition: `NEEDS CLARIFICATION`.

Required next actions:

1. Confirm that candidate audio may be world-readable by deterministic static URL and that recording provenance/consent is authorized for this staging path; otherwise change the staging design before merge.
2. Decide whether to split `e65d923` from the audio PR.
3. Complete the Bead's remaining selected-take, backup, owner-review, real-device QA, SLP, and Aug 1 disposition records before learner release.

PR #140 remains open and must not be merged until the clarification is resolved and the user gives explicit per-PR merge confirmation.

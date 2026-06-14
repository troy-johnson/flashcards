# Adversarial Review Packet

## Review context

- Artifact type: pr/qa
- Artifact path: `https://github.com/troy-johnson/flashcards/pull/35`
- Originating spec/plan: `docs/plans/002e-phase-a-content-bar.md`
- Originating bead: `rw-npb`
- Gate bead: `rw-4o5`
- Originating plan review status: approved with nits
- Round number: 1
- Intended outcome: verify PR #35 can advance from adversarial review to the explicit per-PR merge gate.
- Reviewer lens: correctness, content decodability, ID immutability, scheduler safety, validator/test coverage.
- Required verdict set: APPROVED | APPROVED WITH NITS | BLOCKED | NEEDS CLARIFICATION

## Key claims under review

1. PR #35 adds K Units 1-2 content that satisfies the current Phase A bar: 20 heart words, 45 live decodable words, and 18 live fluency sentences.
2. R2-F4 is resolved by deprecating stale cat item IDs in place and replacing them with immutable, schedulable IDs.
3. Deprecated content is excluded from scheduler plans and manifest counts without deleting shipped IDs.
4. The additive `fluency_k_u2_cvc_sentences` scope decision is valid and does not inflate the phonics skill count.
5. Updated tests still verify scheduler behavior rather than merely matching new counts.

## Changed files in scope

- `content/items/seed.json` - K U1-2 authored content, deprecated cat IDs, replacement IDs.
- `content/skills.json` - additive U2 fluency skill and prerequisites.
- `content/scope-sequence.json` - additive U2 fluency placement.
- `content/manifest.json` - raised `required_now` content bars.
- `api/src/scheduler/content.ts` - skips deprecated items from scheduler indexes.
- `api/src/scheduler/content.test.ts` - scheduler content/deprecation coverage.
- `api/src/scheduler/planner.test.ts` - expanded K plan and terminal-reason fixtures.
- `api/src/routes/practice.test.ts` - expanded route-level terminal fixture.
- `scripts/content-validate.ts` - manifest counting and immutability checks.
- `scripts/content-validate.test.ts` - deprecated-count and prerequisite-order coverage.

## Diff or change summary

- Added 84 live seed items plus 2 deprecated retained items: 20 heart words, 45 live decodable words, 18 live fluency sentences, and 1 PA item.
- Retained `phonics_k_u1_short_a_cat` and `fluency_k_u1_cat_sat` with `deprecated: true`; added live replacements `phonics_k_u1_short_a_mat` and `fluency_k_u1_sam_sat`.
- Added `fluency_k_u2_cvc_sentences` after U2 CVC short-o prerequisites.
- Changed scheduler loading and content validation so deprecated items remain in JSON but are not schedulable and do not satisfy manifest counts.

## Scrutiny checklist result

- R2-F4 immutability/deprecate-and-replace: PASS. The stale cat IDs are present and deprecated in `content/items/seed.json`; replacements are present. `scripts/content-validate.ts` checks missing main IDs on non-main branches and `api/src/scheduler/content.ts` skips deprecated items before indexing.
- Decodability: PASS. I reviewed the 45 live decodables and 18 live fluency sentences against K U1 (`m s t p` + short `a`) and K U2 (adds `n c d g` + short `o`), treating tagged heart words as exceptions. A simple scan found no out-of-budget non-heart tokens.
- Additive scope decision: PASS. `fluency_k_u2_cvc_sentences` has prerequisites `fluency_k_u1_cvc_sentences` and `phonics_k_u2_cvc_blend_short_o`, appears after those prerequisites in scope, and does not change the `phonics_skills` manifest count, which remains 9.
- Heart-word tagging: PASS WITH REVIEWER JUDGMENT. All 20 have regular/irregular tags. The tags encode regular orthographic parts even where a grapheme is not in the K U1 decodable budget; fluency decodability relies on whole-word heart-word exception status, not on those parts being decodable.
- Manifest: PASS. Sequential validation reports `heart_words: 20/50`, `decodable_words: 45/200`, `fluency_sentences: 18/30`, and `phonics_skills: 9/12`; `v1_target` values were not lowered.
- Test coupling: PASS WITH NIT. The scheduler and route tests now include all 12 K skills and the 8 item-backed skills, preserving the terminal-reason assertions. A test-hygiene issue remains: the content validator tests rewrite real `content/` files and are unsafe to run concurrently with API scheduler tests.

## Findings

- Finding ID: F-1
- Severity: minor
- Evidence: `scripts/content-validate.test.ts` writes directly to production content paths (`content/manifest.json`, `content/audio/manifest.json`, `content/skills.json`, `content/scope-sequence.json`, `content/items/seed.json`) at lines 7-17 and mutates/restores them through helpers at lines 19-65. When I ran the gate commands concurrently, the API tests imported synthetic `skill_a` / `skill_b` / `skill_c` fixture content and failed; rerunning the API tests alone passed.
- Recommendation: Move validator tests to a temp content root or inject a content root into `scripts/content-validate.ts` so concurrent quality gates cannot observe synthetic fixtures.
- Disposition: Follow-up filed as `rw-cvr`; not a PR #35 merge blocker because the documented verification commands pass sequentially and CI is green.

## Verdict

- Adversarial verdict: APPROVED WITH NITS
- Rationale: The content bar, deprecation behavior, manifest counts, scope placement, and scheduler behavior match the gate. No content/scheduler blocker was found. The only finding is test isolation hygiene, now tracked as a follow-up.
- Required follow-up actions: Resolve or schedule `rw-cvr` separately; do not block PR #35 on it.
- Ship gate: READY for explicit per-PR merge gate. DO NOT MERGE without user confirmation for PR #35.

## Verification evidence

- `bd dolt pull`: pass.
- `pnpm content:validate`: pass; reports ok with 12 skills, 86 items, 3 audio entries.
- `pnpm --filter api test -- src/scheduler/content.test.ts src/scheduler/planner.test.ts src/routes/practice.test.ts`: pass; 3 files, 36 tests.
- `pnpm exec tsx --test scripts/content-validate.test.ts`: pass; 6 tests.
- `pnpm -r typecheck`: pass; api and app `tsc --noEmit`.
- `git diff --check origin/main...HEAD`: pass.
- GitHub PR #35 checks observed green: `verify`, Workers Builds for `api-flashcards`, Workers Builds for `flashcards`; `migrate` skipped.

## Unresolved risks

- Audio assets are deferred by design to `rw-1gz.8.2`.
- Grade monotonicity validator is deferred by design to `rw-385`.
- Validator test restore safety is separately tracked by `rw-8ea`; the concurrent-test isolation nit is tracked by `rw-cvr`.

## Downstream requirements

- Requires adversarial plan review: no, already handled upstream for this plan packet.
- Requires adversarial PR/QA review: complete in this packet.
- Ship gate note: PR #35 can be reported to the user for the explicit merge gate, but must not be merged until the user explicitly says to merge PR #35.

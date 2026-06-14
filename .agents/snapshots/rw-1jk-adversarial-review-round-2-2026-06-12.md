# rw-1jk Adversarial Review — Round 2

## Review Context

- Bead: `rw-1jk`
- PR: `#34`
- Branch: `plan/rw-1jk-k-u1-2-phonics-scope`
- Commit reviewed: `22f0384`
- Round: 2
- Prior round verdict: `BLOCKED`
- Required verdict set: `APPROVED | APPROVED WITH NITS | BLOCKED | NEEDS CLARIFICATION`

## Carry-Forward From Round 1

- F-1: no-item scoped skills could create an empty grade-1 plan without a terminal reason.
- F-2: active `cat` / `The cat sat.` seed content violated the new U1 grapheme budget because `c` was introduced in U2.
- F-3: validator test did not exercise the current manifest floor.
- F-4: cross-unit prerequisite ordering was manual rather than validator-enforced.

## Changes Reviewed

- `api/src/scheduler/planner.ts` filters scope skills down to item-backed skills for both K and grade-1 plan selection and grade-1 terminal detection.
- `content/items/seed.json` changes `cat` to `mat` and `The cat sat.` to `The mat sat.`, with matching TTS IDs in `content/audio/manifest.json`.
- `scripts/content-validate.test.ts` pins the passing phonics fixture to `required_now: 9`.
- `scripts/content-validate.ts` adds a global scope-unit index check for prerequisites that appear in later units.

## Round-2 Findings

### R2-F1 — Important — K active practice is now intentionally sparse, but the PR should not claim practice coverage for K U1-2

Evidence:
- `content/scope-sequence.json:6-22` scopes 11 K U1-2 skills.
- `content/items/seed.json:3-26` has items for only four skills.
- `api/src/scheduler/planner.ts:53-55` filters both K and grade-1 planning to skills present in `itemsBySkill`.

Assessment:
This resolves the grade-1 empty-terminal blocker from round 1, because no-item skills no longer participate in review completion. It also means K students practice only the four item-backed seed skills until `rw-npb` lands. That is acceptable only as a skills/scope intermediate slice under `docs/plans/002e-phase-a-content-bar.md` Task 2, not as a pedagogically complete K U1-2 practice release.

Disposition:
Accepted with nit. Keep the PR scoped as skills/scope plumbing and do not represent it as complete K U1-2 practice coverage.

### R2-F2 — No Issue — `itemsBySkill` does not create empty-array false positives

Evidence:
- `api/src/scheduler/content.ts:56-65` initializes `itemsBySkill` as `{}` and only creates a key inside the raw item loop with `(itemsBySkill[item.skill_id] ??= []).push(item)`.

Assessment:
The `id in content.itemsBySkill` predicate cannot match a scheduler-created empty array with the current loader.

Disposition:
Resolved.

### R2-F3 — Important — `The mat sat.` is semantically weaker than necessary

Evidence:
- `content/items/seed.json:23-26` now uses `The mat sat.`.
- U1-taught graphemes include `m/s/t/p` and short `a` by `content/scope-sequence.json:8-9`.

Assessment:
The replacement fixes the `c` decodability problem but leaves an odd sentence. A better U1-decodable sentence exists: `Sam sat.` uses only s/a/m/t, is semantically natural, and does not require the heart word `the`. If the product wants a heart-word sentence, `The mat sat.` can be tolerated for a pilot, but it is lower-quality instructional content.

Disposition:
Important content QA nit, not a ship blocker by itself.

### R2-F4 — Important — Existing item IDs now permanently mismatch text/audio

Evidence:
- `content/items/seed.json:9-12` keeps `phonics_k_u1_short_a_cat` while the text/audio are `mat` / `tts_word_mat`.
- `content/items/seed.json:23-26` keeps `fluency_k_u1_cat_sat` while the text/audio are `The mat sat.` / `tts_sentence_the_mat_sat`.
- `scripts/content-validate.ts:143-153` protects ID presence across branches but does not protect item text/audio immutability.

Assessment:
Because the content policy treats IDs as immutable post-ship, keeping IDs with stale semantic names creates a durable content-maintenance hazard. The safer pattern is to deprecate the `cat` IDs and add correctly named replacement items, especially before more authored content or telemetry accumulates around these IDs.

Disposition:
Important. Prefer deprecate-and-replace before merge, or explicitly accept this as technical debt in `rw-npb`.

### R2-F5 — No Issue — `required_now: 9` is a defensible fixture pin

Evidence:
- `content/manifest.json` requires `phonics_skills.required_now: 9`.
- `scripts/content-validate.ts:107-109` dynamically computes actual phonics skills from real content.
- `scripts/content-validate.test.ts:75` pins the passing fixture to the current floor.

Assessment:
The production validator already derives the actual count. The test fixture pin is acceptable because it guards the current contractual floor. Dynamic derivation inside the test would couple the test to real content and could hide an accidental manifest lowering if the test simply followed whatever `skills.json` contains.

Disposition:
Resolved. Maintenance churn is small and intentional when `required_now` is raised.

### R2-F6 — Minor — Global unit index works for current content but grade monotonicity remains implicit

Evidence:
- `scripts/content-validate.ts:91-99` checks prerequisite unit positions with a single global scope index.
- `content/scope-sequence.json:1-25` currently contains only K units, so no cross-grade ordering case exists in current content.

Assessment:
The global index correctly catches same-grade later-unit prerequisites and allows grade-1 skills to depend on earlier K units if all K units precede all grade-1 units. The validator still does not enforce that monotone grade ordering convention. This is not a current blocker because the existing content has only K units, but the first grade-1 scope PR should either enforce monotone grade order or make the prerequisite check grade-aware.

Disposition:
Minor follow-up. Capture before Phase 2 grade-1 scope lands.

### R2-F7 — Minor — Validator test file mutation has crash-safety risk

Evidence:
- `scripts/content-validate.test.ts:11-34` captures production content file contents at module load and restores them in `afterEach`.
- Normal execution was verified: after the test run, `git diff -- content/skills.json content/scope-sequence.json content/items/seed.json content/manifest.json content/audio/manifest.json` was empty.

Assessment:
The harness is acceptable for the current small suite under normal failures, but a SIGKILL/OOM can leave production content files mutated. This risk pre-existed in the manifest/audio tests and grew with `skills`/`scope`/`items` mutation.

Disposition:
Minor follow-up. A startup restore from git or temp-copy fixture directory would reduce risk, but this should not block PR #34.

## Verdict

- Adversarial verdict: `APPROVED WITH NITS`
- Ship gate: `READY FOR OWNER DECISION`

Rationale:
The round-1 blockers are materially resolved: no-item scoped skills no longer block grade-1 terminal behavior, the active `cat` decodability violation has been removed, the manifest fixture now reflects the current floor, and cross-unit prerequisite order is validator-enforced. Remaining issues are content-quality and maintenance risks, led by stale `cat` item IDs and the awkward `The mat sat.` sentence. Those are important enough to fix before the content set grows, but not enough to block this skills/scope PR if the owner accepts the debt or rolls it into `rw-npb`.

## Verification Evidence

- `pnpm content:validate`: passed; 11 skills, 4 items, 3 audio entries.
- `pnpm --filter api test -- src/scheduler/content.test.ts src/scheduler/planner.test.ts`: passed; 23 tests.
- `pnpm exec tsx --test scripts/content-validate.test.ts`: passed; 5 tests.
- `git diff -- content/skills.json content/scope-sequence.json content/items/seed.json content/manifest.json content/audio/manifest.json`: empty after validator tests.

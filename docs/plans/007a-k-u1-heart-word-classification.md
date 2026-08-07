# K Unit 1 Heart-Word Classification Implementation Plan

> **Execution:** Use bounded specialist subagents in dependency waves. Follow RED → GREEN → REFACTOR and review each wave before integrating it. Plan 007a may run in parallel with Plan 008a because their production file surfaces do not overlap.

**Goal:** Present “as” as a temporarily irregular heart word at the current K Unit 1 scope while preserving shipped identifiers and the manifest content bar.

**Bead:** `rw-1gz.8.7`
**Evidence:** [UFLI Foundations Lesson 11 Home Practice](https://ufli.education.ufl.edu/wp-content/uploads/2022/08/11_HomePractice_UFLI-Foundations.pdf) lists `as*` under “New Irregular Words” and `Sam` as a sample word.
**Status:** Implemented and verified; owner curriculum review remains at the merge gate

## Architecture and decisions

This is a canonical content correction, not a scheduler special case. Keep the shipped `phonics_k_u1_cvc_a_as` identifier in `content/items/seed.json` with `deprecated: true`, then add `heart_k_u1_as` under `heart_k_u1_batch_01` with regular part `a` and irregular part `s`. Add `phonics_k_u1_cvc_a_sam` under `phonics_k_u1_cvc_blend_short_a` so the live decodable count remains 200 after retiring the old “as” item. The live heart-word count becomes 51, which satisfies the unchanged minimum of 50. No manifest target is lowered.

The K Unit 1 neighboring-item audit covers every live item assigned to `phonics_k_u1_short_a` and `phonics_k_u1_cvc_blend_short_a`. Record the reviewed item IDs, decision, source, and reviewer/date on Bead `rw-1gz.8.7` and in the PR verification summary; do not create a markdown task list.

## File surface

- Modify `content/items/seed.json`.
- Modify `api/src/scheduler/content.test.ts`.
- Modify `app/src/components/cards/cards.test.tsx`.
- Inspect `api/src/routes/practice.test.ts` and update only if an exact card/order fixture changes.
- Do not modify `content/manifest.json`, scheduler selection logic, database schemas, or unrelated curriculum.

## Wave 1 — RED classification contracts

**Specialists:** content-test specialist and card-rendering test specialist, parallel eligible

### Slice 1A — Scheduler content contract

- [ ] In `api/src/scheduler/content.test.ts`, add a failing test that requires:
  - `phonics_k_u1_cvc_a_as` to be absent from `itemsById`;
  - `heart_k_u1_as` to have `kind: "heart"`, `text: "as"`, `regular_parts: ["a"]`, and `irregular_parts: ["s"]`;
  - `phonics_k_u1_cvc_a_sam` to have `kind: "phonics"`, `text: "Sam"`, and skill `phonics_k_u1_cvc_blend_short_a`;
  - `itemsBySkill["phonics_k_u1_cvc_blend_short_a"]` to contain item ID `phonics_k_u1_cvc_a_sam` and not contain item ID `phonics_k_u1_cvc_a_as`.
- [ ] Run `pnpm --filter api test -- src/scheduler/content.test.ts` and capture the expected failing assertions.

### Slice 1B — Heart-card rendering contract

- [ ] In `app/src/components/cards/cards.test.tsx`, add a passing characterization case for the intended `heart_k_u1_as` card shape. This test constructs a `PracticeCard` inline, so it is not a RED test for missing canonical content.
- [ ] Assert the eyebrow reads “Read this heart word,” the ordered visible word is “as,” and only `s` has `.heart-part`.
- [ ] Run `pnpm --filter app test -- src/components/cards/cards.test.tsx` and capture the passing characterization result before changing content.

**Wave gate:** Slice 1A fails for the missing/retired canonical content, not fixture setup or an unrelated error. Slice 1B passes and proves the existing generic heart renderer supports the required visual split. Do not manufacture a RED result in Slice 1B.

## Wave 2 — GREEN canonical data correction

**Specialist:** curriculum-content implementer
**Depends on:** Wave 1

- [ ] Mark `phonics_k_u1_cvc_a_as` deprecated in place. Do not rename, delete, or reuse it.
- [ ] Keep the retired row at its current locus and insert `phonics_k_u1_cvc_a_sam` beside it for a reviewable diff.
- [ ] Add exactly:

  ```json
  {
    "item_id": "heart_k_u1_as",
    "skill_id": "heart_k_u1_batch_01",
    "text": "as",
    "regular_parts": ["a"],
    "irregular_parts": ["s"]
  }
  ```

- [ ] Insert `heart_k_u1_as` beside `heart_k_u1_is`, whose same regular-vowel/irregular-`s` split is the closest existing precedent.
- [ ] Add exactly:

  ```json
  {
    "item_id": "phonics_k_u1_cvc_a_sam",
    "skill_id": "phonics_k_u1_cvc_blend_short_a",
    "text": "Sam"
  }
  ```

- [ ] Do not change `content/manifest.json`: the resulting live counts must be at least 50 heart words and exactly preserve the 200 authored decodable-word bar.
- [ ] Run the Wave 1 focused tests green.
- [ ] Run `pnpm content:validate` and confirm it reports success.

## Wave 3 — Focused audit and integration verification

**Specialists:** curriculum auditor, then integration verifier
**Depends on:** Wave 2

- [ ] Enumerate every live item under `phonics_k_u1_short_a` and `phonics_k_u1_cvc_blend_short_a`.
- [ ] Check each item against the grapheme correspondences available at that point in `content/decodability-map.json` and the cited Lesson 11 evidence.
- [ ] Record the audit set and conclusion on `rw-1gz.8.7`. Any additional classification problem blocks completion and becomes a separately scoped Bead unless it is the same `as` defect.
- [ ] Inspect practice-route ordering/count fixtures by searching for `phonics_k_u1_cvc_a_as`, the text `as`, and `phonics_k_u1_cvc_blend_short_a`. Change assertions only when the canonical data correction makes an existing exact expectation stale.
- [ ] Run:

  ```bash
  pnpm content:validate
  pnpm test:scripts
  pnpm --filter api test -- src/scheduler/content.test.ts src/routes/practice.test.ts
  pnpm --filter app test -- src/components/cards/cards.test.tsx
  pnpm -r typecheck
  pnpm test
  git diff --check
  ```

- [ ] Confirm the diff contains no manifest-target reduction, scheduler special case, identifier deletion, or unrelated content rewrite.

## Human review gate

Before merge, the owner reviews the exact “as” heart-part split, the “Sam” replacement, and the neighboring-item audit. Record reviewer, date, revision, and pass/fail on `rw-1gz.8.7`. A failed review returns to Wave 2 and reruns Wave 3.

## Rollback

If the new items must be withdrawn after release, deprecate the new identifiers rather than deleting them. Do not reactivate the known-wrong phonics “as” classification without new curriculum evidence.

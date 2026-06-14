# Adversarial Review Packet

## Review context

- Artifact type: pr/qa
- Artifact path: `https://github.com/troy-johnson/flashcards/pull/34`
- Originating spec/plan: `docs/plans/002e-phase-a-content-bar.md`
- Originating plan review status: approved with nits
- Round number: 1
- Intended outcome: Author Kindergarten Units 1-2 phonics/phonemic-awareness skills and scope-sequence order, raise `phonics_skills.required_now`, and keep validation green.
- Reviewer lens: correctness, content QA, scheduler behavior, delivery risk
- Required verdict set: APPROVED | APPROVED WITH NITS | BLOCKED | NEEDS CLARIFICATION

## Key claims under review

1. The K U1-2 skill/scope order is defensible and internally consistent.
2. The PR can ship skills + scope before item authoring without creating runtime or QA inconsistencies.
3. The manifest count and tests still enforce the intended content bar.
4. The `k_u1_seed` unit removal/rename does not break code or active references.
5. Manual prerequisite-order QA is sufficient for this PR.

## Changed files in scope

- `content/skills.json` — adds 7 PA/phonics skills and prerequisites.
- `content/scope-sequence.json` — replaces `k_u1_seed` with `k_u1` / `k_u2`.
- `content/manifest.json` — raises `phonics_skills.required_now` from 2 to 9.
- `scripts/content-validate.test.ts` — updates manifest-gate fixture expectations.
- `api/src/scheduler/content.test.ts` — updates content loader fixtures.
- `api/src/scheduler/planner.test.ts` — updates planner fixtures for expanded K scope.
- `api/src/routes/practice.test.ts` — updates route fixtures for expanded K scope.

## Diff or change summary

- Adds K U1 skills: isolate initial sound, consonants m/s/t/p, CVC blend short-a.
- Adds K U2 skills: segment three-sound words, consonants n/c/d/g, short-o, CVC blend short-o.
- Keeps existing seed skills/items unchanged.
- No new practice items are added, so active practice cards remain the four seed items.

## Risks and failure modes

- No-item scoped skills can affect grade-1 review/terminal logic even though users cannot practice them.
- Existing U1 seed items use `c` in `cat`, while `c` is now introduced in U2.
- The validator still does not enforce cross-unit prerequisite order.
- A generalized validator test may stop proving the current manifest floor.

## Prior decisions and constraints

- Decision reference: `docs/plans/002e-phase-a-content-bar.md`, Task 2.
- Decision reference: `rw-1jk` acceptance criteria.
- Constraint: skills/scope only; item authoring is tracked separately by `rw-npb`.
- Constraint: merge gate requires explicit user confirmation for PR #34.

## Open questions

- Can PR #34 merge independently, or must it be revised/combined with item authoring to avoid an inconsistent active content state?
- Should unpracticeable scoped skills be excluded from grade-1 review/terminal calculations until they have items?
- Should `c` move into U1, or should existing `cat` seed items be remapped/replaced?

## Findings format

- Finding ID: `F-1`
- Severity: blocker | important | minor
- Evidence: direct file/line/test evidence
- Recommendation: specific corrective action
- Scope rule: Reviewer may block, question, or propose alternatives, but may not silently expand scope.

## Same-model preflight handoff

- Preflight run: yes
- Preflight artifact path: `.agents/snapshots/rw-1jk-preflight-2026-06-11.md`
- Note: the preflight sharpened claims and checked packet completeness; it did not provide the gate verdict.

## Independent Findings

### F-1 — Blocker — No-item skills can produce an empty grade-1 plan without `terminal_reason`

Evidence:
- `api/src/scheduler/planner.ts:52` filters grade-1 review by every scope skill.
- `api/src/scheduler/planner.ts:60` emits cards only for skills present in `itemsBySkill`.
- `api/src/scheduler/planner.ts:86` requires every scoped skill to be review-passed before returning `review_complete_no_active_content`.
- `content/scope-sequence.json:6` and `content/scope-sequence.json:19` introduce scoped skills with no items.
- `content/items/seed.json:1` has items for only four skills.
- `api/src/routes/practice.ts:156` rejects attempts not in the started plan, so users cannot naturally create review-passing attempts for no-item skills.
- `api/src/routes/practice.test.ts:115` bypasses that by inserting synthetic attempts with fake item IDs.

Impact:
After a 1st grader review-passes the four practiceable seed skills, remaining no-item scoped skills can leave the plan empty while `terminal_reason` remains null.

Recommendation:
Exclude no-item skills from grade-1 review/terminal calculations until items exist, keep unpracticeable skills out of active scope, or merge this atomically with item authoring. Add a regression for "all practiceable skills passed, remaining scoped skills have no items."

### F-2 — Important — Current U1 practice violates the new decodability budget

Evidence:
- `content/scope-sequence.json:8` teaches `phonics_k_u1_consonants_mstp`.
- `content/scope-sequence.json:20` introduces `phonics_k_u2_consonants_ncdg`, which includes `c`.
- `content/items/seed.json:9` has active U1 item `phonics_k_u1_short_a_cat`.
- `content/items/seed.json:23` has active U1 fluency sentence `The cat sat.`
- `docs/plans/002e-phase-a-content-bar.md:71` requires decodable words to use only graphemes/skills taught at or before the unit.

Recommendation:
Resolve before shipping this scope: move `c` into U1, or replace/remap `cat` and `The cat sat.` to content using only U1 graphemes. If deferred to `rw-npb`, PR #34 should not merge independently.

### F-3 — Important — Validator test no longer exercises the current manifest floor

Evidence:
- `content/manifest.json:4` requires 9 phonics skills now.
- `scripts/content-validate.test.ts:54` still sets the passing fixture to `required_now: 2`.
- `scripts/content-validate.test.ts:76` generalizes the below-minimum assertion to `/found \d+/`.

Recommendation:
Derive the expected current count from `content/skills.json`, or update the fixture to `required_now: 9` and assert the exact derived `found` count. Keep future-bump resilience without losing count correctness.

### F-4 — Minor — Cross-unit prerequisite ordering remains unvalidated

Evidence:
- `scripts/content-validate.ts:69` checks first-unit prerequisite containment.
- `scripts/content-validate.ts:81` checks no prerequisite comes from a later grade.
- The validator does not compare prerequisite positions across units.
- Manual review found this PR's prerequisites ordered equal-or-earlier in scope.

Recommendation:
Add a validator check that each prerequisite appears before its dependent in grade scope order before more content lands.

## Other Checks

- Pedagogy/order: broadly defensible against the repo's PA -> letter-sounds -> blending direction, but still a human-QA judgment rather than sourced scope data.
- `k_u1_seed`: no remaining code/content references; remaining hits are historical docs.
- CI: PR #34 `verify` and Workers builds are green.

## Verdict

- Adversarial verdict: BLOCKED
- Rationale: F-1 creates a plausible route-level empty-plan state for grade-1 review users, and F-2 makes the active content internally inconsistent with the newly explicit U1 grapheme scope.
- Required follow-up actions:
  - Fix F-1 or merge skills/scope atomically with item authoring so no no-item scoped skills affect grade-1 review behavior.
  - Fix F-2 by moving `c` into U1 or replacing/remapping active `cat` content.
  - Fix or explicitly defer F-3 with evidence; F-4 can be a follow-up if accepted by the user.

## Verification evidence

- Commands run:
  - `gh pr view 34 --json number,title,headRefName,baseRefName,state,isDraft,mergeStateStatus,reviewDecision,statusCheckRollup,url,commits,files`
  - `git diff --stat main...HEAD`
  - `git diff --name-only main...HEAD`
  - `rg -n "k_u1_seed" . --glob '!node_modules' --glob '!.git'`
  - `pnpm content:validate`
  - `node --import tsx --test scripts/content-validate.test.ts`
  - `pnpm --filter api test -- src/scheduler/content.test.ts src/scheduler/planner.test.ts src/routes/practice.test.ts`
- Results:
  - PR #34 open; CI verify and Workers builds green.
  - `pnpm content:validate`: pass, 11 skills, 4 items, 3 audio entries; `phonics_skills` is 9/12.
  - `node --import tsx --test scripts/content-validate.test.ts`: pass, 4 tests.
  - Targeted API tests: pass, 33 tests. Unsandboxed rerun required because the Cloudflare/Vitest worker pool binds `127.0.0.1`.

## Unresolved risks

- The review did not independently source a formal UFLI sequence; pedagogy remains an expert QA decision.
- The no-item-skill issue may disappear once `rw-npb` lands, but it blocks independent merge of PR #34 as currently scoped.

## Round-two carry-forward

- Not applicable for Round 1.

## Downstream requirements

- Requires adversarial plan review: already completed for 002d-002h.
- Requires adversarial PR/QA review: yes; Round 1 complete.
- Ship gate note: BLOCKED until F-1 and F-2 are resolved or the user explicitly changes the merge strategy with full awareness of the inconsistent intermediate state.

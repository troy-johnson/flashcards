# Family-Safe Guardian Progress Implementation Plan

> **Execution:** Use bounded specialist subagents in dependency waves. Follow RED → GREEN → REFACTOR and review each wave before integrating it. Plan 008a may run in parallel with Plan 007a.

**Goal:** Give every authenticated guardian an understandable, responsive progress summary for an owned student without weakening operator diagnostics authorization.

**Bead:** `rw-ir1.1`
**Status:** Approved with nits after adversarial plan review round 2

## Architecture and decisions

Canonical skill metadata belongs in `content/skills.json`, beside the stable skill identifier and grade. A new guardian-safe `GET /students/:id/progress` route first verifies the authenticated guardian owns the active student, then aggregates attempts for only that student and enriches each skill row from canonical content. The student dashboard consumes this route instead of the operator-only `/guardian/diag`.

The response contract is:

```ts
type StudentProgressResponse = {
  progress: {
    total_attempts: number;
    correct: number;
    skills: Array<{
      skill_id: string;
      display_name: string;
      guardian_description: string;
      attempts: number;
      correct: number;
    }>;
  };
};
```

Every retained skill row, including a row marked `deprecated: true`, must carry nonblank display metadata because historical attempts can still reference it. Attempts whose skill ID is absent from the canonical metadata index, or whose metadata is unexpectedly blank at runtime, use `display_name: "Earlier practice"` and `guardian_description: "Practice from an earlier version of the learning sequence."` All such rows aggregate into one response row with reserved key `skill_id: "__earlier_practice__"` so families never see indistinguishable duplicate fallback rows. The family UI never renders `skill_id` as a label.

No D1 migration is needed. `/guardian/diag`, `canUseOperatorTools`, and operator telemetry remain unchanged.

## Canonical skill copy

The implementation uses this complete provisional copy table. The owner may revise wording at the human review gate, but revisions must preserve nonblank metadata and rerun all affected tests.

| `skill_id` | `display_name` | `guardian_description` |
|---|---|---|
| `pa_k_u1_isolate_initial_sound` | Hear the first sound | Identifies the first sound in a spoken word. |
| `pa_k_u1_blend_two_sound` | Blend two sounds | Puts two spoken sounds together to make a word, such as /a/ and /t/ making “at.” |
| `phonics_k_u1_consonants_mstp` | Letters m, s, t, and p | Connects the letters m, s, t, and p with their sounds and reads words that use them. |
| `phonics_k_u1_short_a` | Short a | Recognizes the short a sound, as in “mat.” |
| `phonics_k_u1_cvc_blend_short_a` | Read short-a words | Blends consonant-vowel-consonant words with short a, such as “sat” and “map.” |
| `heart_k_u1_batch_01` | Kindergarten heart words | Reads common words with a part that does not follow the phonics patterns taught so far. |
| `fluency_k_u1_cvc_sentences` | Read short-a sentences | Reads short sentences accurately and smoothly using familiar short-a words and heart words. |
| `pa_k_u2_segment_three_sound` | Break apart three-sound words | Says each sound in a three-sound word in order. |
| `phonics_k_u2_consonants_ncdg` | Letters n, c, d, and g | Connects the letters n, c, d, and g with their sounds and reads words that use them. |
| `phonics_k_u2_short_o` | Short o | Recognizes the short o sound, as in “dog.” |
| `phonics_k_u2_cvc_blend_short_o` | Read short-o words | Blends consonant-vowel-consonant words with short o, such as “cot” and “dog.” |
| `fluency_k_u2_cvc_sentences` | Read short-o sentences | Reads short sentences accurately and smoothly using familiar short-o words and heart words. |
| `phonics_1_u1_alphabet_review` | Review letter sounds | Reviews familiar letters and the sounds they represent. |
| `phonics_1_u1_short_i` | Read short-i words | Reads words with the short i sound, as in “sit.” |
| `phonics_1_u1_short_e_u` | Read short-e and short-u words | Reads words with short e and short u sounds, such as “pet” and “sun.” |
| `heart_1_u1_batch_01` | First-grade heart words | Reads common words with a part that does not follow the phonics patterns taught so far. |
| `fluency_1_u1_short_vowel_sentences` | Read short-vowel sentences | Reads short sentences accurately and smoothly using familiar short-vowel words and heart words. |

## File surface

- Modify `content/skills.json`.
- Modify `scripts/content-validate.ts` and `scripts/content-validate.test.ts`.
- Modify `api/src/scheduler/content.ts` and `api/src/scheduler/content.test.ts`.
- Modify `api/src/routes/students.ts` and `api/src/routes/students.test.ts`.
- Modify `app/src/api/types.ts`, `app/src/api/literacy.ts`, `app/src/App.tsx`, `app/src/App.css`, and `app/src/routes/guardian.test.tsx`.
- Do not modify `api/src/routes/diag.ts`, `api/src/auth/operator-policy.ts`, migrations, attempt scoring, or scheduler selection.

## Wave 1 — Canonical metadata contract

**Specialist:** content-schema and copy implementer

- [ ] Extend validator and scheduler `Skill` types with required `display_name` and `guardian_description` for every retained skill, including deprecated rows kept for identifier history.
- [ ] In `scripts/content-validate.test.ts`, make the shared `writeSkills` helper supply valid default metadata so unrelated fixtures stay focused. Add a separate raw-write helper for missing/blank metadata failure cases.
- [ ] Add RED cases proving each field fails when missing, empty, or whitespace-only on both live and deprecated retained skills.
- [ ] Add RED scheduler tests proving canonical metadata is loaded and exposed.
- [ ] Add an injected scheduler-content case proving a retained `deprecated: true` skill keeps its canonical metadata in `content.skills`; only deprecated items are excluded from item indexes.
- [ ] Run `pnpm test:scripts` and `pnpm --filter api test -- src/scheduler/content.test.ts`; capture the expected failures.
- [ ] Add the exact provisional copy table above to `content/skills.json`.
- [ ] Implement narrow nonblank validation and scheduler typing.
- [ ] Run focused tests and `pnpm content:validate` green.

**Wave gate:** Every retained skill has both fields, negative tests fail for the intended validation reason, and no UI or API behavior has entered this wave.

## Wave 2 — Owned-student progress API

**Specialist:** API/auth-boundary implementer
**Depends on:** Wave 1

- [ ] In `api/src/routes/students.test.ts`, add RED tests for:
  - unauthenticated request returns 401;
  - owned active student with no attempts returns zero totals and an empty skill array;
  - owned student attempts aggregate correct and total counts overall and per skill;
  - rows include the canonical display name and guardian description;
  - another guardian’s student and an archived student return 404;
  - attempts for another student never enter the response;
  - one unknown historical skill receives the exact safe fallback copy;
  - multiple unknown historical skill IDs aggregate into one `__earlier_practice__` row with combined counts;
  - response objects contain exactly the documented top-level, progress, and skill-row keys;
  - known skills plus the fallback row return in `display_name`, then `skill_id`, order.
- [ ] Run `pnpm --filter api test -- src/routes/students.test.ts` and capture the expected route failure.
- [ ] Add `GET /:id/progress` in `api/src/routes/students.ts`.
- [ ] Reuse the route’s authenticated guardian middleware. Perform the same `student.id + guardian.id + archived_at IS NULL` ownership lookup before the attempt query.
- [ ] Aggregate from `attempt` as defined in `api/migrations/0001_foundation.sql`: constrain with `WHERE student_id = ?` bound to the already ownership-checked student, group by `skill_id`, count every row as an attempt, and compute correct answers with `SUM(CASE WHEN result = 'correct' THEN 1 ELSE 0 END)`.
- [ ] Compute integer overall totals by summing the raw per-skill aggregate rows before fallback rows are collapsed; fallback aggregation must not change overall totals.
- [ ] Call `loadSchedulerContent()` once at module initialization and build the route metadata index from `content.skills`; do not hand-roll another JSON import or duplicate display strings.
- [ ] Resolve metadata through a small pure helper. Known nonblank metadata passes through; absent, empty, or whitespace-only metadata maps to the exact fallback. Unit-test the helper directly for missing and blank values.
- [ ] Aggregate all fallback-resolved rows into the single reserved `__earlier_practice__` row, then sort known and fallback rows by `display_name`, then `skill_id`.
- [ ] Return only the response contract above; do not include item-level attempts, session telemetry, guardian email, friction rows, or operator data.
- [ ] Run the focused route tests and API typecheck green.

**Wave gate:** Ownership and cross-student isolation tests are green, `/guardian/diag` is untouched, and no migration exists.

## Wave 3 — Accessible responsive progress UI

**Specialist:** React/accessibility implementer
**Depends on:** Wave 2

- [ ] Add `StudentProgressResponse` client types and `getStudentProgress(studentId)` calling `/students/${studentId}/progress`.
- [ ] In `app/src/routes/guardian.test.tsx`, add `getStudentProgress` to the API mock with a valid empty default. Retain the `getGuardianDiag` mock for `/guardian/diag` tests and update sibling-navigation fixtures to satisfy the new progress call. Add RED assertions for:
  - ordinary non-operator guardians receive real progress;
  - overall `{correct} of {total_attempts} correct` and its percentage remain visible after the data-source cutover;
  - overall and per-skill counts render;
  - each row uses a native `details` and `summary`;
  - the summary shows `display_name` and `correct/attempts`;
  - expanding exposes `guardian_description`;
  - raw skill IDs are absent from visible text;
  - empty and request-error states remain distinct;
  - visiting a student dashboard does not call `getGuardianDiag`.
- [ ] Run `pnpm --filter app test -- src/routes/guardian.test.tsx` and capture the expected failures.
- [ ] Remove the local `StudentProgress` type, `summarizeForStudent`, and the dashboard’s `getGuardianDiag()` call from `app/src/App.tsx`. Keep `getGuardianDiag()` only for `GuardianDiagRoute`.
- [ ] Fetch `getStudent(studentId)` and `getStudentProgress(studentId)` together; an error in either produces the existing progress-page error state rather than fabricated empty data.
- [ ] Render a progress-specific list of native disclosures. Preserve `<summary>` as its native list-item so WebKit/Blink retain the visible disclosure marker; place the name and score in an inner `.progress-skill-summary-grid`.
- [ ] Add scoped `.progress-skill-list`, `.progress-skill-card`, `.progress-skill-summary-grid`, `.progress-skill-name`, `.progress-skill-score`, and `.progress-skill-description` CSS. The inner grid uses `minmax(0, 1fr)` for the label; the label uses `min-width: 0` and `overflow-wrap: anywhere`; the score uses `white-space: nowrap`. Do not alter the generic student-list layout unless a regression test proves it is required.
- [ ] Run focused app tests and app typecheck green.

## Wave 4 — Integration, device, and human verification

**Specialists:** integration verifier, automated browser reviewer, owner physical-device/accessibility/copy reviewer
**Depends on:** Wave 3

- [ ] Run:

  ```bash
  pnpm content:validate
  pnpm test:scripts
  pnpm --filter api test
  pnpm --filter app test
  pnpm -r typecheck
  pnpm --filter app build
  git diff --check
  ```

- [ ] With browser automation at 320, 375, 768, and 1280 CSS pixels, capture evidence of no horizontal page scroll, clipped row border, overlapping score, unreadable wrapped label, or missing disclosure marker.
- [ ] Using a non-operator guardian, verify owned-student progress loads and another guardian’s student cannot be fetched.
- [ ] Automated tests verify native `details`/`summary` structure, keyboard activation where supported by jsdom/browser automation, the inner-grid hook, and absence of unnecessary ARIA.
- [ ] Confirm Diagnostics remains hidden from non-operators and direct `/guardian/diag` access remains 403.
- [ ] Record viewport, accessibility, auth-boundary, and copy-review evidence on `rw-ir1.1`.

## Human review gate

Before merge, the owner reviews all 17 display names, descriptions, and the fallback copy in context at mobile width. On physical Safari with VoiceOver, the owner verifies that each summary is announced as expandable/collapsed, activates with expected controls, preserves a visible affordance, and exposes the description in reading order. Record reviewer, device/browser, date, revision, requested edits, and pass/fail on `rw-ir1.1`. Copy revisions return to Wave 1 and rerun Waves 2–4 where snapshots or rendered output change.

## Rollback

Revert the dashboard to its prior presentation only with an explicit safe progress source; do not restore the silent diagnostics-403 fallback. The additive API route and metadata can remain without affecting practice. If the endpoint is removed, remove its client call in the same release.

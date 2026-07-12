# Caregiver-Ready Phonemic Awareness Implementation Plan

> **Execution:** Use bounded specialist subagents task-by-task with review between tasks. Follow RED → GREEN → REFACTOR. Plan 006a runs in Wave 2 and may proceed in parallel with Plan 004a.

**Goal:** Replace specialist shorthand with explicit adult and child instructions while preserving saved-card compatibility and practice behavior.

**Bead:** `rw-gmi`
**Spec:** [006-caregiver-ready-phonemic-awareness](../specs/006-caregiver-ready-phonemic-awareness.md)
**Status:** Approved (adversarial plan review round 2)

## Architecture

Add canonical `guardian_script` and `student_task` strings to live `pa_` content. Validation rejects missing/blank canonical fields. Scheduler normalization and planner projection carry them into new plan cards. The app renders separate adult/child regions when both exist; cards saved before this change fall back to existing `text`/`answer`. No database or local-storage migration occurs.

## File surface

- Modify `content/items/seed.json`.
- Modify `scripts/content-validate.ts` and `content-validate.test.ts`.
- Modify `api/src/scheduler/content.ts`, `content.test.ts`, `planner.ts`, and `planner.test.ts`.
- Modify `api/src/routes/practice.test.ts` if needed for serialized propagation.
- Modify `app/src/api/types.ts`, `components/cards/DrillCard.tsx`, `cardCopy.ts`, `cards.test.tsx`, and `App.css`.
- Record review evidence on bead `rw-gmi`; do not create markdown task tracking.

## Task 1 — Enforce the canonical content contract

**Specialist:** content-schema specialist

- [ ] Extend the validator `Item` type with optional `answer`, `guardian_script`, and `student_task`.
- [ ] Add RED fixtures proving every live `pa_` item fails when any field is missing, empty, or whitespace-only. Non-PA and deprecated PA items remain unaffected.
- [ ] Add a passing fixture with all three nonblank fields and preserve existing prompt/text validation.
- [ ] Run `pnpm test:scripts` and observe RED.
- [ ] Implement the narrow PA validation.
- [ ] Update `pa_k_u1_blend_at`, retaining `prompt` and `answer`, with exact provisional values:

  ```json
  {
    "guardian_script": "Say, ‘/a/ /t/.’ Stretch /a/ slightly, then say /t/ right after it.",
    "student_task": "Your child puts the sounds together and says the word."
  }
  ```

- [ ] These strings make implementation deterministic but are not release-approved. Task 5 may revise them; any revision reruns affected validation, propagation, rendering, and viewport evidence.
- [ ] Run `pnpm test:scripts` and `pnpm content:validate` green.

## Task 2 — Propagate fields through scheduler and API

**Specialist:** scheduler/API specialist

- [ ] Add RED content-loader tests proving both fields survive normalization and remain absent when unauthored.
- [ ] Add RED planner tests proving both fields appear on PA cards and are omitted from unrelated cards.
- [ ] Extend a practice-route assertion to prove start-response serialization.
- [ ] Run the focused scheduler/planner/practice tests and observe RED.
- [ ] Extend `RawItem`, `PlanCard`, and `toCard` with optional fields. Keep them additive; never recompute or concatenate instructions in the client.
- [ ] Run focused tests and API typecheck green.

## Task 3 — Render adult and child roles with legacy fallback

**Specialist:** React/instructional-UX specialist

- [ ] Extend client `PracticeCard` with optional fields.
- [ ] Add RED card tests for visible “What you say” and “What your child does” labels, exact authored strings, expected answer, and preserved scoring controls.
- [ ] Assert canonical rendering does not use the old raw prompt as its primary instruction.
- [ ] Add a RED legacy case containing only `text`, PA `kind`, and `answer`; assert the existing prompt/answer experience remains usable.
- [ ] Retain score-once and reset-on-rejection regression assertions.
- [ ] Run focused card tests and observe RED.
- [ ] Add role labels to `cardCopy.pa`; render the two-region canonical layout only when both fields exist, otherwise use the legacy fallback.
- [ ] Add restrained CSS hooks. Instructional strings stay in content, not `packages/copy`.
- [ ] Run focused tests and app typecheck green.

## Task 4 — Cross-layer and viewport verification

**Specialist:** integration reviewer

- [ ] Run:

  ```bash
  pnpm content:validate
  pnpm test:scripts
  pnpm --filter api test
  pnpm --filter app test
  pnpm -r typecheck
  git diff --check
  ```

- [ ] At 320, 375, 768, and 1280 CSS pixels, verify adult, child, and answer regions remain distinct without clipping or horizontal scroll.
- [ ] Exercise Correct, Try again, Skip, resume, and completion on canonical and constructed legacy PA cards.
- [ ] Confirm no migration, scoring, scheduler-selection, audio-recording, or non-PA behavior entered the diff.

## Task 5 — Instructional review gates

**Specialists:** product/curriculum reviewer for family gate; SLP for educator gate

- [ ] Before family rollout, record on `rw-gmi` reviewer identity, date, exact content revision, pass/fail, and all five Spec 006 readability-rubric results.
- [ ] A failed item returns wording to Task 1 and reruns affected Tasks 1–4.
- [ ] Before educator rollout, record SLP name and role/credential, date, exact content revision, scope, requested changes, and pass/fail.
- [ ] Only a passing SLP result opens educator rollout. Family approval does not imply educator approval; SLP availability does not block the family wave.

## Rollback

Restore legacy PA rendering; additive fields may remain. No saved-state migration or rollback is required.

## Combined Wave 3 gate

After Plan 005a and both Wave 2 plans pass:

```bash
pnpm content:validate
pnpm audio:manifest:check
pnpm -r test
pnpm test:scripts
pnpm -r typecheck
pnpm --filter app build
git diff --check
git status --short
```

Map every Spec 004–006 acceptance criterion to automated, inspection, device, security, deployment, or instructional evidence. External review gates remain rollout blockers; they are not silently converted into implementation success.

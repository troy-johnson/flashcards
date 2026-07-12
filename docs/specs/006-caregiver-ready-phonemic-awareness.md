# Caregiver-Ready Phonemic Awareness

**Bead:** `rw-gmi`
**Planning bead:** `rw-15y`
**Status:** Approved (adversarial review round 3)
**Date:** 2026-07-11

> Adversarial verdict: **APPROVED** after two standard rounds and one user-approved confirmation round. Evidence: [round 1](../../.agents/snapshots/family-device-specs-adversarial-review-round-1-2026-07-11.md), [round 2](../../.agents/snapshots/family-device-specs-adversarial-review-round-2-2026-07-11.md), [round 3](../../.agents/snapshots/family-device-specs-adversarial-review-round-3-2026-07-11.md).

## Goal

Make phonemic-awareness activities understandable and actionable for caregivers who are not teachers or speech-language pathologists.

The instructional approach follows the research packet in [`2026-07-11-family-device-qa-remediation-research.md`](../research/2026-07-11-family-device-qa-remediation-research.md): the adult presents isolated sounds, the child blends them, and the adult records the result. Source claims and limitations are registered in [`docs/research/SOURCES.md`](../research/SOURCES.md).

## Scope

### Goals

- Replace nebulous prompts such as “Blend /a/ and /t/” with explicit adult directions and a separate child task.
- Preserve concise, distraction-free practice screens.
- Make the expected response clear without requiring knowledge of instructional terminology or slash notation.
- Establish a reusable content contract for future phonemic-awareness items.
- Require curriculum review before family use and SLP review before educator use.

### Non-goals

- Teaching caregivers phonetics or linguistic notation.
- Replacing the existing content sequence.
- Automatically evaluating a child's speech.
- Requiring new audio recordings for this change.
- Rewriting non-phonemic-awareness practice modes.

## Canonical Content Contract

Canonical phonemic-awareness items require three nonblank instructional fields:

```ts
type PhonemicAwarenessInstruction = {
  guardian_script: string;
  student_task: string;
  answer: string;
};
```

- `guardian_script` is exactly what the adult should say or do.
- `student_task` is a short, plain-language explanation of what the child should do.
- `answer` is the expected blended word used by the adult to judge the attempt.
- These fields are instructional content and remain in validated content data, not brand-copy packages.
- Canonical phonemic-awareness content fails validation when either instruction field or the answer is missing or blank.

For the current activity, reviewed wording must convey the equivalent of:

- Adult: “Say the sounds slowly without adding a pause: /a/ … /t/.”
- Child: “Put the sounds together and say the word.”
- Expected answer: “at.”

The exact production wording is subject to the review gates below; this example defines intent, not unreviewed final copy.

## Screen Behavior

- Label the adult direction clearly, such as “What you say.”
- Label the child direction clearly, such as “What your child does.”
- Keep the expected answer available to the adult without making technical jargon the primary instruction.
- Preserve Correct, Try again, and Skip behavior.
- The practice plan/API carries `guardian_script` and `student_task` through to the active card without recomputing instructional copy in the client.
- Previously saved cards without the new fields continue using the legacy prompt and answer.
- No local-storage or database migration is required.

## Review Gates

- The first production wording requires owner/curriculum approval before the family pilot wave.
- An SLP reviews the instructional wording before the educator pilot wave.
- Review applies to the instructional contract and wording, not to automated speech scoring, which is out of scope.
- The owner/curriculum approval is recorded on bead `rw-gmi` and must explicitly confirm this rendered-card rubric:
  1. the reviewer can identify the exact words/actions expected from the adult;
  2. the reviewer can identify the child's task;
  3. the reviewer can identify the expected answer;
  4. the primary instructions contain no unexplained specialist term or reliance on slash-notation knowledge beyond the sounds the adult is told to say; and
  5. the adult, child, and answer information remain distinct at 320, 375, 768, and 1280 CSS pixels.
- The SLP approval is also recorded on bead `rw-gmi`. It identifies the reviewer's name and SLP role/credential, review date, exact wording/content revision, instructional scope reviewed, requested changes if any, and pass/fail result. Only a passing result satisfies the educator-pilot gate.

## Preserve

- Correct, Try again, Skip, resume, and completion behavior.
- Existing scheduling, scoring, and attempt storage.
- Legacy saved-card readability through the prompt/answer fallback.
- Other practice-mode content contracts and rendering.

## Acceptance Criteria

1. The named owner/curriculum reviewer records a passing result for every readability-rubric item on bead `rw-gmi` before the family pilot.
2. Canonical phonemic-awareness items cannot pass validation without nonblank `guardian_script`, `student_task`, and `answer`.
3. The practice API carries both instruction fields through to the active card.
4. The client renders the adult and child roles distinctly at 320, 375, 768, and 1280 CSS pixels without clipping or horizontal scrolling.
5. Legacy saved cards remain usable through the documented prompt/answer fallback.
6. Correct, Try again, Skip, resume, and completion behavior remain unchanged.
7. The first production wording receives owner/curriculum approval before the family pilot.
8. An SLP reviews the instructional wording before the educator pilot.

## Verification

- Content-schema tests and negative validation fixtures for missing, empty, and whitespace-only fields.
- API/planner propagation tests covering new canonical fields and legacy saved-card payloads.
- Client tests for role labels, canonical rendering, and the legacy fallback.
- Regression tests for answer actions, resume, and completion.
- A recorded owner/curriculum review against all five rubric items, including rendered-card checks at 320, 375, 768, and 1280 CSS pixels; the bead note identifies the reviewer, date, wording/content revision, and pass/fail result.
- Before the educator pilot, a recorded SLP review on bead `rw-gmi` identifies reviewer/role, date, wording/content revision, instructional scope, changes requested, and pass/fail result; verification confirms the result is passing.

Rollback can restore the legacy rendering without changing saved practice state. The additive content fields may remain present if the UI rolls back.

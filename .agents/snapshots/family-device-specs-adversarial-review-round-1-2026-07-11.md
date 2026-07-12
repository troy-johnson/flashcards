# Family-Device Specs Adversarial Review — Round 1

**Target:** Specs 004, 005, and 006
**Profile:** `spec`
**Date:** 2026-07-11
**Final verdict:** **BLOCKED**

## Review execution

Two independent fresh-context reviews were run from [`family-device-specs-review-packet-2026-07-11.md`](family-device-specs-review-packet-2026-07-11.md).

- Planned model: `anthropic/claude-opus-4-6`, Claude subscription CLI, high effort. Both invocations failed before inference because the OAuth session was expired.
- First fallback: `google-vertex-anthropic/claude-opus-4-6@default`, OpenCode. The model ID was verified by `opencode models`, but both invocations failed before inference because local Google application-default credentials were absent.
- Successful model: `openai/gpt-5.5`, OpenCode subscription transport, verified by a successful model probe.
- Reviewer 1 role: requirement completeness and scope control.
- Reviewer 2 role: acceptance-testability, accessibility, security, and cross-spec boundaries.

No failed invocation produced review evidence.

## Synthesized findings

### Blockers

1. **Spec 004 post-create focus is unspecified.** The redirect, status announcement, and row emphasis do not define where focus lands after the SPA route transition. Add a deterministic focus destination, one-time announcement behavior, acceptance criterion, and test.
2. **Spec 004 accessibility verification is incomplete.** Component assertions alone do not establish real assistive-technology behavior. Define menu name/state/focus/keyboard outcomes and require a VoiceOver/Safari or equivalent smoke check.
3. **Spec 004 exit timing is ambiguous.** Define outcomes before submission, after Correct/Try again/Skip has been recorded, and after reload. The exit action itself must never mutate progress; resume uses the current server-selected unanswered card.
4. **Spec 006 caregiver readability is not deterministic.** Define a review rubric and recorded owner/curriculum approval artifact that verifies adult script, child task, and expected answer are identifiable without specialist knowledge.

### Accepted nits

1. Define invalid operator configuration more precisely in Spec 005.
2. Replace vague viewport wording with the established 320/375/768/1280 CSS-pixel coverage envelope in Specs 004 and 006.

### Rejected findings

None.

### Cross-spec synthesis

No contradiction was found. Spec 004's operator-link behavior correctly depends on Spec 005. Spec 006 remains bounded to PA content and rendering.

## Raw reviewer 1 output

**Verdict:** BLOCKED

Blockers:

1. Spec 004 student creation does not specify post-navigation focus/location behavior, despite research identifying that SPA transitions do not announce themselves. Add a deterministic focus target and one-time status test.
2. Spec 006's core caregiver-understanding outcome has no deterministic reviewer, checklist, sample, or pass/fail artifact. Define an objective owner/curriculum gate.

Nits:

1. Spec 004 names 320 px and a representative iPhone but omits the established 375/768/1280 regression envelope.
2. Spec 006 uses undefined “supported mobile widths.”

Cross-spec check: no contradiction. AC coverage incomplete for post-create focus and caregiver readability.

## Raw reviewer 2 output

**Verdict:** BLOCKED

Blockers:

1. Spec 006 AC1 is subjective; define required role labels, jargon constraints, answer visibility, and recorded owner/curriculum approval.
2. Spec 004 requires assistive-technology support without requiring an actual AT smoke check; specify accessible name, `aria-expanded`, open/close focus behavior, keyboard close, and VoiceOver/Safari or equivalent.
3. Spec 004's “after answering” exit state is ambiguous; define timing for pre-submit, post-action feedback/current-card transition, skip, and reload, with exact progress and resume outcomes.

Nit:

1. Spec 005 does not define “invalid” configuration beyond missing/blank.

Cross-spec check: no contradiction. AC coverage incomplete for Spec 006 AC1 and Spec 004 AC2/AC6.

## Next action

Return to the spec-owning workflow, remediate all accepted findings without changing approved product direction, and run a fresh-context round-2 adversarial spec review.

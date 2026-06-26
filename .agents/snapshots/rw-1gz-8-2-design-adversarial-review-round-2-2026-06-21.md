# rw-1gz.8.2 Audio Design — Independent Adversarial Review Round 2

**Date:** 2026-06-21
**Reviewer:** Independent Codex subagent
**Verdict:** **BLOCKED**

Schema-v1 implementation may remain until implementation; schema-v2 migration does not
need to precede planning. Four documentary contracts required correction:

1. Recording without pre-recording SLP review was permitted, but learner-facing release was
   not clearly blocked pending post-recording SLP approval.
2. The design's production-behavior enum did not represent every value in the inventory
   table.
3. TTS pronunciation overrides had competing canonical ownership in `tts.json` and item
   `speech_text`.
4. The real-iPad TTS spike was inconsistently positioned before plan authorship and inside
   the plan.

## Remediation applied

- Recording and protected-catalog QA may proceed under explicit risk acceptance; learner
  exposure is blocked until checksum-bound SLP approval.
- Inventory production values are normalized to `clip`, `sustain`, `glide`, or `sequence`;
  nuance lives in production notes/guidance.
- `speech_text` on the affected content item is the only pronunciation-override source.
- The real-iPad spike is Phase 0 of the implementation plan and blocks final TTS
  implementation, not plan authorship.

Round 3 independent review is required before implementation planning.

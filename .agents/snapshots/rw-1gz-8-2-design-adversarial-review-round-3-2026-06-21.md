# rw-1gz.8.2 Audio Design — Independent Adversarial Review Round 3

**Date:** 2026-06-21
**Reviewer:** Independent Codex subagent
**Verdict:** **APPROVED WITH NITS**

Implementation planning may begin. Hardware, recorder, and SLP availability are plan
dependencies rather than design blockers.

## Nits resolved

1. Added `glide` to the documented production-behavior enum.
2. Made item-level `speech_text` the sole pronunciation-override source and explicitly
   deprecated the three legacy TTS manifest entries.
3. Updated the research surface-area note to reflect the revised 44-recording +
   12-mapping plan.

## Confirmed

- Learner exposure is blocked until checksum-bound SLP approval.
- The real-iPad spike is Phase 0 and blocks final TTS implementation, not plan authorship.
- Canonical/generated ownership is deterministic.
- Protected review metadata is not compiled into public frontend data.
- The 44-row inventory and 12-row mapping table are internally consistent.
- Research claims are bounded to what UFLI, IES, ASHA, IPA, and browser specifications
  actually support.

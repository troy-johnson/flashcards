# rw-1gz.8.2 Audio Design — Independent Adversarial Review

**Date:** 2026-06-21
**Artifact reviewed:** `docs/superpowers/specs/2026-06-21-audio-assets-playback-design.md`
**Reviewer:** Independent Codex subagent
**Verdict:** **BLOCKED**

## Executive summary

The design is not ready for implementation planning. It changes the accepted 56-real-asset interpretation without revising the governing ADR, plan, content manifest, or validator; defers the defining 44-row linguistic inventory; and leaves canonical-data and generated-output ownership inconsistent.

## Critical findings

### C1. The 44 recordings + 12 mappings model contradicts current requirements and validation

The accepted ADR calls for discrete pre-produced phoneme/digraph assets. Plan 002e and the implemented validator count only `phoneme_`/`digraph_` entries having real `src` values. Twelve source-less mapping records cannot satisfy the existing `v1_target: 56`.

The category is linguistically heterogeneous: `sh`, `ch`, `th`, `ng`, and `ph` can represent single phonemes; `qu` commonly represents a sequence; `ck`, `ll`, `ss`, `ff`, and `zz` are spelling patterns reusing phonemes. The IES guide supports separating speech sounds from sound–spelling patterns, but does not support summing files and metadata records under one audio count.

**Required remediation:** Either produce 56 real playback entries as the current ADR and validator require, or formally revise ADR-002, plan 002e, `content/manifest.json`, and validator semantics to use separate targets such as `recorded_phonemes: 44` and `validated_grapheme_patterns: 12`.

### C2. The defining linguistic inventory is absent and expert review occurs too late

The exact 44 entries are the core educational decision. Without the table, reviewers cannot assess vowel mergers, r-colored vowels, `/ʍ/` versus `/w/`, affricates, allophones, examples, or duplicate/missing sounds.

The binary `continuous | stop` field is inadequate phonetic metadata. Affricates are not simple stops, and instructional clip/sustain behavior is not the same as phonetic manner.

**Required remediation:** Attach the complete inventory with IPA, lexical example, dialect decision, phonetic manner, instructional production behavior, and rationale. Obtain qualified review of the inventory before beta; clip-level SLP review may remain a later gate if explicitly accepted as beta risk.

### C3. Canonical/generated ownership is not deterministic

The draft calls `inventory.json` canonical, but says generated `manifest.json` preserves manually existing TTS entries while also prohibiting hand edits. That makes generated output an implicit second input.

**Required remediation:** Define canonical inputs for sounds, patterns, and TTS declarations. Generated runtime/app outputs must be idempotent from those inputs alone.

## Important findings

1. **TTS contract drift:** Text-driven TTS makes existing per-item `audio_id`/`tts_fallback` semantics largely ceremonial. Reconcile the model and support pronunciation overrides for homographs or poor synthesis.
2. **Generation absent from CI/deployment:** Define committed generated artifacts checked by CI, or a generation step invoked by CI and deployment. Do not commit duplicate MP3 files in two locations.
3. **Static URL semantics:** Define browser sources as origin-root URLs such as `/audio/phoneme_x.ext`; validate them and inspect production `dist`.
4. **Protected metadata leakage:** If review notes are compiled into frontend JavaScript, they are public. Split the public playback index from protected review metadata, or explicitly make metadata public and exclude internal notes.
5. **Approval not bound to bytes:** Store checksums, reviewer, and timestamp. File or guidance changes must invalidate approval.
6. **TTS device spike needed:** Verify first-tap behavior, empty/delayed voices, cancellation, errors, and selected voice on a real iPad before finalizing the implementation plan.
7. **Media thresholds missing:** Compare codecs for short sounds and define measurable silence, peak, duration, clipping, size, and intelligibility requirements.
8. **Accessibility/privacy/device QA incomplete:** Add accessible names, focus/busy state, VoiceOver, headphones/Bluetooth, mute/volume, offline/slow failure, exact device/browser versions, and a prohibition on sending student identifiers or user-entered child text to TTS.

## Minor findings

- Specify the exact DJI microphone/receiver and recording device chain.
- Record device model, OS/browser version, and test date instead of saying only “current.”
- Establish an asset-size budget and reconsider committed 24-bit masters if replacements create excessive Git history.

## Source assessment

- IES supports separating speech sounds from written sound–spelling patterns; it does not establish the exact 44 inventory or a 44+12 combined count.
- ASHA supports respecting dialectal variation; it does not define this recording inventory or protocol.
- IPA supports distinguishing `/θ/` and `/ð/`; it does not resolve the remaining inventory decisions.
- Web Speech defines asynchronous voice enumeration, cancellation, and error behavior but does not guarantee Safari activation behavior after asynchronous waiting.

## Source-registry recommendation

A curated source registry is advisable, but it should extend the existing research-doc structure rather than create a competing root-level registry. Preferred location: `docs/research/SOURCES.md`, linked from `docs/research/INDEX.md`.

Every entry should include:

- stable source ID;
- evidence tier and evidence type;
- publisher/organization and authors;
- canonical URL or DOI;
- publication date and last verification date;
- population and scope;
- exact claims supported;
- claims explicitly not supported;
- limitations or controversy;
- consuming specs, ADRs, plans, or research notes; and
- owner/reviewer.

Link checking should be automated, and sources without a consuming claim should not be added.

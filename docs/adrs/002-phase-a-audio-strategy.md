# ADR 002: Phase A audio strategy

## Status

Accepted — 2026-06-06

## Context

Reader's Way is an audio-centric K–1 literacy product. Spec 002 FR16 requires audio for
44 phonemes and common digraphs (`sh`, `ch`, `th`, `wh`, `ck`, `ng`, `qu`, `ll`, `ss`,
`ff`, `zz`, `ph`) plus TTS fallback for words and sentences, targeting current iPadOS
Safari and current desktop/mobile Chrome/Safari, with playback initiated by an explicit
user gesture. The adversarial review flagged audio as the **highest implementation risk**
in Phase A (finding #11): iOS Safari blocks audio without a user gesture, autoplay policies
vary by browser, and TTS voice availability/quality differs across platforms.

Today `content/audio/manifest.json` holds only three `tts_fallback: true` entries (word/
sentence TTS); there is no phoneme/digraph audio.

Options considered for phoneme/digraph audio:

- **TTS-only** for everything (phonemes, words, sentences).
- **Recorded/sourced audio** for phonemes + digraphs, with TTS fallback for words/sentences.
- **AI-generated audio** for phonemes and words.

## Decision

Use **discrete, pre-produced audio assets for the 44 phonemes and digraphs**, with **TTS
fallback for words and sentences**.

- Phoneme/digraph audio is a fixed, small, quality-critical set — produce it as real audio
  assets (record or license a verified set), not runtime TTS. TTS pronounces isolated
  phonemes poorly and inconsistently across platforms, which directly undermines decoding
  instruction.
- Words and sentences are open-ended and numerous; TTS fallback is acceptable for Phase A
  (FR16 already specifies TTS fallback for these), with the option to add recorded audio
  for high-value items later.
- All audio playback is **initiated by an explicit user gesture** (tap), satisfying iOS
  Safari/autoplay constraints.
- Audio assets are referenced through `content/audio/manifest.json`; the content-validate
  script verifies every referenced `audio_id` resolves (existing behavior, extended by the
  content manifest count check in plan 002e).
- **Target/QA matrix:** current iPadOS Safari (primary), current desktop + mobile Chrome
  and Safari. TTS voice availability/quality is verified per-platform during pilot-device
  QA rather than assumed uniform.

## Consequences

Positive:

- Correct, consistent phoneme pronunciation — the instructional core — independent of
  platform TTS quality.
- Bounded production cost: 44 phonemes + ~12 digraphs is a small, one-time asset set.
- Words/sentences stay cheap via TTS fallback; recorded upgrades remain possible later.

Negative:

- Requires producing/sourcing and licensing a verified phoneme audio set before the
  content bar is "done."
- **The app has no audio code today** (no `Audio`/`speechSynthesis`/`audio_id` use in
  `app/src`) — both playback paths are net-new, so this is a real subsystem to build, not a
  wiring task. Sized accordingly in plan 002e Task 4.
- The current `content/audio/manifest.json` entry shape (`{ audio_id, tts_fallback? }`) has
  **no asset-path field**; real assets require a schema addition (`src`) plus validator and
  app-resolution support.
- Two playback paths (asset vs TTS) to implement and QA.
- Cross-platform gesture/autoplay handling must be tested on real devices, not assumed.

Guardrails:

- Every phoneme/digraph in the scope must have a manifest entry; the validator fails
  otherwise (enforced via the content manifest count check, plan 002e).
- No autoplay; all audio is gesture-initiated.
- Pilot-device QA on the target matrix is a release checklist item, not an assumption.

## Follow-up implementation notes

- Tracked as Beads `rw-1gz.8.2` (produce phoneme/digraph audio + gesture playback).
- Plan `docs/plans/002e-phase-a-content-bar.md` schedules audio production within the
  phased content build (K Units 1–2 first).
- Sourcing decision (record vs license) is made during 002e execution; this ADR fixes the
  *strategy* (real phoneme assets + TTS fallback + gesture playback), not the vendor.

## Review note (2026-06-07 — independent Sonnet review)

Two implementation details to carry into plan 002e Task 4 (do not invalidate the decision):
- **Web Speech voice-load race:** `speechSynthesis.getVoices()` is async (`onvoiceschanged`), and iPadOS Safari does not guarantee an English voice without configuration — the TTS path must handle the empty-voices race and pick a voice deliberately.
- **Asset licensing is a blocking checklist item:** "record or license a verified set" must be a named gate before the content bar is "done" (child/school use — unlicensed audio is a compliance risk).

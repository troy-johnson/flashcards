# ADR 002: Phase A audio strategy

## Status

Accepted — 2026-06-06

## Context

Reader's Way is an audio-centric K–1 literacy product. Spec 002 FR16 requires recorded audio
for 44 UFLI-aligned instructional sound targets, validated mappings for the grapheme patterns
`sh`, `ch`, `th`, `wh`, `ck`, `ng`, `qu`, `ll`, `ss`, `ff`, `zz`, and `ph`, plus TTS
fallback for words and sentences, targeting current iPadOS
Safari and current desktop/mobile Chrome/Safari, with playback initiated by an explicit
user gesture. The adversarial review flagged audio as the **highest implementation risk**
in Phase A (finding #11): iOS Safari blocks audio without a user gesture, autoplay policies
vary by browser, and TTS voice availability/quality differs across platforms.

At the time of this decision, `content/audio/manifest.json` held only three
`tts_fallback: true` entries and there was no recorded instructional audio. The schema-v2
migration retires those ceremonial IDs in favor of text-driven TTS with optional authored
pronunciation overrides.

Options considered for instructional sound audio:

- **TTS-only** for everything (phonemes, words, sentences).
- **Recorded/sourced audio** for instructional sound targets, with separate sound–spelling
  mappings and TTS fallback for words/sentences.
- **AI-generated audio** for sound targets and words.

## Decision

Use **44 discrete, pre-produced audio assets for the UFLI-aligned instructional sound
inventory**, **12 validated grapheme-pattern mappings that reuse those assets**, and
**whole-item TTS fallback for words and sentences**.

- Instructional sound audio is a fixed, small, quality-critical set — produce it as real audio
  assets (record or license a verified set), not runtime TTS. TTS pronounces isolated
  sounds poorly and inconsistently across platforms, which directly undermines decoding
  instruction.
- The “44” is an instructional scope aligned to the UFLI sound wall, not a universal
  linguistic claim. Some targets are dialect-sensitive or instructionally grouped.
- Grapheme patterns are not additional audio files. A mapping may reuse one recording
  (`ck` → `/k/`), select among variants (`th` → `/θ/` or `/ð/`), or reference an ordered
  sequence (`qu` → `/k/` + `/w/`).
- Words and sentences are open-ended and numerous; TTS fallback is acceptable for Phase A
  and speaks the displayed text (or an explicit pronunciation override), with the option
  to add recorded audio for high-value items later.
- All audio playback is **initiated by an explicit user gesture** (tap), satisfying iOS
  Safari/autoplay constraints.
- Canonical audio definitions live in `content/audio/sounds.json` and
  `content/audio/patterns.json`. Optional TTS pronunciation overrides live only as
  `speech_text` on the affected content item. A deterministic generator produces the
  public runtime manifest and never preserves undeclared data.
- Public playback URLs are origin-root paths. Operational review metadata is served only
  through the existing designated diagnostics-guardian authorization gate.
- Review approval is bound to the reviewed guidance and media bytes by checksum.
- **Target/QA matrix:** current iPadOS Safari (primary), current desktop + mobile Chrome
  and Safari. TTS voice availability/quality is verified per-platform during pilot-device
  QA rather than assumed uniform.

## Consequences

Positive:

- Correct, consistent phoneme pronunciation — the instructional core — independent of
  platform TTS quality.
- Bounded production cost: 44 recordings plus 12 metadata mappings is a small, one-time set.
- Words/sentences stay cheap via TTS fallback; recorded upgrades remain possible later.

Negative:

- Requires producing/sourcing and documenting provenance for a verified sound set before the
  content bar is "done."
- **The app has no audio code today** (no `Audio`/`speechSynthesis`/`audio_id` use in
  `app/src`) — both playback paths are net-new, so this is a real subsystem to build, not a
  wiring task. Sized accordingly in plan 002e Task 4.
- The original `content/audio/manifest.json` entry shape (`{ audio_id, tts_fallback? }`)
  has no asset-path or integrity metadata. Schema v2 requires origin-root playback URLs,
  hashes, separate sound/mapping categories, validator support, and app resolution.
- Recorded-asset playback, whole-item TTS, deterministic generation, and protected QA
  metadata all require implementation and verification.
- Cross-platform gesture/autoplay handling must be tested on real devices, not assumed.

Guardrails:

- All 44 sound targets and 12 grapheme mappings must be present in canonical data. The
  validator counts them independently and fails missing, duplicate, unresolved, stale,
  or checksum-invalid entries.
- No autoplay; all audio is gesture-initiated.
- Playback failure must never score, advance, or block a practice card.
- No student identifiers or user-entered child text may be sent to browser TTS.
- Pilot-device QA on the target matrix is a release checklist item, not an assumption.

## Follow-up implementation notes

- Tracked as Beads `rw-1gz.8.2` (produce instructional sound audio + gesture playback).
- Plan `docs/plans/002e-phase-a-content-bar.md` schedules audio production within the
  phased content build (K Units 1–2 first).
- The beta sourcing decision is a consistent adult recording captured with an external
  microphone. The exact inventory and pronunciation guide should receive SLP review before
  recording when feasible. If that review cannot be scheduled, recording and protected
  internal/catalog QA may proceed as an explicitly documented beta risk; the inventory and
  files remain replaceable under stable IDs. No recorded clip is exposed to learners until
  checksum-bound SLP approval is recorded for that clip and guidance.

## Review note (2026-06-07 — independent Sonnet review)

Two implementation details to carry into plan 002e Task 4 (do not invalidate the decision):
- **Web Speech voice-load race:** `speechSynthesis.getVoices()` is async (`onvoiceschanged`), and iPadOS Safari does not guarantee an English voice without configuration — the TTS path must handle the empty-voices race and pick a voice deliberately.
- **Provenance and consent are blocking checklist items:** the recorder's permission and
  asset provenance must be documented before the content bar is done.

## Revision note (2026-06-21 — inventory research and independent adversarial review)

The earlier wording implied approximately 56 physical audio files and treated grapheme
patterns as extra sounds. Research and independent review rejected that model. The revised
decision separates 44 UFLI-aligned instructional recordings from 12 grapheme-pattern
mappings and requires independent manifest categories. Supporting research:
`docs/research/2026-06-21-audio-inventory-and-architecture-research.md`.

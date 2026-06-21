# Audio Assets and Playback Design

**Bead:** `rw-1gz.8.2`
**Status:** Approved with nits resolved after three independent review rounds
**Date:** 2026-06-21

> Round 1 independent review verdict: **BLOCKED**. See
> `.agents/snapshots/rw-1gz-8-2-design-adversarial-review-2026-06-21.md`.
> Round 2 identified four documentary contract ambiguities; remediation is recorded at
> `.agents/snapshots/rw-1gz-8-2-design-adversarial-review-round-2-2026-06-21.md`.
> Round 3 verdict: **APPROVED WITH NITS**; nits resolved. See
> `.agents/snapshots/rw-1gz-8-2-design-adversarial-review-round-3-2026-06-21.md`.

## Goal

Deliver the Phase A audio bar:

- 44 bundled, pre-produced UFLI-aligned instructional sound targets;
- 12 separately validated grapheme-pattern mappings;
- gesture-initiated text-to-speech (TTS) for displayed words and sentences;
- a production-accessible, admin-only catalog for reviewing every recorded asset; and
- a reproducible recording, processing, validation, and review workflow.

This work does not add microphone capture or automatic speech scoring. Future scoring evaluation is tracked by `rw-gx3`. Playback and scoring must remain separate boundaries.

## Decisions

### Delivery architecture

Use bundled static assets for beta rather than Cloudflare R2.

- Commit lossless WAV masters for reproducible reprocessing.
- Commit optimized browser playback files.
- Keep sound definitions and grapheme mappings as separately canonical validated data.
- Use one client playback service for recorded assets and browser TTS.
- Protect the operational catalog with the existing designated diagnostics guardian gate, `DIAG_GUARDIAN_EMAIL`.

The audio files themselves are ordinary public static assets. The catalog is protected because it is an operational QA surface, not because generic speech sounds are confidential.

### Beta recording and review

- Another adult records the assets with a DJI Mini external microphone.
- The recording reference is the explicit UFLI-aligned instructional inventory in
  `docs/research/2026-06-21-audio-inventory-and-architecture-research.md`. It is rhotic and
  records UFLI's declared contrasts, including dialect-sensitive targets. The product must
  not describe this as “accent-neutral,” “universal English,” or a diagnostic norm.
- Clips contain only the isolated sound: no letter name, keyword, or instruction.
- Continuous sounds are sustained briefly. Stop sounds are clipped cleanly without an added schwa.
- Distinct instructional sounds receive distinct entries, including `/θ/` and `/ð/`.
- Beta approval requires recorder self-check and product-owner review.
- SLP review of the inventory and production guide is sought before recording. If scheduling
  makes that impossible, recording may proceed as an explicitly accepted beta risk, but
  only the protected catalog/internal QA may use the resulting clips. No clip may be exposed
  to learners until SLP approval is checksum-bound to that clip and its guidance.

### Beta learner experience

The practice audio button speaks the whole displayed word or sentence with TTS. It does not provide phoneme-by-phoneme scaffolding in this task.

The 44 recorded sound assets and 12 grapheme-pattern mappings are delivered and reviewed through the protected catalog. They remain ready for a later phoneme-scaffolding feature without requiring ID or file migration.

## Architecture

### Canonical source graph

There are two canonical audio inputs:

- `content/audio/sounds.json` — 44 UFLI-aligned sound definitions, asset metadata, and
  checksum-bound review records;
- `content/audio/patterns.json` — 12 required grapheme-pattern mappings.

Optional TTS pronunciation overrides are canonical `speech_text` fields on content items.
There is no separate `tts.json`, duplicate override registry, or precedence rule.

The exact 44-row and 12-row review packet is
`docs/research/2026-06-21-audio-inventory-and-architecture-research.md`.

Sound entries contain:

```ts
type InstructionalSound = {
  sound_id: string;
  instructional_label: string;
  ipa: string;
  example_word: string;
  phonetic_class: string;
  production_behavior: "clip" | "sustain" | "glide" | "sequence";
  production_notes: string;
  dialect_notes: string;
  recording_guidance: string;
  master_path?: string;
  master_sha256?: string;
  playback_url?: string;
  playback_sha256?: string;
  reviews: ReviewRecord[];
};

type ReviewRecord = {
  kind: "recorder" | "owner" | "slp";
  reviewer: string;
  reviewed_at: string;
  status: "approved" | "changes_requested";
  subject_sha256: string;
  notes?: string;
};
```

`subject_sha256` covers the linguistic guidance, processing-profile version, master hash,
and playback hash. A changed file or changed production guide invalidates prior approval.

Pattern mappings contain:

```ts
type GraphemePatternMapping = {
  mapping_id: string;
  grapheme: string;
  sound_ids: string[];
  example_words: string[];
  behavior: "single" | "variants" | "sequence";
  notes?: string;
};
```

Canonical data must contain exactly 44 sounds and 12 mappings for `sh`, `ch`, `th`, `wh`,
`ck`, `ng`, `qu`, `ll`, `ss`, `ff`, `zz`, and `ph`.

Mappings reuse sound assets rather than duplicating recordings:

- `th` maps to both `/θ/` and `/ð/`;
- `qu` maps to the ordered sequence `/k/` + `/w/`;
- doubled spellings such as `ll`, `ss`, `ff`, and `zz` reuse the applicable consonant phoneme; and
- any pattern with pronunciation variants maps to every explicitly supported variant.

The number 44 is the Phase A instructional scope required by Spec 002, not a claim that
every English dialect has one universal 44-phoneme inventory. Some UFLI targets are
instructionally grouped or dialect-sensitive.

`content/audio/manifest.json` is a committed generated public runtime index. It is derived
only from the two canonical audio inputs and contains sound IDs, origin-root playback URLs, and
hashes. It contains no internal review notes and never preserves undeclared old entries.

### File layout

```text
content/audio/
  sounds.json
  patterns.json
  manifest.json
  masters/
    sound_*.wav
  playback/
    sound_*.<selected-codec>
  takes/
    .gitkeep
scripts/
  audio-process.ts
  audio-manifest.ts
app/public/audio/
  .gitignore
```

Raw unselected takes are not committed. Selected lossless masters and one set of optimized
playback files are committed under `content/audio/`. The app prebuild cleans and stages
playback files into gitignored `app/public/audio/`; the app build then emits `dist/audio/`.
CI verifies final count and hashes. Playback files are never committed twice.

### Practice-card contract

Practice cards carry displayed `text` and optional `speech_text`. TTS must not depend on all
281 current items gaining an `audio_id`; the three ceremonial TTS IDs are removed during
migration.

The app audio module exposes a narrow interface:

```ts
type PlaybackRequest =
  | { kind: "recorded"; audioId: string }
  | { kind: "tts"; text: string };

type PlaybackResult =
  | { status: "played" }
  | { status: "unavailable"; reason: string }
  | { status: "failed"; reason: string };
```

The child-facing practice card sends `{ kind: "tts", text: card.speech_text ?? card.text }`.
The catalog sends `{ kind: "recorded", audioId }`. `speech_text` is authored instructional
content only; student identifiers, names, and user-entered child text are prohibited.

This boundary prevents future microphone capture and scoring from becoming coupled to output playback.

### Protected catalog

Add `/guardian/audio-catalog` to the app.

The route:

- requires an authenticated guardian session;
- calls `GET /guardian/audio-catalog`, which permits only the guardian whose email equals `DIAG_GUARDIAN_EMAIL`;
- receives full inventory and operational review metadata only after server authorization;
- renders all 44 sound entries and all 12 mappings with IPA, example words, variants, review state, and tap-to-play controls for their referenced sounds;
- supports one active clip at a time; and
- presents playback errors per entry without blocking the rest of the catalog.

Authorization is enforced server-side. Hiding the navigation link is not an authorization
mechanism. The public SPA bundle contains only playback-resolution data, not reviewer
identity, notes, or approval records. No new admin role, account type, or feature-flag
system is introduced for beta.

## Recording and Processing Workflow

### Capture

1. Finalize the 44-row recording sheet and 12-row mapping sheet from the research artifact.
2. Seek SLP approval of the inventory and production guide. If unavailable, record explicit
   beta-risk acceptance before capture.
3. Document the exact DJI transmitter/microphone, receiver, recording device, format, gain,
   distance, and room.
4. Record in a quiet, soft-furnished room at 48 kHz, 24-bit, mono WAV.
5. Record multiple takes per entry.
6. Slate or name takes deterministically using the stable `sound_id`.
7. Select one take per entry after recorder self-check.

### Processing

The batch script:

1. validates input sample rate, bit depth, and channel count;
2. trims leading and trailing silence;
3. applies short fades only when measured and listening QA show they are needed;
4. enforces documented silence, duration, true-peak, clipping, and size thresholds;
5. avoids long-form integrated-loudness assumptions for subsecond clips;
6. avoids denoising, compression, pitch alteration, or effects unless a source problem is documented;
7. writes a lossless selected master;
8. encodes the codec selected by the representative-clip spike; and
9. updates or verifies hashes and the generated runtime manifest.

Before selecting a codec or thresholds, compare WAV, AAC, Opus, and MP3 on representative
stop, fricative, affricate, nasal, and vowel clips in target browsers. Processing must be
deterministic and rerunnable. Required local tooling, including `ffmpeg`, must be checked
explicitly with a useful setup error.

### Review states

An entry is beta-ready only when:

- its files exist;
- automated technical checks pass;
- recorder and owner approval records match the current `subject_sha256`; and
- any changes requested by available pre-recording SLP review are resolved.

If pre-recording SLP review could not be obtained, internal status records
`slp_pending_risk_accepted`. Recording, processing, and protected-catalog QA may continue,
but learner-facing resolution excludes every pending sound. Each sound must receive
checksum-bound SLP approval—or be replaced and approved—before any student practice surface
can play it.

## Playback Behavior

### Recorded assets

- Playback starts only inside a user tap handler.
- Starting a new clip stops the active clip.
- Recorded playback resolves only known inventory IDs.
- Missing or failed assets return a typed failure; they do not throw into the route.

### Text-to-speech

- Practice playback starts only from an explicit tap.
- Starting new speech cancels any current utterance.
- A real-iPad spike determines whether waiting for asynchronous voice population after a
  tap preserves reliable playback authorization. The implementation follows the observed
  safe path rather than assuming it.
- It prefers an English voice deterministically and falls back to the browser default.
- If Web Speech is unsupported, times out, or emits an error, the card stays fully scorable and displays restrained retry guidance.
- TTS input is authored `speech_text ?? text`, not an `audio_id`.
- `played` means playback actually started; completion is tracked separately where needed.
- Event listeners and timeouts are cleaned up on completion, cancellation, unmount, or error.

No autoplay, automatic replay, or scoring effect is permitted.

## Validation

Extend `pnpm content:validate` or a called audio validator to fail when:

- schema v2 does not contain exactly 44 sound entries and 12 grapheme-pattern mappings;
- the sound and mapping category counts do not match their declared targets;
- IDs, grapheme/variant identities, or playback paths are duplicated;
- required metadata is empty;
- a non-TTS runtime manifest entry lacks a real source;
- a required master or playback file is missing;
- a browser URL is not an origin-root `/audio/...` URL;
- recomputed hashes do not match;
- an approval record does not match the current review subject;
- a generated runtime manifest differs from canonical inventory output;
- a beta-required review flag is false; or
- `content/manifest.json` does not independently satisfy
  `recorded_sound_targets: 44` and `grapheme_pattern_mappings: 12`.

The one-time schema-v1 to schema-v2 migration is explicit and does not weaken normal target
immutability. The validator may allow the explicit beta SLP-risk state while surfacing the
outstanding gate; post-beta validation fails it.

## Error Handling

- A failed TTS or recorded playback attempt never advances, scores, or blocks a card.
- Repeated taps are serialized by cancelling prior playback.
- Catalog failures are isolated to the affected row.
- Unsupported TTS produces an accessible message and leaves guardian controls enabled.
- TTS requests contain no student identity or user-entered child text. Documentation
  acknowledges that browser voices may be local or remotely implemented.
- Authorization failures return 401 for no session and 403 for a signed-in non-admin guardian.
- Manifest or file-integrity failures stop validation and deployment.

## Testing and Verification

### Automated

- Inventory schema, exact counts, uniqueness, file existence, and generated-manifest tests.
- Processing-script tests using small fixtures for deterministic output naming, media-threshold failures, hashes, and validation failures.
- Playback-service unit tests for recorded/TTS selection, cancellation, voice-load race, fallback voice, unsupported API, and failure events.
- Practice-card tests confirming tap-only TTS and unchanged scoring behavior after playback failure.
- Catalog route tests for 401, 403, designated-admin access, and absence of protected metadata from public app data.
- Catalog UI tests for rendering all sounds and mappings, playing one asset, playing mapped variants/sequences, switching assets, and isolated failures.
- Existing content validation, type checks, tests, and app build remain green.

### Manual target-device matrix

Primary:

- current iPadOS Safari.

Additional:

- current macOS Safari;
- current desktop Chrome;
- current mobile Chrome; and
- current mobile Safari.

Use the protected catalog to verify recorded assets and a real practice session to verify
TTS. Record device model, OS/browser version, and date. Check tap gating, first-play
behavior, repeated taps, voice availability, VoiceOver, accessible labels, focus/busy
state, headphones/Bluetooth, mute/volume, slow/offline failure, volume consistency,
intelligibility, and graceful recovery.

## Out of Scope

- Phoneme-by-phoneme word scaffolding or item segmentation.
- Microphone capture.
- Automatic speech recognition or scoring.
- Automatic mastery updates from a machine-proposed score.
- Cloudflare R2.
- Recorded word and sentence audio.
- A general admin-role or feature-flag platform.

## Future Compatibility

Stable instructional audio IDs allow future word segmentation to reference the same recordings. The playback interface remains output-only.

Future automatic speech scoring (`rw-gx3`) must introduce separate capture, recognition, proposal, guardian-confirmation, and persistence boundaries. Guardian-confirmed scoring remains authoritative, and raw child audio is not stored by default.

## Research Basis

- The IES foundational-reading practice guide distinguishes phonemes from graphemes and
  defines a digraph as two letters read as one sound. It supports separating recordings
  from spelling-pattern mappings and does not support treating `/kw/` as one digraph sound:
  [Foundational Skills to Support Reading for Understanding in Kindergarten Through 3rd Grade](https://ies.ed.gov/ncee/wwc/Docs/PracticeGuide/wwc_foundationalreading_040717.pdf).
- ASHA notes that phonological patterns and sound inventories vary across dialects and
  languages. This is why the design treats 44 as a declared instructional scope rather
  than a universal linguistic constant:
  [Speech Sound Disorders: Articulation and Phonology](https://www.asha.org/practice-portal/clinical-topics/articulation-and-phonology/).
- The International Phonetic Association chart distinguishes voiceless dental fricative `/θ/` and voiced dental fricative `/ð/` as separate speech sounds. The spelling pattern `th` therefore maps to two phoneme assets rather than one ambiguous recording: [IPA chart](https://www.internationalphoneticassociation.org/content/ipa-chart).
- UFLI supplies the concrete 44-target project inventory, separate phoneme and grapheme
  cards, and consonant place/manner labels. This is an implementation resource, not proof
  that the inventory is universal: [UFLI Sound Wall](https://ufli.education.ufl.edu/wp-content/uploads/2023/09/UFLI-Sound-Wall-rev.pdf).
- Source governance and limitations are recorded in `docs/research/SOURCES.md`.

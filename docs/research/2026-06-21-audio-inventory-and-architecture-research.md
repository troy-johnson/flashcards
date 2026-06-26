# Research: Audio inventory, playback, and review architecture

**Date:** 2026-06-21
**Bead:** `rw-1gz.8.2`

## Surface area

- `docs/specs/002-readers-way-phase-a-micro-pilot.md` — FR16 and AC11 define the Phase A audio bar.
- `docs/adrs/002-phase-a-audio-strategy.md` — accepted pre-produced sound + TTS strategy.
- `docs/plans/002e-phase-a-content-bar.md` — revised 44-recording + 12-mapping implementation requirements.
- `content/manifest.json` — current single `phoneme_digraph_audio` target of 56.
- `content/audio/manifest.json` — three existing TTS declarations; no real assets.
- `scripts/content-validate.ts` — counts real `phoneme_`/`digraph_` sources.
- `scripts/content-validate.test.ts` — locks the current single-category semantics.
- `api/src/scheduler/content.ts` — loads optional item `audio_id`.
- `api/src/scheduler/planner.ts` — drops `audio_id` from practice cards.
- `app/src/api/types.ts` — practice cards contain only skill, item, and text.
- `app/src/components/cards/PhonicsCard.tsx` — guardian scoring controls; no playback.
- `api/src/routes/diag.ts` — existing `DIAG_GUARDIAN_EMAIL` authorization pattern.
- `.github/workflows/ci.yml`, `app/package.json`, and `app/wrangler.toml` — no audio generation or copy step.

Serena symbol tracing confirmed that item `audio_id` is loaded by scheduler content but not carried through `PlanCard` or `PracticeCard`. The current app therefore cannot resolve either recorded audio or manifest-backed TTS.

## Key findings

### “44 phonemes” is an instructional shorthand

English sound counts depend on dialect and analytical convention. UFLI's sound wall supplies a concrete project-aligned set of 44 instructional sound targets:

- 19 vowel/r-controlled/diphthong targets; and
- 25 consonant targets, including separate `/θ/` and `/ð/` and a dialect-sensitive `/ʍ/` (“wh”) target.

Some UFLI targets are instructionally useful sound units rather than single linguistic phonemes. For example, `/ju/` contains a glide plus vowel, and r-controlled targets can be analyzed differently across phonological frameworks.

Reader's Way should therefore say **44 UFLI-aligned instructional sound targets**, not “44 universal English phonemes.”

### Sound targets and grapheme patterns are different content

The 12 required patterns—`sh`, `ch`, `th`, `wh`, `ck`, `ng`, `qu`, `ll`, `ss`, `ff`, `zz`, `ph`—must not be treated as 12 additional speech sounds:

- `th` maps to `/θ/` and `/ð/`;
- `qu` ordinarily maps to the sequence `/k/ + /w/`;
- `ck`, `ll`, `ss`, `ff`, and `zz` reuse existing consonant targets; and
- `sh`, `ch`, `ng`, `ph`, and dialect-sensitive `wh` map to targets already represented in the sound inventory.

The content manifest must split:

- `recorded_sound_targets`: target 44, counted only when a real approved playback asset exists; and
- `grapheme_pattern_mappings`: target 12, counted when complete mappings reference valid sound IDs.

Summing files and metadata records into one “audio count” is not meaningful.

### The exact inventory must precede recording

The recording sheet must identify:

- stable ID;
- UFLI label and IPA;
- example word;
- phonetic manner for consonants;
- instructional production behavior (`clip`, `sustain`, `glide`, or `sequence`);
- dialect/merger risk;
- recording guidance; and
- SLP decision status.

The user's SLP should ideally approve this sheet before capture. If that is unavailable, recording may proceed only as an acknowledged beta risk: stable IDs are retained, clips remain replaceable, and no claim of clinical approval is made. Product-owner approval alone does not convert the inventory into clinical guidance.

### Canonical data must be deterministic

Use separately canonical files:

- `content/audio/sounds.json` — 44 sound definitions and asset/review metadata;
- `content/audio/patterns.json` — 12 sound–spelling mappings.

Optional TTS pronunciation overrides live only as `speech_text` on the affected content
item. Generate runtime/app audio indexes from the two canonical audio inputs. Generated
output must never preserve undeclared content from an earlier generated file.

### Beta TTS is whole-card, text-driven

The current 281 live items mostly lack `audio_id`. Requiring per-item IDs before TTS would
create unrelated data churn. Beta practice speaks `speech_text ?? text`; item-level
`speech_text` is the sole pronunciation-override source for homographs or poor synthesis.

The three legacy TTS manifest entries are deprecated and removed; they must not remain
ceremonial.

### Protected catalog metadata should remain server-authorized

Static sound files are public app assets. Review notes, checksums, reviewer identity, and approval state are operational metadata and should be returned only by an API endpoint gated with the existing diagnostics guardian rule.

The public app index should contain only data needed to resolve playback.

### Review must bind to bytes

Each approval must record:

- reviewer role or identifier;
- review timestamp;
- SHA-256 of the reviewed master and playback file; and
- guidance-version checksum.

A changed file or changed production guide invalidates applicable approval.

## Proposed 44-target inventory

This inventory follows the UFLI sound wall labels and separates phonetic manner from instructional production behavior. IPA is a review notation, not a claim that every speaker realizes the target identically.

### Vowel and vowel-like targets (19)

| # | Stable ID | UFLI label | IPA reference | Example | Manner/category | Production | Dialect/review note |
|---:|---|---|---|---|---|---|---|
| 1 | `sound_short_a` | ă | `/æ/` | apple | front vowel | sustain | Exact height/backness varies. |
| 2 | `sound_short_e` | ĕ | `/ɛ/` | edge | front vowel | sustain | May approach `/e/` in some varieties. |
| 3 | `sound_short_i` | ĭ | `/ɪ/` | itch | front vowel | sustain | Unstressed reduction must be avoided. |
| 4 | `sound_short_o` | ŏ | `/ɑ/` | octopus | low back vowel | sustain | Cot–caught contrast is dialect-sensitive. |
| 5 | `sound_short_u` | ŭ | `/ʌ/` | up | central vowel | sustain | Keep distinct from schwa in stressed model. |
| 6 | `sound_long_a` | ā | `/eɪ/` | acorn | diphthong | glide | Sustain through one smooth glide; dynamic realization varies. |
| 7 | `sound_long_e` | ē | `/i/` | eagle | high front vowel | sustain | Often narrowly diphthongal phonetically. |
| 8 | `sound_long_i` | ī | `/aɪ/` | ice | diphthong | glide | Sustain through one smooth glide; dynamic realization varies. |
| 9 | `sound_long_o` | ō | `/oʊ/` | ocean | diphthong | glide | Sustain through one smooth glide; degree of glide varies. |
| 10 | `sound_long_u_yoo` | yū | `/ju/` | use | phoneme sequence | sequence | Not a single phoneme; record as one instructional target only after reviewer approval. |
| 11 | `sound_aw` | aw | `/ɔ/` | saw | mid/low back vowel | sustain | Cot–caught merger risk; reviewer must confirm contrast policy and recorder capability. |
| 12 | `sound_short_oo` | oo | `/ʊ/` | book | high back vowel | sustain | Keep distinct from `/u/`. |
| 13 | `sound_long_oo` | ū | `/u/` | moon | high back vowel | sustain | Often has a glide/fronted onset in American English. |
| 14 | `sound_schwa` | ə | `/ə/` | about | reduced central vowel | sustain | Keep brief and unstressed; avoid turning it into stressed `/ʌ/`. |
| 15 | `sound_ar` | ar | `/ɑr/` | car | rhotic vowel/sequence | sustain | Rhotic reference; exact analysis varies. |
| 16 | `sound_er` | er | `/ɝ/` | bird | stressed rhotic vowel | sustain | Tongue posture varies (bunched/retroflex). |
| 17 | `sound_or` | or | `/ɔr/` | fork | rhotic vowel/sequence | sustain | Horse–hoarse and cot–caught systems vary. |
| 18 | `sound_oi` | oi | `/ɔɪ/` | coin | diphthong | glide | Sustain through one smooth glide; dynamic realization varies. |
| 19 | `sound_ow` | ow | `/aʊ/` | out | diphthong | glide | Sustain through one smooth glide; dynamic realization varies. |

### Consonant targets (25)

| # | Stable ID | UFLI label | IPA | Example | Phonetic manner | Production | Dialect/review note |
|---:|---|---|---|---|---|---|---|
| 20 | `sound_h` | h | `/h/` | hat | glottal fricative | sustain | Keep brief; avoid adding a following vowel. |
| 21 | `sound_p` | p | `/p/` | pig | voiceless bilabial stop | clip | No schwa release. |
| 22 | `sound_b` | b | `/b/` | bat | voiced bilabial stop | clip | Minimal voicing; no schwa. |
| 23 | `sound_m` | m | `/m/` | map | bilabial nasal | sustain | Keep lips closed. |
| 24 | `sound_f` | f | `/f/` | fan | voiceless labiodental fricative | sustain | Continuous airflow. |
| 25 | `sound_v` | v | `/v/` | van | voiced labiodental fricative | sustain | Preserve voicing. |
| 26 | `sound_th_unvoiced` | th | `/θ/` | thin | voiceless dental fricative | sustain | Separate from `/ð/`. |
| 27 | `sound_th_voiced` | th | `/ð/` | this | voiced dental fricative | sustain | Separate from `/θ/`. |
| 28 | `sound_t` | t | `/t/` | top | voiceless alveolar stop | clip | No schwa; do not model intervocalic flap. |
| 29 | `sound_d` | d | `/d/` | dog | voiced alveolar stop | clip | Minimal voicing; no schwa. |
| 30 | `sound_n` | n | `/n/` | net | alveolar nasal | sustain | Keep tongue placement stable. |
| 31 | `sound_s` | s | `/s/` | sun | voiceless alveolar fricative | sustain | Avoid `/ʃ/` retraction. |
| 32 | `sound_z` | z | `/z/` | zip | voiced alveolar fricative | sustain | Preserve voicing. |
| 33 | `sound_l` | l | `/l/` | lip | alveolar lateral approximant | sustain | Model onset “light l,” not final dark-l vocalization. |
| 34 | `sound_sh` | sh | `/ʃ/` | ship | voiceless postalveolar fricative | sustain | One sound target; grapheme mapping is separate. |
| 35 | `sound_zh` | zh | `/ʒ/` | measure | voiced postalveolar fricative | sustain | Rare initial spelling; use medial example. |
| 36 | `sound_ch` | ch | `/tʃ/` | chin | voiceless postalveolar affricate | clip | Preserve the natural brief fricated release; affricate, not a simple stop. |
| 37 | `sound_j` | j | `/dʒ/` | jam | voiced postalveolar affricate | clip | Preserve the natural brief fricated release; no schwa. |
| 38 | `sound_y` | y | `/j/` | yes | palatal approximant/glide | glide | Keep brief; distinct from the letter name. |
| 39 | `sound_r` | r | `/ɹ/` | red | rhotic approximant | sustain | Bunched/retroflex variants are both valid. |
| 40 | `sound_k` | k | `/k/` | kite | voiceless velar stop | clip | No schwa. |
| 41 | `sound_g` | g | `/g/` | goat | voiced velar stop | clip | Minimal voicing; no schwa. |
| 42 | `sound_ng` | ng | `/ŋ/` | sing | velar nasal | sustain | Do not append `/g/`. |
| 43 | `sound_wh` | wh | `/ʍ/` | which | voiceless labiovelar fricative/approximant | sustain | Keep brief; wine–whine merger is common; SLP must decide whether to retain as UFLI target for this reference. |
| 44 | `sound_w` | w | `/w/` | wet | voiced labiovelar approximant/glide | glide | Keep brief; contrast with `/ʍ/` is dialect-sensitive. |

## Required grapheme-pattern mappings (12)

| Mapping ID | Pattern | Sound target IDs | Example | Note |
|---|---|---|---|---|
| `pattern_sh` | `sh` | `sound_sh` | ship | One grapheme pattern, one sound. |
| `pattern_ch` | `ch` | `sound_ch` | chin | Primary early-reading correspondence only; other pronunciations are later scope. |
| `pattern_th` | `th` | `sound_th_unvoiced`, `sound_th_voiced` | thin, this | One spelling pattern, two sound targets. |
| `pattern_wh` | `wh` | `sound_w` | when | UFLI's grapheme card maps `wh` to `/w/`; the separate `/ʍ/` sound target remains available for contrast-preserving dialect review. |
| `pattern_ck` | `ck` | `sound_k` | back | Reuses `/k/`. |
| `pattern_ng` | `ng` | `sound_ng` | sing | Primary correspondence; do not add `/g/` to the isolated target. |
| `pattern_qu` | `qu` | `sound_k`, `sound_w` | quit | Sequence of two phonemes, not a digraph under the IES single-sound definition. |
| `pattern_ll` | `ll` | `sound_l` | bell | Reuses `/l/`; final realization may be darker in natural speech. |
| `pattern_ss` | `ss` | `sound_s` | mess | Reuses `/s/`. |
| `pattern_ff` | `ff` | `sound_f` | off | Reuses `/f/`. |
| `pattern_zz` | `zz` | `sound_z` | buzz | Reuses `/z/`. |
| `pattern_ph` | `ph` | `sound_f` | phone | Reuses `/f/`; vocabulary is later than initial CVC scope. |

## Unknowns

1. Whether the available recorder naturally preserves cot–caught and wine–whine contrasts.
2. Whether the SLP approves UFLI's `/ju/`, r-controlled targets, and `/ʍ/` as separate instructional recordings.
3. Exact microphone model, receiver, recording device, gain staging, and room noise floor.
4. Whether short isolated sounds perform better as PCM WAV, AAC, Opus, or MP3 in the target browsers; codec selection requires a representative-clip spike.
5. Whether Safari preserves reliable TTS initiation when voice enumeration is delayed after the tap.
6. Which current items need explicit TTS pronunciation overrides.
7. Whether SLP review can happen before capture; if not, the exact residual beta risk must be accepted and recorded.

## Risk areas

- Treating an instructional sound-wall category as a universal linguistic phoneme.
- Asking a recorder to manufacture a contrast absent from their dialect.
- Adding schwa to clipped stops or affricates.
- Using loudness normalization designed for long-form audio on subsecond clips.
- Encoding delay/padding on very short compressed files.
- Approval flags surviving changed audio bytes or changed guidance.
- Shipping operational review notes in public frontend bundles.
- Assuming browser voice availability or privacy behavior.
- Combining recorded-asset counts and grapheme-mapping counts into one metric.

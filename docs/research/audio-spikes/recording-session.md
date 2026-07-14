# Stage 1 instructional-audio recording session

**Bead:** `rw-ozz`

**Session date:** Thursday, July 16, 2026

**Status:** Scheduled; time and capture-chain details to be recorded before the first take

**Family-wave deadline:** Record the Aug 1 proceed/fallback decision on `rw-ozz`

## Outcome

Capture multiple takes for all 44 canonical instructional sound targets, select one candidate
master per target, and prove that real files pass through deterministic processing and the
protected review catalog on target devices. Recorder and owner review are sufficient for the
Stage 1 family decision. Checksum-bound SLP approval remains the educator-wave gate.

The canonical inventory and guidance live in `content/audio/sounds.json`; this session log does
not replace them. Do not change a target, IPA value, production behavior, or recording guidance
only in this file.

## Session facts

Complete these fields before recording:

- Time:
- Room/location:
- Recorder name:
- Recorder consent/provenance recorded by:
- DJI transmitter model:
- DJI receiver model:
- Recording device:
- Recording app and version:
- Input format confirmed: 48 kHz, 24-bit, mono WAV
- Gain:
- Microphone-to-mouth distance:
- Room treatment/background-noise notes:
- Recorder naturally preserves cot–caught contrast: yes / no / uncertain
- Recorder naturally preserves wine–whine contrast: yes / no / uncertain
- Owner present for live direction: yes / no

Do not coach a speaker to manufacture a dialect contrast they do not naturally produce. Mark the
affected target for another speaker or SLP disposition instead.

## Files and naming

Raw takes stay outside Git under a gitignored working directory:

```text
scratch/audio-recording/2026-07-16/
  raw/<sound_id>__take-01.wav
  raw/<sound_id>__take-02.wav
  raw/<sound_id>__take-03.wav
  selected/<sound_id>.wav
  playback/<sound_id>.m4a
```

The selected filename must be exactly `<sound_id>.wav`; `audio:process` derives the manifest ID
from that filename. Keep every raw take until owner review and the first backup are complete.

## Preflight

- [ ] Send or review `docs/research/2026-06-21-audio-inventory-slp-review-packet.md`; record the
      current pre-recording disposition on this bead.
- [ ] Confirm recorder consent and provenance.
- [ ] Disable automatic gain control, noise suppression, echo cancellation, and lossy capture.
- [ ] Confirm 48 kHz, 24-bit, mono WAV with a short test file and `ffprobe`.
- [ ] Record and listen to room tone; remove fans, alerts, jewelry noise, and reflective surfaces
      where practical.
- [ ] Confirm stable mic placement and gain with a sustained vowel, fricative, and stop.
- [ ] Confirm peaks remain at or below -3 dBFS and above the -20 dBFS audibility floor used by
      `rw-isolated-sound-v1`.
- [ ] Keep selected clips between 250 ms and 1,500 ms, with no more than 250 ms leading silence
      and 500 ms trailing silence.
- [ ] Open `content/audio/sounds.json` for the exact guidance during capture.

## Capture rules

- Record the isolated sound only: no letter name, keyword, count-in, or spoken instruction.
- Capture at least three takes per target; add takes immediately when onset, release, voicing,
  room noise, or mic distance changes.
- Sustain continuous sounds briefly and steadily.
- Clip stops tightly without an added schwa.
- Let diphthongs and glides complete naturally.
- Keep `/th/` voiced and unvoiced targets distinct, `/ng/` free of a trailing `/g/`, and `/qu/`
  as a mapping rather than a new recording.
- Stop and flag any target whose canonical guidance conflicts with the recorder's natural speech.

## Capture order

The order moves from vowels through continuous consonants to stops and affricates so the operator
can detect changing gain, fatigue, and release quality.

| Done | Sound ID | Cue | IPA | Example | Behavior |
|---|---|---|---|---|---|
| [ ] | `sound_short_a` | ă | /æ/ | apple | sustain |
| [ ] | `sound_short_e` | ĕ | /ɛ/ | edge | sustain |
| [ ] | `sound_short_i` | ĭ | /ɪ/ | itch | sustain |
| [ ] | `sound_short_o` | ŏ | /ɑ/ | octopus | sustain |
| [ ] | `sound_short_u` | ŭ | /ʌ/ | up | sustain |
| [ ] | `sound_long_a` | ā | /eɪ/ | acorn | glide |
| [ ] | `sound_long_e` | ē | /i/ | eagle | sustain |
| [ ] | `sound_long_i` | ī | /aɪ/ | ice | glide |
| [ ] | `sound_long_o` | ō | /oʊ/ | ocean | glide |
| [ ] | `sound_long_u_yoo` | yū | /ju/ | use | sequence |
| [ ] | `sound_aw` | aw | /ɔ/ | saw | sustain |
| [ ] | `sound_short_oo` | oo | /ʊ/ | book | sustain |
| [ ] | `sound_long_oo` | ū | /u/ | moon | sustain |
| [ ] | `sound_schwa` | ə | /ə/ | about | sustain |
| [ ] | `sound_ar` | ar | /ɑr/ | car | sustain |
| [ ] | `sound_er` | er | /ɝ/ | bird | sustain |
| [ ] | `sound_or` | or | /ɔr/ | fork | sustain |
| [ ] | `sound_oi` | oi | /ɔɪ/ | coin | glide |
| [ ] | `sound_ow` | ow | /aʊ/ | out | glide |
| [ ] | `sound_h` | h | /h/ | hat | sustain |
| [ ] | `sound_m` | m | /m/ | map | sustain |
| [ ] | `sound_n` | n | /n/ | net | sustain |
| [ ] | `sound_ng` | ng | /ŋ/ | sing | sustain |
| [ ] | `sound_f` | f | /f/ | fan | sustain |
| [ ] | `sound_v` | v | /v/ | van | sustain |
| [ ] | `sound_th_unvoiced` | th | /θ/ | thin | sustain |
| [ ] | `sound_th_voiced` | th | /ð/ | this | sustain |
| [ ] | `sound_s` | s | /s/ | sun | sustain |
| [ ] | `sound_z` | z | /z/ | zip | sustain |
| [ ] | `sound_l` | l | /l/ | lip | sustain |
| [ ] | `sound_sh` | sh | /ʃ/ | ship | sustain |
| [ ] | `sound_zh` | zh | /ʒ/ | measure | sustain |
| [ ] | `sound_r` | r | /ɹ/ | red | sustain |
| [ ] | `sound_wh` | wh | /ʍ/ | which | sustain |
| [ ] | `sound_y` | y | /j/ | yes | glide |
| [ ] | `sound_w` | w | /w/ | wet | glide |
| [ ] | `sound_p` | p | /p/ | pig | clip |
| [ ] | `sound_b` | b | /b/ | bat | clip |
| [ ] | `sound_t` | t | /t/ | top | clip |
| [ ] | `sound_d` | d | /d/ | dog | clip |
| [ ] | `sound_k` | k | /k/ | kite | clip |
| [ ] | `sound_g` | g | /g/ | goat | clip |
| [ ] | `sound_ch` | ch | /tʃ/ | chin | clip |
| [ ] | `sound_j` | j | /dʒ/ | jam | clip |

## Selection and processing

For each target, listen to every take and select the cleanest natural production. Copy the
selection to `selected/<sound_id>.wav`, then run:

```bash
pnpm audio:process \
  --input scratch/audio-recording/2026-07-16/selected \
  --output scratch/audio-recording/2026-07-16/playback \
  --profile rw-isolated-sound-v1
```

Expected: 44 playback files, or a precise per-sound failure list. Do not normalize around a
validation failure without recording why; recapture when the source itself is wrong.

After all files pass:

- [ ] Back up raw takes and selected masters in a second location.
- [ ] Record selected take numbers and any rejected-target notes below.
- [ ] Populate media paths and SHA-256 values in `content/audio/sounds.json`.
- [ ] Add checksum-bound recorder and owner review records.
- [ ] Generate and check the runtime manifest.
- [ ] Stage playback files and verify every candidate in the protected catalog on a real phone,
      tablet, and desktop.
- [ ] Keep the learner-facing coverage gate unchanged until the `rw-1gz.8.2` release-policy seam
      is reconciled with the two-wave decision.

## Session results

- Session started:
- Session ended:
- Targets captured:
- Targets with selected masters:
- Targets passing `audio:process`:
- Targets requiring another speaker or recapture:
- Selected-take notes:
- Backup location recorded privately:
- Owner review result and date:
- Protected-catalog device QA result and date:

## SLP handoff

- SLP reviewer/contact:
- Review date after Stage 1:
- Exact inventory/content revision:
- Protected catalog available: yes / no
- Result: pending / approved / approved with changes / needs revision
- Requested re-recordings or guidance changes:

The educator wave remains closed until every learner-facing target has a current checksum-bound
SLP approval covering its guidance, selected master, and playback encode.

## Aug 1 decision record

Record one disposition on `rw-ozz` by Aug 1:

- **Proceed with recordings:** all Stage 1 files are in, processing passes, owner review passes,
  and protected-catalog playback works on real devices.
- **Invoke `rw-5j6`:** recordings are not reliably in and playing; begin the family wave with
  the adult-modeled sound-card fallback while recording work continues.

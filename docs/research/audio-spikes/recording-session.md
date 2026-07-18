# Stage 1 instructional-audio recording session

**Bead:** `rw-ozz`

**Session date:** Thursday, July 16, 2026

**Status:** Scheduled; time and capture-chain details to be recorded before the first take

**Family-wave deadline:** Record the Aug 1 proceed/fallback decision on `rw-ozz`

## Pre-recording disposition — July 15, 2026

- Inventory/SLP packet reviewed for session readiness: yes
- Pre-recording SLP decision available: no
- Owner disposition: `slp_pending_risk_accepted`
- Scope of acceptance: recording, deterministic processing, candidate staging, and protected-catalog owner QA may proceed; no clip may enter the learner-facing manifest until the current checksum-bound subject has SLP approval
- Capture facts still intentionally pending: session time, room, recorder consent/provenance, exact DJI transmitter/receiver, recording device/app, gain, microphone distance, room noise, dialect contrasts, and owner presence

This disposition accepts a replaceable beta-recording risk only. It does not claim clinical
approval and does not weaken the learner-facing SLP gate.

## Outcome

Capture multiple takes for all 44 canonical instructional sound targets, select one candidate
master per target, and prove that real files pass through deterministic processing, candidate
staging, and the protected review catalog on target devices. Recorder and owner review are
sufficient for the Stage 1 family decision. Checksum-bound SLP approval remains the
educator-wave gate and the learner-facing release gate.

The two audio projections are intentionally separate:

- `content/audio/manifest.json` is the learner-facing release manifest. It contains only sounds
  whose latest checksum-bound recorder, owner, and SLP dispositions all approve the current
  subject, so it remains `0/44` after Stage 1 until SLP review.
- `pnpm audio:stage` stages every recorded candidate whose playback bytes and declared hash
  are valid into `app/public/audio/generated/`. The authenticated catalog receives the matching
  generated runtime URL and can use it for owner QA. Staging a candidate does not add it to the
  learner manifest or change the learner-facing SLP gate. Per Spec 003, these bundled audio bytes
  are ordinary static assets; the protected catalog protects operational metadata and the QA
  surface, while the manifest is the learner-release boundary.

Stage 1 byte-access authorization was confirmed by the recorder/owner on 2026-07-17: these are
the recorder's own recordings, and candidate playback bytes may be reachable by deterministic
public URLs during Stage 1. Candidate bytes are therefore non-confidential at this stage; this
authorization does not approve learner release, which remains gated by the current checksum-bound
recorder, owner, and SLP dispositions.

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

content/audio/
  masters/<sound_id>.wav
  playback/<sound_id>.m4a
```

The selected filename must be exactly `<sound_id>.wav`; `audio:process` derives the manifest ID
from that filename. `content/audio/masters/` and `content/audio/playback/` are the canonical
tracked inputs for content validation; `scratch/.../playback/` is only a review workspace until
the selected encodes are copied into the canonical playback directory. Keep every raw take until
owner review and the first backup are complete.

## Preflight

- [ ] Send or review `docs/research/2026-06-21-audio-inventory-slp-review-packet.md`; record the
      current pre-recording disposition on this bead.
- [ ] If SLP approval is unavailable before capture, record explicit beta-risk acceptance before
      the first take, using the exact disposition `slp_pending_risk_accepted`: Stage 1 owner
      review and protected-catalog QA are allowed, but no clip may enter the learner-facing
      manifest until checksum-bound SLP approval.
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
selection to `selected/<sound_id>.wav`, then copy the selected masters into the canonical master
directory and run the deterministic processor:

```bash
mkdir -p content/audio/masters content/audio/playback
cp scratch/audio-recording/2026-07-16/selected/<sound_id>.wav \
  content/audio/masters/<sound_id>.wav
pnpm audio:process \
  --input scratch/audio-recording/2026-07-16/selected \
  --output scratch/audio-recording/2026-07-16/playback \
  --profile rw-isolated-sound-v1
cp scratch/audio-recording/2026-07-16/playback/*.m4a content/audio/playback/
```

Expected: 44 playback files, or a precise per-sound failure list. Do not normalize around a
validation failure without recording why; recapture when the source itself is wrong.

The canonical media fields for each recorded sound are:

```json
{
  "master_path": "sound_short_a.wav",
  "master_sha256": "<sha256 of content/audio/masters/sound_short_a.wav>",
  "playback_url": "/audio/sound_short_a.m4a",
  "playback_sha256": "<sha256 of content/audio/playback/sound_short_a.m4a>"
}
```

Get the two byte hashes with `shasum -a 256`. The source `playback_url` must remain under
`/audio/`; do not replace it with `/audio/generated/`. The API adds the generated runtime path
for the protected catalog after `pnpm audio:stage` has copied the bytes.

Record both Stage 1 review dispositions in the canonical sound row. The exact review shape is:

```json
"reviews": [
  {
    "kind": "recorder",
    "reviewer": "<recorder name>",
    "reviewed_at": "2026-07-16T<time>-06:00",
    "status": "approved",
    "subject_sha256": "<current review subject>"
  },
  {
    "kind": "owner",
    "reviewer": "<owner name>",
    "reviewed_at": "2026-07-16T<time>-06:00",
    "status": "approved",
    "subject_sha256": "<current review subject>",
    "notes": "<selection, listening, or device-QA note>"
  }
]
```

After all four media fields are present, compute the subject for a sound with:

```bash
node --import tsx --input-type=module -e '
import { loadAudioSources, computeReviewSubject } from "./scripts/audio-schema.ts";
const id = process.argv[1];
const sound = loadAudioSources("./content").sounds.find((candidate) => candidate.sound_id === id);
if (!sound) throw new Error(`unknown sound: ${id}`);
console.log(computeReviewSubject(sound));
' sound_short_a
```

The subject excludes the `reviews` array but includes the current guidance and media hashes.
Recompute it and update every review record if any guidance, master, or playback byte changes.
Append review records in disposition order: for each reviewer kind and current subject, the last
record is authoritative. A later `changes_requested` revokes approval; a later `approved` record
documents resolution.

After all files pass:

- [ ] Back up raw takes and selected masters in a second location.
- [ ] Record selected take numbers and any rejected-target notes below.
- [ ] Populate media paths and SHA-256 values in `content/audio/sounds.json`.
- [ ] Add checksum-bound recorder and owner review records.
- [ ] Run canonical validation after media and review edits:
      `pnpm content:validate`.
- [ ] Generate and check the learner-facing manifest; it should remain `0/44` until SLP approval:
      `pnpm audio:manifest && pnpm audio:manifest:check`.
- [ ] Stage candidate playback for the protected catalog:
      `pnpm audio:stage`.
- [ ] Verify every recorded candidate in the protected catalog on a real phone, tablet, and
      desktop. The catalog uses `/audio/generated/<filename>`; the canonical source remains
      `/audio/<filename>`.
- [ ] Keep the learner-facing coverage gate unchanged: Stage 1 owner review enables catalog QA,
      but recorder, owner, and SLP approval of the current subject are all required before a
      sound can enter the learner-facing manifest.

For target-device QA from a local workstation, stage first, then start the API and app with the
workstation's LAN address so a phone or tablet can reach the API:

```bash
pnpm audio:stage
VITE_API_ORIGIN=http://<workstation-lan-ip>:8787 pnpm dev
```

Open `/guardian/audio-catalog` as the designated operator. Do not use the public practice route
as the Stage 1 QA surface, and do not add an owner-only clip to `content/audio/manifest.json`.

## Session results

- Session started: 2026-07-16 (time not recorded)
- Session ended: 2026-07-16 (time not recorded)
- Targets captured: 44/44
- Targets with selected masters: 44/44
- Targets passing `audio:process`: 44/44
- Targets requiring another speaker or recapture: Pending recorder, owner, and SLP review
- Selected-take notes: Take 2 selected for every canonical target. Duplicate-suffixed copies were
  removed before selection. Selected masters were converted to 48 kHz, mono, 24-bit WAV; edge
  silence was trimmed, with provisional 100 ms padding for `sound_th_unvoiced`, +3 dB for
  `sound_v`, and +2 dB for `sound_z`.
- Backup location recorded privately:
- Owner review result and date: Pending
- Protected-catalog device QA result and date: Pending

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

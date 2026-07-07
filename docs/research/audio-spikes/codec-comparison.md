# Codec Comparison Spike

Status: measured with phone-provided scratch clips; automated processing tooling is implemented; AAC is the provisional tooling profile pending manual target-device listening before Task 9 can be treated as complete.

## Inputs

Representative scratch clips were supplied through Google Drive folder `RW Spike Audio` (`1Vma10RJs9BkwyWAiGgnv9matvWG9SJje`) and downloaded to ignored local paths under `scratch/audio-spikes/`.

| Clip class | Target | Source filename | Scratch filename |
| --- | --- | --- | --- |
| Stop | `/p/` | `Stop p.m4a` | `scratch/audio-spikes/stop-p-phone.m4a` |
| Fricative | `/s/` | `Ss.m4a` | `scratch/audio-spikes/fricative-s-phone.m4a` |
| Affricate | `/tʃ/` | `Ch.m4a` | `scratch/audio-spikes/affricate-ch-phone.m4a` |
| Nasal | `/m/` | `Mmm.m4a` | `scratch/audio-spikes/nasal-m-phone.m4a` |
| Vowel | `/æ/` | `Short a.m4a` | `scratch/audio-spikes/vowel-ae-phone.m4a` |

The scratch clips are evidence fixtures only. They are not candidate learner audio and are intentionally outside Git.

Source checksums:

| Scratch filename | SHA-256 |
| --- | --- |
| `scratch/audio-spikes/stop-p-phone.m4a` | `0d9dc68693a42f81ec1d1341322419a3eb9193216a328d2a907859b7f663b708` |
| `scratch/audio-spikes/fricative-s-phone.m4a` | `6be8c1214fe812fd1527834ed316a48a08368fc6360776b2540ddb32235cca0b` |
| `scratch/audio-spikes/affricate-ch-phone.m4a` | `a590dd0982934a1ac759ee8eb30fc874885828bbbc5adceb4cffed8dfe11d590` |
| `scratch/audio-spikes/nasal-m-phone.m4a` | `6abd2e7a4c49baacacb280c5ee61f094a908c3803bbd8a3724f9a4c9fbcd975b` |
| `scratch/audio-spikes/vowel-ae-phone.m4a` | `91eae1bb39bbc57cedef460c61a1ad49854d28ab033251f5302e66eacb8b4df2` |

Tooling: `ffmpeg 8.1.2` and `ffprobe 8.1.2` from Homebrew, built with `libopus` and `libmp3lame` enabled.

## Source Probe Results

Profile validation is intentionally stricter than these phone recordings. The supplied clips are useful for codec behavior, but they show that final recording instructions need WAV masters, shorter takes, and more headroom.

| Clip | Channels | Sample rate | Bit depth | Duration | Peak | Leading silence | Trailing silence | Gate result |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | --- |
| Stop `/p/` | 1 | 48000 Hz | unknown | 2624 ms | -1.2 dB | 45 ms | 0 ms | Fails bit depth, duration, peak headroom |
| Fricative `/s/` | 1 | 48000 Hz | unknown | 3904 ms | -2.1 dB | 48 ms | 0 ms | Fails bit depth, duration, peak headroom |
| Affricate `/tʃ/` | 1 | 48000 Hz | unknown | 3563 ms | -1.1 dB | 22 ms | 0 ms | Fails bit depth, duration, peak headroom |
| Nasal `/m/` | 1 | 48000 Hz | unknown | 3307 ms | -9.2 dB | 49 ms | 0 ms | Fails bit depth, duration |
| Vowel `/æ/` | 1 | 48000 Hz | unknown | 2709 ms | -0.9 dB | 55 ms | 0 ms | Fails bit depth, duration, peak headroom |

## Processing Profile

Profile: `rw-isolated-sound-v1`

Automated gates:

| Gate | Threshold |
| --- | --- |
| Source channels | mono, 1 channel |
| Source sample rate | 48000 Hz |
| Source bit depth | 24-bit |
| Duration | 250-1500 ms |
| Peak ceiling | `<= -3 dB` |
| Audibility floor | `>= -20 dB` peak |
| Leading silence | `<= 250 ms` |
| Trailing silence | `<= 500 ms` |
| Runtime codec | AAC in `.m4a` |
| Runtime sample rate | 44100 Hz |
| Runtime bitrate | 96k |

Processing arguments:

```text
-ac 1 -ar 44100 -c:a aac -b:a 96k -map_metadata -1 -fflags +bitexact -flags:a +bitexact
```

The peak gate is `-3 dB`, not `-1 dB`, because the hot stop clip measured at `-1.2 dB` as source audio but decoded to `0.0 dB` after AAC encoding. Final recording should leave headroom before lossy encoding instead of relying on the encoder not to overshoot.

The profile separates source validation from runtime encoding: Task 10 masters must be 48 kHz, 24-bit mono WAV, while runtime playback tooling currently encodes to 44.1 kHz AAC for broad Apple/browser playback.

Executable entrypoint:

```bash
pnpm audio:process --input <approved-takes-directory> --profile rw-isolated-sound-v1 --output <review-output-directory>
```

The entrypoint processes `.wav` files in deterministic filename order, validates each source master before encoding, and reports a per-sound failure list. The default output path is `scratch/audio-process/playback` so accidental local runs do not write review assets into tracked content. Smoke test against the generated scratch WAV comparison files failed as expected because those files are 44.1 kHz, 16-bit, too long, and often too hot for the source-master profile.

Automated real-ffmpeg smoke coverage now synthesizes a compliant 48 kHz, 24-bit mono WAV, probes it through `ffprobe`/`ffmpeg`, and verifies an AAC `.m4a` output is written. This proves the happy path for the processing script, but not learner-facing recording quality.

## Codec Comparison Matrix

All comparison outputs were generated under `scratch/audio-spikes/processed/` from the same five phone clips. Size and peak/silence values are the aggregate or worst case across the five clips.

Generation command shape:

```text
ffmpeg -hide_banner -loglevel error -y -i <input> <codec args> <output>
```

Codec arguments:

| Codec | Arguments |
| --- | --- |
| WAV | `-ac 1 -ar 44100 -c:a pcm_s16le` |
| AAC | `-ac 1 -ar 44100 -c:a aac -b:a 96k -map_metadata -1 -fflags +bitexact -flags:a +bitexact` |
| Opus | `-ac 1 -ar 48000 -c:a libopus -b:a 48k -application voip -map_metadata -1` |
| MP3 | `-ac 1 -ar 44100 -c:a libmp3lame -b:a 96k -map_metadata -1` |

| Codec | Browser support | Start latency | Padding/clicks | Intelligibility | Size | Peak/headroom | Silence behavior | Decision |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| WAV | Broad LPCM WAV support in browsers; no codec loss. | Not device-measured; lowest decode complexity expected. | No audible device check yet; local trailing edge measured 20-32 ms. | Preserves source; no lossy artifacts. | 1,401,596 bytes total; 280,319 avg. | Max -0.9 dB from hot source. | Max leading 55 ms; max trailing 32 ms. | Reject for runtime: too large for repeated drill playback. Keep masters as WAV where needed. |
| AAC (`.m4a`) | MP4/AAC is broadly supported for web playback; Firefox can depend on platform AAC support. Good fit for the iPadOS Safari target. | Not device-measured; codec latency range is acceptable for UI-triggered sound playback but must be heard on target devices. | Local trailing edge measured 19-34 ms. Hot source produced a decoded 0.0 dB peak, which drove the `-3 dB` source gate. | Pending target-device listening; expected acceptable at 96k mono for isolated speech sounds. | 199,663 bytes total; 39,933 avg. | Max 0.0 dB with hot source; profile now rejects that source headroom. | Max leading 55 ms; max trailing 34 ms. | Use as the provisional executable tooling codec; final Task 9 acceptance still requires manual iPadOS Safari/mobile Safari/Chrome listening. |
| Opus (`.opus`) | Small and speech-efficient, but Safari container behavior is version-sensitive; WebKit added more Ogg Opus support in Safari 18.4. | Low codec latency, but target-device startup still unmeasured. | Local trailing edge measured 0-51 ms. | Pending listening; likely intelligible, but target compatibility risk outweighs size win. | 93,967 bytes total; 18,793 avg. | Max -0.9 dB from hot source. | Max leading 55 ms; max trailing 51 ms. | Reject as primary codec for this app because iPad Safari compatibility is the controlling risk. |
| MP3 | Broadest browser/device compatibility. | MP3 codec latency is documented as at least 100 ms; target-device startup still unmeasured. | Local trailing edge measured 20-35 ms; MP3 encoder delay is a concern for very short phoneme clips. | Pending listening; likely intelligible. | 194,574 bytes total; 38,915 avg. | Max -1.2 dB, no local decoded clipping in this sample. | Max leading 55 ms; max trailing 35 ms. | Keep as fallback candidate only; no clear advantage over AAC for the Apple-first target. |

Generated output checksums:

| Output | SHA-256 |
| --- | --- |
| `scratch/audio-spikes/processed/wav/affricate-ch.wav` | `089c8287977550093a644011012133c244f25afd13d7b69ed2ab6546e0940142` |
| `scratch/audio-spikes/processed/wav/fricative-s.wav` | `2c0c182f83d9dd6f580c64f4e8446fc53f8c99f0c1ace969342e6e53c49805af` |
| `scratch/audio-spikes/processed/wav/nasal-m.wav` | `1138cf4e3349e1e98b05499f14d0ef14eb28c3ab2abca44282ff56ed0a3fa589` |
| `scratch/audio-spikes/processed/wav/stop-p.wav` | `f17f9b570402f21fb45c3d9872add3ae5603bfbe8a832a447ce9e447b98b9ba2` |
| `scratch/audio-spikes/processed/wav/vowel-ae.wav` | `afe0f7e410b155a43e8e51ca1583d668d4d83f881065957edd1fbd67a591bd36` |
| `scratch/audio-spikes/processed/aac/affricate-ch.m4a` | `6d78be0e99ec6b3b63c6a2e646f1dccd5fb11f8a681ecd0e97b1393a33726025` |
| `scratch/audio-spikes/processed/aac/fricative-s.m4a` | `f30012af3639183c112d1cd450a11135f3dd93a52ef6cef5d6c099f1bd0560f6` |
| `scratch/audio-spikes/processed/aac/nasal-m.m4a` | `6a1ee0fe022516c3b2bf145a9c5c84c66447d415346f8f76d8f8ee3bc9767a63` |
| `scratch/audio-spikes/processed/aac/stop-p.m4a` | `196709cb45b0d4a6fe4bf1f2ff39ead24207195d12f09b62bb96c72e3f2dbfcc` |
| `scratch/audio-spikes/processed/aac/vowel-ae.m4a` | `836519a2d78881a82d6d72d397995980f6e45a5a683b4d10dede0258b6082c29` |
| `scratch/audio-spikes/processed/opus/affricate-ch.opus` | `cad22eaabce206c0e4c757b87465b379cdcfc6af0e7d28db6e6c71e1e520dfed` |
| `scratch/audio-spikes/processed/opus/fricative-s.opus` | `c29a4da739c821cd235bb419d170432c89b4d9ae5b61dfd256faf3819fe3ab2e` |
| `scratch/audio-spikes/processed/opus/nasal-m.opus` | `aad0542cd593d5a64b0906d6a108d1731e2d253b77cf6bdddba4e2c64ec45cc9` |
| `scratch/audio-spikes/processed/opus/stop-p.opus` | `1da3d8685036eebd200a7923c2260a70801c6ba85cd0c9d089896f3f3d789b9a` |
| `scratch/audio-spikes/processed/opus/vowel-ae.opus` | `7006e1e5df4a5d9cbab89843fe65b00df0f8102828de52b8c015c8eed2cabcbb` |
| `scratch/audio-spikes/processed/mp3/affricate-ch.mp3` | `491ab449d4522a865da7144d655158e922cf461e71fece472b0fd045a72a516e` |
| `scratch/audio-spikes/processed/mp3/fricative-s.mp3` | `a812bc5ec197086ef80b9c43ac39d667c99aef05168a7ca20798aae83afe6cac` |
| `scratch/audio-spikes/processed/mp3/nasal-m.mp3` | `ff143d2f0eeaa5d61397d967ee2171320966ae5c18c3b249c7350b98a0f4bbb0` |
| `scratch/audio-spikes/processed/mp3/stop-p.mp3` | `643ca7210c2469926b0768748b4daca529677a9b23d944b8aa9f5734f5f7ca87` |
| `scratch/audio-spikes/processed/mp3/vowel-ae.mp3` | `b31835cedfe84efa3f205390b4bf209a843aadf1852e8c15cb749a48ee9e72df` |

Clipping note: current automated validation gates sample peak headroom using `volumedetect max_volume`. It does not prove a waveform was never previously clipped and attenuated. Task 10 must either add true-peak/clipping detection or record explicit acceptance that this profile enforces peak headroom only.

## Sources

- `MDN-AUDIO-CODECS` for codec/container support, codec latency ranges, and AAC/MP3/Opus notes.
- `MDN-MEDIA-CONTAINERS` for WAV/LPCM container support and general audio-only container guidance.
- `WEBKIT-SAFARI-15-MEDIA` for Safari WebM/Opus media support history.
- `WEBKIT-SAFARI-18-4-MEDIA` for current Ogg Opus/Vorbis support on Apple platforms.

## Remaining Manual Check

Task 9 remains open until a short AAC review set is played on iPadOS Safari, mobile Safari, desktop Safari, and Chrome. Confirm no audible click, clipped burst, excessive startup delay, or confusing speech distortion. If AAC fails this listening check, rerun the comparison with MP3 as the fallback candidate before Task 10 assets are approved.

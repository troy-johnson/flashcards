# Audio Target-Device QA Matrix

> **Status: NOT YET RUN.** Complete after the July 16 Stage 1 recordings are available in the
> protected catalog and after the Phase 0 TTS probe has selected a safe iPadOS algorithm.

This matrix records the manual evidence required by ADR-002 and plan 003a Task 11. Use the
protected catalog for recorded candidates. Use `tts-probe.html` for Phase 0 TTS until Task 7
lands; after that, repeat the TTS rows in the practice route.

## Test environment

- Test date:
- App revision:
- API revision:
- Network conditions tested:
- Operator account confirmed:

| Device | Model | OS version | Browser/version | Recorded catalog | TTS/probe | VoiceOver or screen reader | Result |
|---|---|---|---|---|---|---|---|
| Primary tablet | | iPadOS | Safari | | | | Pending |
| Apple phone | | iOS | Safari | | | | Pending |
| Apple desktop | | macOS | Safari | | | | Pending |
| Chrome desktop | | | Chrome | | | | Pending |
| Chrome mobile | | Android | Chrome | | | | Pending |

## Recorded-catalog checks

Run these checks on every device row above. For the primary iPad, Apple phone, and desktop,
listen to the complete candidate set; representative coverage is acceptable on the remaining
Chrome device only after the complete-set checks pass.

| Check | Expected | Evidence/notes | Pass |
|---|---|---|---|
| First tap after reload | Selected clip starts from the explicit tap | | |
| Repeated taps | Prior clip stops; newest clip plays once | | |
| Stop, fricative, affricate, nasal, vowel | No click, clipped burst, confusing distortion, or excessive delay | | |
| Complete candidate set | Every runtime URL plays the checksum-bound candidate | | |
| Accessible name | Control announces sound, IPA/example context as designed | | |
| Focus and failure | Focus remains usable; failure is announced without blocking navigation | | |
| Headphones/Bluetooth | Output routes correctly and repeated playback remains stable | | |
| Mute/volume | Browser/device behavior is understandable and recoverable | | |
| Slow/offline | Failure is clear; scoring and navigation remain unaffected | | |

## TTS checks

Copy the detailed Phase 0 observations and selected algorithm into
`phase-0-tts-device.md`. Once Task 7 lands, repeat these checks in practice and record any
difference from the probe.

| Check | Expected | Evidence/notes | Pass |
|---|---|---|---|
| First tap after reload | Speech starts from the explicit tap | | |
| Empty/delayed voices | Safe fallback or selected algorithm starts without losing activation | | |
| Deterministic English voice | Preferred available English voice is selected consistently | | |
| Second tap during speech | Prior utterance cancels; newest utterance starts | | |
| `speech_text` override | Override is spoken instead of display text | | |
| Busy/announced state | Control state and errors are available to assistive technology | | |
| Scoring isolation | Failure leaves Correct, Try again, and Skip enabled | | |
| Offline | Local voice works or a clear non-blocking failure appears | | |

## Disposition

- Recorded AAC profile: pending / accepted / rejected
- TTS algorithm: pending / accepted / rejected
- Blocking devices or scenarios:
- Follow-up issue IDs:
- Owner and date:

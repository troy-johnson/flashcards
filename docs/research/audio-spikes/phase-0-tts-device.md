# Phase 0 TTS Device Spike

> **Status: NOT YET RUN** — requires the physical beta iPad. Probe page:
> [`tts-probe.html`](tts-probe.html). Serve with `npx serve docs/research/audio-spikes`
> and open `http://<mac-lan-ip>:3000/tts-probe.html` in iPad Safari. Buttons cover most
> rows: A→first tap, B→second tap during speech, C→cancel-then-speak, D→voice
> unavailable, E→delayed enumeration; use **Copy log** to capture evidence verbatim.
> Airplane-mode and VoiceOver rows are manual device-settings toggles around re-runs
> of buttons A and E. The "`getVoices()` initially empty" row has **no dedicated
> button** — its evidence is the meta line + button A on a **fresh reload** (reload,
> tap A before anything else, note "voices at load: 0" and whether speech starts).

- Test date:
- Device model:
- iPadOS version:
- Safari version:
- Network state:
- Available English voices at initial tap:
- Did `voiceschanged` fire:

| Scenario | Expected | Observed | Pass |
|---|---|---|---|
| First tap after reload | speech starts from the tap | | |
| `getVoices()` initially empty | safe fallback still starts | | |
| Delayed voice enumeration | no lost activation | | |
| Second tap during speech | prior speech cancels | | |
| `speechSynthesis.cancel()` then speak | new utterance starts | | |
| Voice unavailable | browser default starts | | |
| Airplane/offline mode | local voice works or clear failure appears | | |
| VoiceOver enabled | button and state are announced | | |

## Decision

Selected algorithm:

Rejected algorithms and evidence:

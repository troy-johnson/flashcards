/**
 * Isolated playback service (003a Task 7 contract, recorded lane shipped with
 * Task 8). Output-only by design: never reads student state, never exposes
 * scoring callbacks, cannot advance or block practice.
 *
 * The TTS lane is DELIBERATELY `unavailable` until the Phase 0 real-iPad spike
 * (docs/research/audio-spikes/phase-0-tts-device.md) selects an initiation
 * algorithm — Task 7 fills it in from that evidence. Do not implement TTS here
 * without the device evidence sheet marked PASS.
 */

export type PlaybackRequest =
  | { kind: "recorded"; src: string }
  | { kind: "tts"; text: string };

export type PlaybackResult =
  | { status: "started" }
  | { status: "completed" }
  | { status: "unavailable"; reason: string }
  | { status: "failed"; reason: string };

export type PlaybackController = {
  play(request: PlaybackRequest): Promise<PlaybackResult>;
  cancel(): void;
};

type PlaybackDeps = {
  /** Injectable for tests; defaults to a real HTMLAudioElement. */
  createAudio?: (src: string) => HTMLAudioElement;
};

export function createPlaybackController(deps: PlaybackDeps = {}): PlaybackController {
  const createAudio = deps.createAudio ?? ((src: string) => new Audio(src));
  let current: HTMLAudioElement | null = null;

  const cancel = () => {
    if (current) {
      current.pause();
      current = null;
    }
  };

  const play = async (request: PlaybackRequest): Promise<PlaybackResult> => {
    if (request.kind === "tts") {
      return { status: "unavailable", reason: "TTS pending Phase 0 device evidence (003a Task 1/7)" };
    }
    // Every browser playback URL must be origin-rooted under /audio/ (spec 003).
    if (!request.src.startsWith("/audio/")) {
      return { status: "failed", reason: `refusing non-/audio/ source: ${request.src}` };
    }
    cancel(); // one clip at a time
    const element = createAudio(request.src);
    current = element;
    element.addEventListener("ended", () => {
      if (current === element) current = null;
    });
    try {
      await element.play();
      return { status: "started" };
    } catch (err) {
      if (current === element) current = null;
      return { status: "failed", reason: err instanceof Error ? err.message : "playback failed" };
    }
  };

  return { play, cancel };
}

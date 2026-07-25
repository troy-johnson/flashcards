/**
 * Isolated playback service (003a Task 7 contract, recorded lane shipped with
 * Task 8). Output-only by design: never reads student state, never exposes
 * scoring callbacks, cannot advance or block practice.
 *
 * TTS starts synchronously from the caller's tap. Target-device QA remains the
 * evidence gate for browser/voice behavior.
 */

export type PlaybackRequest =
  | { kind: "recorded"; src: string }
  | { kind: "tts"; text: string };

export type PlaybackResult =
  | { status: "started" }
  /** Reserved for the TTS lane (Task 7): utterances resolve on completion.
      The recorded lane resolves "started" as soon as playback begins. */
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
  createUtterance?: (text: string) => SpeechSynthesisUtterance;
  speechSynthesis?: Pick<SpeechSynthesis, "cancel" | "getVoices" | "speak">;
};

export function createPlaybackController(deps: PlaybackDeps = {}): PlaybackController {
  const createAudio = deps.createAudio ?? ((src: string) => new Audio(src));
  const createUtterance = deps.createUtterance ?? ((text: string) => new SpeechSynthesisUtterance(text));
  const speechSynthesis = deps.speechSynthesis ?? globalThis.speechSynthesis;
  let current: HTMLAudioElement | null = null;

  const cancel = () => {
    if (current) {
      current.pause();
      current = null;
    }
    speechSynthesis?.cancel();
  };

  const play = async (request: PlaybackRequest): Promise<PlaybackResult> => {
    if (request.kind === "tts") {
      if (
        !speechSynthesis ||
        (typeof globalThis.SpeechSynthesisUtterance === "undefined" && !deps.createUtterance)
      ) {
        return { status: "unavailable", reason: "Text-to-speech is not available in this browser" };
      }
      cancel();
      try {
        const utterance = createUtterance(request.text);
        return new Promise<PlaybackResult>((resolve) => {
          utterance.addEventListener("end", () => resolve({ status: "completed" }), { once: true });
          utterance.addEventListener(
            "error",
            () => resolve({ status: "failed", reason: "Text-to-speech could not play" }),
            { once: true }
          );
          try {
            speechSynthesis.speak(utterance);
          } catch (err) {
            resolve({
              status: "failed",
              reason: err instanceof Error ? err.message : "Text-to-speech could not start"
            });
          }
        });
      } catch (err) {
        return {
          status: "failed",
          reason: err instanceof Error ? err.message : "Text-to-speech could not start"
        };
      }
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
      // A newer play() may have superseded this one while start was pending —
      // don't report a cancelled clip as started (symmetric with the catch).
      if (current !== element) return { status: "failed", reason: "superseded by a newer play" };
      return { status: "started" };
    } catch (err) {
      if (current === element) current = null;
      return { status: "failed", reason: err instanceof Error ? err.message : "playback failed" };
    }
  };

  return { play, cancel };
}

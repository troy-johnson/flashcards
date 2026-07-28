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
  ttsTimeoutMs?: number;
};

export function createPlaybackController(deps: PlaybackDeps = {}): PlaybackController {
  const createAudio = deps.createAudio ?? ((src: string) => new Audio(src));
  const createUtterance = deps.createUtterance ?? ((text: string) => new SpeechSynthesisUtterance(text));
  const speechSynthesis = deps.speechSynthesis ?? globalThis.speechSynthesis;
  const ttsTimeoutMs = deps.ttsTimeoutMs ?? 15_000;
  let current: HTMLAudioElement | null = null;
  let currentTts:
    | {
        settle(result: PlaybackResult): void;
      }
    | null = null;

  const cancelWithReason = (reason: string) => {
    if (current) {
      current.pause();
      current = null;
    }
    currentTts?.settle({ status: "failed", reason });
    speechSynthesis?.cancel();
  };

  const cancel = () => cancelWithReason("playback canceled");

  const play = async (request: PlaybackRequest): Promise<PlaybackResult> => {
    if (request.kind === "tts") {
      if (
        !speechSynthesis ||
        (typeof globalThis.SpeechSynthesisUtterance === "undefined" && !deps.createUtterance)
      ) {
        return { status: "unavailable", reason: "Text-to-speech is not available in this browser" };
      }
      cancelWithReason("superseded by a newer play");
      try {
        const utterance = createUtterance(request.text);
        return new Promise<PlaybackResult>((resolve) => {
          let settled = false;
          let timeout: ReturnType<typeof setTimeout> | undefined;
          const onEnd = () => active.settle({ status: "completed" });
          const onError = () =>
            active.settle({ status: "failed", reason: "Text-to-speech could not play" });
          const active = {
            settle(result: PlaybackResult) {
              if (settled) return;
              settled = true;
              if (timeout !== undefined) clearTimeout(timeout);
              utterance.removeEventListener("end", onEnd);
              utterance.removeEventListener("error", onError);
              if (currentTts === active) currentTts = null;
              resolve(result);
            }
          };
          currentTts = active;
          utterance.addEventListener("end", onEnd, { once: true });
          utterance.addEventListener("error", onError, { once: true });
          timeout = setTimeout(() => {
            active.settle({ status: "failed", reason: "Text-to-speech timed out" });
            speechSynthesis.cancel();
          }, ttsTimeoutMs);
          try {
            speechSynthesis.speak(utterance);
          } catch (err) {
            active.settle({
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
    cancelWithReason("superseded by a newer play"); // one output at a time
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

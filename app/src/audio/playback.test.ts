/** @vitest-environment jsdom */
import { afterEach, describe, expect, it, vi } from "vitest";
import { createPlaybackController } from "./playback";

/** Recorded and TTS playback stay behind one output-only controller (003a). */

type FakeAudio = {
  src: string;
  play: ReturnType<typeof vi.fn>;
  pause: ReturnType<typeof vi.fn>;
  addEventListener: ReturnType<typeof vi.fn>;
  removeEventListener: ReturnType<typeof vi.fn>;
};

const makeFakeAudio = (playImpl?: () => Promise<void>) => {
  const created: FakeAudio[] = [];
  const createAudio = (src: string): HTMLAudioElement => {
    const fake: FakeAudio = {
      src,
      play: vi.fn(playImpl ?? (() => Promise.resolve())),
      pause: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn()
    };
    created.push(fake);
    return fake as unknown as HTMLAudioElement;
  };
  return { created, createAudio };
};

describe("createPlaybackController — recorded lane", () => {
  afterEach(() => vi.restoreAllMocks());

  it("plays an origin-rooted /audio/ source and reports started", async () => {
    const { created, createAudio } = makeFakeAudio();
    const controller = createPlaybackController({ createAudio });
    const result = await controller.play({ kind: "recorded", src: "/audio/sound_short_a.mp3" });
    expect(result).toEqual({ status: "started" });
    expect(created[0]?.src).toBe("/audio/sound_short_a.mp3");
    expect(created[0]?.play).toHaveBeenCalledTimes(1);
  });

  it("refuses a source not rooted under /audio/", async () => {
    const { created, createAudio } = makeFakeAudio();
    const controller = createPlaybackController({ createAudio });
    const result = await controller.play({ kind: "recorded", src: "https://evil.example/x.mp3" });
    expect(result.status).toBe("failed");
    expect(created.length).toBe(0); // never constructs the element
  });

  it("cancels the prior clip when a second play starts (one clip at a time)", async () => {
    const { created, createAudio } = makeFakeAudio();
    const controller = createPlaybackController({ createAudio });
    await controller.play({ kind: "recorded", src: "/audio/a.mp3" });
    await controller.play({ kind: "recorded", src: "/audio/b.mp3" });
    expect(created[0]?.pause).toHaveBeenCalled();
    expect(created[1]?.play).toHaveBeenCalledTimes(1);
  });

  it("reports failed when the element cannot start", async () => {
    const { createAudio } = makeFakeAudio(() => Promise.reject(new Error("NotAllowedError")));
    const controller = createPlaybackController({ createAudio });
    const result = await controller.play({ kind: "recorded", src: "/audio/a.mp3" });
    expect(result.status).toBe("failed");
  });

  it("cancel() pauses the current clip", async () => {
    const { created, createAudio } = makeFakeAudio();
    const controller = createPlaybackController({ createAudio });
    await controller.play({ kind: "recorded", src: "/audio/a.mp3" });
    controller.cancel();
    expect(created[0]?.pause).toHaveBeenCalled();
  });
});

describe("createPlaybackController — tts lane", () => {
  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it("speaks text directly from the play call and completes when the utterance ends", async () => {
    const utterances: SpeechSynthesisUtterance[] = [];
    const createUtterance = (text: string) => {
      const utterance = new EventTarget() as SpeechSynthesisUtterance;
      Object.assign(utterance, { text, voice: null });
      utterances.push(utterance);
      return utterance;
    };
    const speechSynthesis = {
      cancel: vi.fn(),
      getVoices: vi.fn(() => []),
      speak: vi.fn((utterance: SpeechSynthesisUtterance) => {
        queueMicrotask(() => utterance.dispatchEvent(new Event("end")));
      })
    };
    const controller = createPlaybackController({
      createAudio: makeFakeAudio().createAudio,
      createUtterance,
      speechSynthesis
    });

    const result = await controller.play({ kind: "tts", text: "mat" });

    expect(speechSynthesis.speak).toHaveBeenCalledWith(utterances[0]);
    expect(utterances[0]?.text).toBe("mat");
    expect(result).toEqual({ status: "completed" });
  });

  it("returns a typed failure when the browser rejects speech startup", async () => {
    const createUtterance = (text: string) =>
      Object.assign(new EventTarget(), { text, voice: null }) as SpeechSynthesisUtterance;
    const controller = createPlaybackController({
      createAudio: makeFakeAudio().createAudio,
      createUtterance,
      speechSynthesis: {
        cancel: vi.fn(),
        getVoices: vi.fn(() => []),
        speak: vi.fn(() => {
          throw new Error("speech startup failed");
        })
      }
    });

    await expect(controller.play({ kind: "tts", text: "mat" })).resolves.toEqual({
      status: "failed",
      reason: "speech startup failed"
    });
  });

  it("fails within a bounded timeout when the browser emits no completion event", async () => {
    vi.useFakeTimers();
    const utterances: SpeechSynthesisUtterance[] = [];
    const createUtterance = (text: string) => {
      const utterance = Object.assign(new EventTarget(), {
        text,
        voice: null
      }) as SpeechSynthesisUtterance;
      utterances.push(utterance);
      return utterance;
    };
    const speechSynthesis = {
      cancel: vi.fn(),
      getVoices: vi.fn(() => []),
      speak: vi.fn()
    };
    const controller = createPlaybackController({
      createUtterance,
      speechSynthesis,
      ttsTimeoutMs: 100
    });

    const result = controller.play({ kind: "tts", text: "mat" });
    await vi.advanceTimersByTimeAsync(100);

    await expect(result).resolves.toEqual({
      status: "failed",
      reason: "Text-to-speech timed out"
    });
    expect(speechSynthesis.cancel).toHaveBeenCalled();
    expect(vi.getTimerCount()).toBe(0);

    const retry = controller.play({ kind: "tts", text: "mat" });
    utterances[1]?.dispatchEvent(new Event("end"));
    await expect(retry).resolves.toEqual({ status: "completed" });
    expect(vi.getTimerCount()).toBe(0);
  });

  it("settles the prior request when a newer utterance replaces it and ignores stale events", async () => {
    const utterances: SpeechSynthesisUtterance[] = [];
    const createUtterance = (text: string) => {
      const utterance = Object.assign(new EventTarget(), {
        text,
        voice: null
      }) as SpeechSynthesisUtterance;
      utterances.push(utterance);
      return utterance;
    };
    const speechSynthesis = {
      cancel: vi.fn(),
      getVoices: vi.fn(() => []),
      speak: vi.fn()
    };
    const controller = createPlaybackController({ createUtterance, speechSynthesis });

    const first = controller.play({ kind: "tts", text: "mat" });
    const second = controller.play({ kind: "tts", text: "sat" });

    await expect(first).resolves.toEqual({
      status: "failed",
      reason: "superseded by a newer play"
    });
    utterances[0]?.dispatchEvent(new Event("end"));
    utterances[1]?.dispatchEvent(new Event("end"));
    await expect(second).resolves.toEqual({ status: "completed" });
  });

  it("settles an in-flight utterance when cancel is called", async () => {
    const createUtterance = (text: string) =>
      Object.assign(new EventTarget(), { text, voice: null }) as SpeechSynthesisUtterance;
    const speechSynthesis = {
      cancel: vi.fn(),
      getVoices: vi.fn(() => []),
      speak: vi.fn()
    };
    const controller = createPlaybackController({ createUtterance, speechSynthesis });

    const result = controller.play({ kind: "tts", text: "mat" });
    controller.cancel();

    await expect(result).resolves.toEqual({
      status: "failed",
      reason: "playback canceled"
    });
  });

  it("cleans up its timeout on completion and can retry after a failure", async () => {
    vi.useFakeTimers();
    const utterances: SpeechSynthesisUtterance[] = [];
    const createUtterance = (text: string) => {
      const utterance = Object.assign(new EventTarget(), {
        text,
        voice: null
      }) as SpeechSynthesisUtterance;
      utterances.push(utterance);
      return utterance;
    };
    const controller = createPlaybackController({
      createUtterance,
      speechSynthesis: {
        cancel: vi.fn(),
        getVoices: vi.fn(() => []),
        speak: vi.fn()
      },
      ttsTimeoutMs: 100
    });

    const first = controller.play({ kind: "tts", text: "mat" });
    utterances[0]?.dispatchEvent(new Event("error"));
    await expect(first).resolves.toEqual({
      status: "failed",
      reason: "Text-to-speech could not play"
    });

    const retry = controller.play({ kind: "tts", text: "mat" });
    utterances[1]?.dispatchEvent(new Event("end"));
    await expect(retry).resolves.toEqual({ status: "completed" });
    expect(vi.getTimerCount()).toBe(0);
  });

  it("reports unavailable speech synthesis without entering a stuck request", async () => {
    vi.stubGlobal("speechSynthesis", undefined);
    vi.stubGlobal("SpeechSynthesisUtterance", undefined);
    const controller = createPlaybackController();

    await expect(controller.play({ kind: "tts", text: "mat" })).resolves.toEqual({
      status: "unavailable",
      reason: "Text-to-speech is not available in this browser"
    });
    controller.cancel();
  });
});

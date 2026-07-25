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
});

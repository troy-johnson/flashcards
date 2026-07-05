/** @vitest-environment jsdom */
import { afterEach, describe, expect, it, vi } from "vitest";
import { createPlaybackController } from "./playback";

/**
 * Recorded-lane tests (003a Task 8 needs clip playback). The TTS lane is
 * deliberately stubbed to `unavailable` until the Phase 0 device spike selects
 * an initiation algorithm (Task 7) — locked by a test below.
 */

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

describe("createPlaybackController — tts lane (Phase 0 gate)", () => {
  it("returns unavailable until the Phase 0 device spike selects an algorithm", async () => {
    const controller = createPlaybackController({ createAudio: makeFakeAudio().createAudio });
    const result = await controller.play({ kind: "tts", text: "mat" });
    expect(result.status).toBe("unavailable");
  });
});

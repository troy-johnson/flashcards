/** @vitest-environment jsdom */
import React, { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { AudioCatalogRoute } from "./AudioCatalogRoute";
import { getAudioCatalog } from "../api/literacy";
import { ApiError } from "../api/client";
import type { AudioCatalogResponse, AudioCatalogSound } from "../api/types";

vi.mock("../api/literacy", () => ({ getAudioCatalog: vi.fn() }));

const play = vi.fn(async (_request: unknown) => ({ status: "started" as const }));
vi.mock("../audio/playback", () => ({
  createPlaybackController: () => ({ play: (r: unknown) => play(r), cancel: vi.fn() })
}));

const flush = () => new Promise((resolve) => setTimeout(resolve, 0));

/** 44 sounds; the first two carry playback media, the rest are unrecorded. */
const makeCatalog = (): AudioCatalogResponse => {
  const sounds: AudioCatalogSound[] = Array.from({ length: 44 }, (_, i) => ({
    sound_id: `sound_${String(i).padStart(2, "0")}`,
    instructional_label: `s${i}`,
    ipa: i === 0 ? "/θ/" : `/s${i}/`,
    example_word: i === 0 ? "thin" : `word${i}`,
    phonetic_class: "test",
    production_behavior: "clip",
    production_notes: "",
    dialect_notes: "",
    recording_guidance: "guidance",
    processing_profile: "standard",
    reviews:
      i === 0
        ? [{ kind: "slp", reviewer: "Dr. Reviewer", reviewed_at: "2026-07-01", status: "approved", subject_sha256: "abc123def456" }]
        : [],
    ...(i < 2
      ? {
          playback_url: `/audio/sound_${String(i).padStart(2, "0")}.mp3`,
          runtime_playback_url: `/audio/generated/sound_${String(i).padStart(2, "0")}.mp3`,
          playback_sha256: `sha-${i}`.padEnd(64, "0")
        }
      : {})
  }));
  const patterns = Array.from({ length: 12 }, (_, i) => ({
    mapping_id: `mapping_${i}`,
    grapheme: `g${i}`,
    // The first mapping references TWO sounds (variant/sequence case).
    sound_ids: i === 0 ? ["sound_00", "sound_01"] : [`sound_${String(i).padStart(2, "0")}`],
    example_word: `ex${i}`,
    note: ""
  }));
  return { sounds, patterns };
};

describe("AudioCatalogRoute (003a Task 8)", () => {
  let container: HTMLDivElement;
  let root: Root;

  beforeEach(() => {
    container = document.createElement("div");
    document.body.appendChild(container);
    root = createRoot(container);
  });

  afterEach(() => {
    root.unmount();
    container.remove();
    vi.clearAllMocks();
  });

  const render = async () => {
    await act(async () => {
      root.render(<AudioCatalogRoute />);
      await flush();
    });
  };

  it("shows a loading state with no review metadata before the API responds", async () => {
    vi.mocked(getAudioCatalog).mockReturnValue(new Promise(() => {}));
    await render();
    expect(container.textContent).toContain("Loading");
    expect(container.textContent).not.toContain("Dr. Reviewer");
  });

  it("shows an access-denied state on 403", async () => {
    vi.mocked(getAudioCatalog).mockRejectedValue(new ApiError(403, "forbidden"));
    await render();
    expect(container.textContent).toMatch(/access|not authorized/i);
    expect(container.textContent).not.toContain("Dr. Reviewer");
  });

  it("shows a retryable error state on other failures", async () => {
    vi.mocked(getAudioCatalog).mockRejectedValue(new ApiError(503, "unavailable"));
    await render();
    expect(container.textContent).toMatch(/could not load/i);
  });

  it("renders all 44 sounds and 12 mappings with review metadata after an authorized response", async () => {
    vi.mocked(getAudioCatalog).mockResolvedValue(makeCatalog());
    await render();
    expect(container.querySelectorAll("[data-sound-row]").length).toBe(44);
    expect(container.querySelectorAll("[data-pattern-row]").length).toBe(12);
    expect(container.textContent).toContain("Dr. Reviewer");
    // Pending rows carry the explicit release gate.
    expect(container.textContent).toContain("SLP approval required before learner use");
  });

  it("gives play buttons specific accessible names and only for recorded sounds", async () => {
    vi.mocked(getAudioCatalog).mockResolvedValue(makeCatalog());
    await render();
    const btn = container.querySelector('button[aria-label="Play /θ/ as in thin"]');
    expect(btn).not.toBeNull();
    // 2 recorded sounds → sound-row play buttons only for those.
    expect(container.querySelectorAll("[data-sound-row] button[data-play]").length).toBe(2);
  });

  it("plays via the controller (which enforces one clip at a time)", async () => {
    vi.mocked(getAudioCatalog).mockResolvedValue(makeCatalog());
    await render();
    const btn = container.querySelector<HTMLButtonElement>('button[aria-label="Play /θ/ as in thin"]')!;
    await act(async () => {
      btn.click();
      await flush();
    });
    expect(play).toHaveBeenCalledWith({ kind: "recorded", src: "/audio/generated/sound_00.mp3" });
  });

  it("does not fall back to the canonical source URL when staging metadata is missing", async () => {
    const catalog = makeCatalog();
    catalog.sounds[0] = { ...catalog.sounds[0]!, runtime_playback_url: undefined };
    vi.mocked(getAudioCatalog).mockResolvedValue(catalog);
    await render();

    const row = container.querySelector('[data-sound-row="sound_00"]')!;
    expect(row.querySelector("button[data-play]")).toBeNull();
  });

  it("shows referenced sound play buttons on multi-sound mappings", async () => {
    vi.mocked(getAudioCatalog).mockResolvedValue(makeCatalog());
    await render();
    const firstMapping = container.querySelector('[data-pattern-row="mapping_0"]')!;
    expect(firstMapping.querySelectorAll("button[data-play]").length).toBe(2);
  });

  it("shows a pattern-row playback failure inline in THAT pattern row (review finding 1)", async () => {
    vi.mocked(getAudioCatalog).mockResolvedValue(makeCatalog());
    play.mockResolvedValueOnce({ status: "failed", reason: "media error" } as never);
    await render();
    const patternRow = container.querySelector('[data-pattern-row="mapping_0"]')!;
    const soundRow = container.querySelector('[data-sound-row="sound_00"]')!;
    const btn = patternRow.querySelector<HTMLButtonElement>("button[data-play]")!;
    await act(async () => {
      btn.click();
      await flush();
    });
    expect(patternRow.textContent).toMatch(/could not play/i);
    // The error belongs to the clicked button, not the same sound's row elsewhere.
    expect(soundRow.textContent).not.toMatch(/could not play/i);
  });

  it("shows review records even for sounds without playback media (review finding 2)", async () => {
    const catalog = makeCatalog();
    // Give an UNRECORDED sound a review record (type permits it).
    catalog.sounds[5] = {
      ...catalog.sounds[5]!,
      reviews: [{ kind: "owner", reviewer: "Owner Person", reviewed_at: "2026-07-02", status: "changes_requested", subject_sha256: "feedbeef" }]
    };
    vi.mocked(getAudioCatalog).mockResolvedValue(catalog);
    await render();
    const row = container.querySelector('[data-sound-row="sound_05"]')!;
    expect(row.textContent).toContain("Owner Person");
    expect(row.textContent).toContain("Not recorded");
  });

  it("keeps a per-row playback failure from breaking other rows", async () => {
    vi.mocked(getAudioCatalog).mockResolvedValue(makeCatalog());
    play.mockResolvedValueOnce({ status: "failed", reason: "media error" } as never);
    await render();
    const rows = container.querySelectorAll("[data-sound-row]");
    const failBtn = rows[0]!.querySelector<HTMLButtonElement>("button[data-play]")!;
    await act(async () => {
      failBtn.click();
      await flush();
    });
    // Failed row shows an inline error…
    expect(rows[0]!.textContent).toMatch(/could not play/i);
    // …and the other recorded row still plays fine.
    const okBtn = rows[1]!.querySelector<HTMLButtonElement>("button[data-play]")!;
    await act(async () => {
      okBtn.click();
      await flush();
    });
    expect(rows[1]!.textContent).not.toMatch(/could not play/i);
    expect(play).toHaveBeenCalledTimes(2);
  });
});

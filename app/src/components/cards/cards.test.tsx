/** @vitest-environment jsdom */
import React, { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { DrillCard } from "./DrillCard";
import { splitHeartParts } from "./heartParts";
import type { PracticeCard } from "../../api/types";

const flush = () => new Promise((resolve) => setTimeout(resolve, 0));

describe("DrillCard mode rendering (002i rw-qjk)", () => {
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

  const render = async (card: PracticeCard, onScore: (r: string) => void | Promise<void> = () => {}) => {
    await act(async () => {
      root.render(<DrillCard card={card} onScore={onScore as never} />);
      await flush();
    });
  };

  it("renders canonical PA instructions as distinct guardian and child regions", async () => {
    await render({
      skill_id: "pa_k_u1_blend_two_sound",
      item_id: "pa_k_u1_blend_at",
      text: "Blend /a/ and /t/.",
      kind: "pa",
      answer: "at",
      guardian_script: "Say, ‘/a/ /t/.’ Stretch /a/ slightly, then say /t/ right after it.",
      student_task: "Your child puts the sounds together and says the word."
    });

    const roleRegions = [...container.querySelectorAll(".pa-role-instruction")];
    expect(roleRegions).toHaveLength(2);
    expect(roleRegions[0]?.querySelector("h2")?.textContent).toBe("What you say");
    expect(roleRegions[0]?.querySelector("p")?.textContent).toBe(
      "Say, ‘/a/ /t/.’ Stretch /a/ slightly, then say /t/ right after it."
    );
    expect(roleRegions[1]?.querySelector("h2")?.textContent).toBe("What your child does");
    expect(roleRegions[1]?.querySelector("p")?.textContent).toBe(
      "Your child puts the sounds together and says the word."
    );
    expect(container.querySelector(".guardian-answer")?.textContent).toBe("Listen for: at");
    expect(container.textContent).not.toContain("Blend /a/ and /t/.");
    expect([...container.querySelectorAll<HTMLButtonElement>(".tap-controls button")].map((button) => button.textContent)).toEqual([
      "Correct",
      "Try again",
      "Skip"
    ]);
  });

  it("keeps the legacy PA prompt and answer experience when role instructions are absent", async () => {
    await render({
      skill_id: "pa_k_u1_blend_two_sound",
      item_id: "pa_k_u1_blend_at",
      text: "Blend /a/ and /t/.",
      kind: "pa",
      answer: "at"
    });
    expect(container.querySelector(".eyebrow")?.textContent).toBe("Listen and say it");
    expect(container.textContent).toContain("Blend /a/ and /t/.");
    const note = container.querySelector(".guardian-answer");
    expect(note?.textContent).toContain("at");
  });

  it("renders a heart word with irregular parts visually distinct", async () => {
    await render({
      skill_id: "heart_k_u1_batch_01",
      item_id: "heart_k_u1_said",
      text: "said",
      kind: "heart",
      regular_parts: ["s", "d"],
      irregular_parts: ["ai"]
    });
    expect(container.querySelector(".eyebrow")?.textContent).toBe("Read this heart word");
    const hearts = [...container.querySelectorAll(".heart-part")];
    expect(hearts.map((el) => el.textContent)).toEqual(["ai"]);
    // The whole word still reads in order.
    expect(container.querySelector(".card-word")?.textContent).toBe("said");
  });

  it("renders the full word when irregular_parts is missing or empty (codex review finding 3 refutation lock)", async () => {
    await render({
      skill_id: "heart_k_u1_batch_01",
      item_id: "heart_k_u1_the",
      text: "the",
      kind: "heart"
    });
    expect(container.querySelector(".card-word")?.textContent).toBe("the");
  });

  it("falls back to plain text when heart parts do not match the word (bad content never crashes a drill)", async () => {
    await render({
      skill_id: "heart_k_u1_batch_01",
      item_id: "heart_k_u1_said",
      text: "said",
      kind: "heart",
      irregular_parts: ["zz"]
    });
    expect(container.querySelector(".card-word")?.textContent).toBe("said");
    expect(container.querySelector(".heart-part")).toBeNull();
  });

  it("renders a fluency card with sentence copy and sentence sizing", async () => {
    await render({
      skill_id: "fluency_k_u1_cvc_sentences",
      item_id: "fluency_k_u1_sam_sat",
      text: "Sam sat.",
      kind: "fluency"
    });
    expect(container.querySelector(".eyebrow")?.textContent).toBe("Read this sentence");
    expect(container.querySelector(".card-sentence")?.textContent).toBe("Sam sat.");
  });

  it("renders a card without kind as a phonics card (legacy plan_json / localStorage)", async () => {
    await render({ skill_id: "phonics_k_u1_short_a", item_id: "mat", text: "mat" });
    expect(container.querySelector(".eyebrow")?.textContent).toBe("Read this word");
    expect(container.querySelector(".card-word")?.textContent).toBe("mat");
  });

  it("fires onScore once per card and re-enables on rejection, on every mode", async () => {
    const onScore = vi.fn(async () => {});
    await render(
      { skill_id: "fluency_k_u1_cvc_sentences", item_id: "f1", text: "Sam sat.", kind: "fluency" },
      onScore
    );
    const correct = container.querySelector<HTMLButtonElement>('button[data-result="correct"]')!;
    await act(async () => {
      correct.click();
      correct.click();
      await flush();
    });
    expect(onScore).toHaveBeenCalledTimes(1);

    const rejecting = vi.fn(async () => {
      throw new Error("save failed");
    });
    await render({ skill_id: "pa_k", item_id: "p1", text: "Blend.", kind: "pa", answer: "at" }, rejecting);
    const btn = container.querySelector<HTMLButtonElement>('button[data-result="correct"]')!;
    await act(async () => {
      btn.click();
      await flush();
    });
    expect(btn.disabled).toBe(false); // scored state reset so the guardian can retry
  });
});

describe("splitHeartParts", () => {
  it("splits interleaved regular/irregular segments left to right", () => {
    expect(splitHeartParts("said", ["ai"])).toEqual([
      { text: "s", heart: false },
      { text: "ai", heart: true },
      { text: "d", heart: false }
    ]);
  });

  it("handles a trailing irregular part", () => {
    expect(splitHeartParts("the", ["e"])).toEqual([
      { text: "th", heart: false },
      { text: "e", heart: true }
    ]);
  });

  it("returns null when a part cannot be matched", () => {
    expect(splitHeartParts("said", ["zz"])).toBeNull();
  });
});

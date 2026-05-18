/** @vitest-environment jsdom */
import React, { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import App from "../App";
import { scoreAttempt, startPractice } from "../api/literacy";

vi.mock("../api/literacy", () => ({
  signIn: vi.fn(),
  listStudents: vi.fn(async () => ({ students: [] })),
  createStudent: vi.fn(),
  getStudent: vi.fn(async () => ({ student: { id: "student1", display_name: "Ada", grade: "K", birth_month: null, prefs_json: "{}", created_at: "now", archived_at: null } })),
  startPractice: vi.fn(async () => ({
    practice_session: {
      id: "practice1",
      student_id: "student1",
      plan: {
        cards: [
          { skill_id: "phonics_k_u1_short_a", item_id: "cat", text: "cat" },
          { skill_id: "phonics_k_u1_short_a", item_id: "mat", text: "mat" }
        ]
      }
    }
  })),
  scoreAttempt: vi.fn(async () => ({ attempt: { id: "attempt1", scoring_source: "guardian_tap" } }))
}));

const flush = () => new Promise((resolve) => setTimeout(resolve, 0));

describe("play and drill routes", () => {
  let container: HTMLDivElement;
  let root: Root;

  beforeEach(() => {
    sessionStorage.clear();
    container = document.createElement("div");
    document.body.appendChild(container);
    root = createRoot(container);
  });

  afterEach(() => {
    root.unmount();
    container.remove();
    vi.clearAllMocks();
  });

  it("starts a plan, scores guardian taps, advances cards, and reaches done", async () => {
    window.history.pushState({}, "", "/play/student1");
    await act(async () => {
      root.render(<App />);
      await flush();
    });

    expect(startPractice).toHaveBeenCalledWith("student1");
    expect(container.textContent).toContain("Today: 2 things");

    await act(async () => {
      container.querySelector("button")?.dispatchEvent(new MouseEvent("click", { bubbles: true }));
      await flush();
    });
    expect(window.location.pathname).toBe("/play/student1/drill");
    expect(container.textContent).toContain("cat");

    await act(async () => {
      container.querySelector('button[data-result="correct"]')?.dispatchEvent(new MouseEvent("click", { bubbles: true }));
      await flush();
    });
    expect(scoreAttempt).toHaveBeenCalledWith("student1", expect.objectContaining({ item_id: "cat", result: "correct" }));
    expect(container.textContent).toContain("mat");

    await act(async () => {
      container.querySelector('button[data-result="skipped"]')?.dispatchEvent(new MouseEvent("click", { bubbles: true }));
      await flush();
    });
    expect(scoreAttempt).toHaveBeenCalledWith("student1", expect.objectContaining({ item_id: "mat", result: "skipped" }));
    expect(window.location.pathname).toBe("/play/student1/done");
    expect(container.textContent).toContain("You’re done");
  });
});

/** @vitest-environment jsdom */
import React, { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import App from "../App";
import { completePractice, scoreAttempt, startPractice } from "../api/literacy";

vi.mock("../api/literacy", () => ({
  signIn: vi.fn(),
  listStudents: vi.fn(async () => ({ students: [] })),
  createStudent: vi.fn(),
  getStudent: vi.fn(async () => ({ student: { id: "student1", display_name: "Ada", grade: "K", birth_month: null, prefs_json: {}, created_at: "now", archived_at: null } })),
  getCurrentGuardian: vi.fn(async () => ({ guardian: { id: "g1", email: "g@example.com", display_name: null } })),
  getGuardianDiag: vi.fn(async () => ({ guardian: { id: "g1", email: "g@example.com", display_name: null }, summary: [], sessions: [], friction: [] })),
  logout: vi.fn(async () => undefined),
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
  scoreAttempt: vi.fn(async () => ({ attempt: { id: "attempt1", scoring_source: "guardian_tap" } })),
  completePractice: vi.fn(async () => ({ practice_session: { id: "practice1", completed_at: "now" } }))
}));

const flush = () => new Promise((resolve) => setTimeout(resolve, 0));

const practiceCache = () => sessionStorage.getItem("literacy.practice.student1");

const exitPractice = (container: HTMLDivElement) =>
  container.querySelector<HTMLButtonElement>('[data-practice-exit]');

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
    expect(completePractice).toHaveBeenCalledWith("student1", "practice1");
  });

  it("lets guardians retry the current card after a failed score save", async () => {
    (scoreAttempt as unknown as ReturnType<typeof vi.fn>)
      .mockRejectedValueOnce(new Error("network down"))
      .mockResolvedValueOnce({ attempt: { id: "attempt2", scoring_source: "guardian_tap" } });

    window.history.pushState({}, "", "/play/student1");
    await act(async () => {
      root.render(<App />);
      await flush();
    });

    await act(async () => {
      container.querySelector("button")?.dispatchEvent(new MouseEvent("click", { bubbles: true }));
      await flush();
    });

    await act(async () => {
      container.querySelector('button[data-result="correct"]')?.dispatchEvent(new MouseEvent("click", { bubbles: true }));
      await flush();
    });

    expect(container.textContent).toContain("Could not save that tap");
    expect(container.textContent).toContain("cat");
    // The save-failure message is a visually distinct alert, not plain body
    // text, so a guardian mid-drill notices the tap didn't land (rw-ir1).
    const saveAlert = container.querySelector('[role="alert"]');
    expect(saveAlert?.className).toContain("drill-alert");

    await act(async () => {
      container.querySelector('button[data-result="correct"]')?.dispatchEvent(new MouseEvent("click", { bubbles: true }));
      await flush();
    });

    expect(scoreAttempt).toHaveBeenCalledTimes(2);
    expect(container.textContent).toContain("mat");
  });

  it("surfaces a distinct alert when practice fails to start", async () => {
    (startPractice as unknown as ReturnType<typeof vi.fn>)
      .mockRejectedValueOnce(new Error("start endpoint down"));

    window.history.pushState({}, "", "/play/student1");
    await act(async () => {
      root.render(<App />);
      await flush();
    });

    // jsdom can't compute color, so we assert the styling hook (.drill-alert)
    // alongside role/text — a distinct alert, not plain body copy (rw-ir1).
    const startAlert = container.querySelector('[role="alert"]');
    expect(startAlert).not.toBeNull();
    expect(startAlert?.className).toContain("drill-alert");
    expect(startAlert?.textContent).toContain("Could not start practice");
    expect(exitPractice(container)).toBeNull();
  });

  it("still reaches the finish screen when completion telemetry fails (best-effort)", async () => {
    (completePractice as unknown as ReturnType<typeof vi.fn>)
      .mockRejectedValueOnce(new Error("completion endpoint down"));

    window.history.pushState({}, "", "/play/student1");
    await act(async () => {
      root.render(<App />);
      await flush();
    });

    await act(async () => {
      container.querySelector("button")?.dispatchEvent(new MouseEvent("click", { bubbles: true }));
      await flush();
    });

    // Score both cards; the second tap ends the session and triggers completion.
    await act(async () => {
      container.querySelector('button[data-result="correct"]')?.dispatchEvent(new MouseEvent("click", { bubbles: true }));
      await flush();
    });
    await act(async () => {
      container.querySelector('button[data-result="correct"]')?.dispatchEvent(new MouseEvent("click", { bubbles: true }));
      await flush();
    });

    // Completion was attempted but rejected — the child still finishes.
    expect(completePractice).toHaveBeenCalledWith("student1", "practice1");
    expect(window.location.pathname).toBe("/play/student1/done");
    expect(container.textContent).toContain("You’re done");
  });

  it("exits a ready practice without changing its cached server session, then resumes it", async () => {
    window.history.pushState({}, "", "/play/student1");
    await act(async () => {
      root.render(<App />);
      await flush();
    });

    const cachedBeforeExit = practiceCache();
    const exit = exitPractice(container);
    expect(exit).not.toBeNull();
    expect(exit?.textContent).toBe("Exit practice");
    expect(exit?.className).toContain("practice-exit");

    await act(async () => {
      exit?.dispatchEvent(new MouseEvent("click", { bubbles: true }));
      await flush();
    });

    expect(window.location.pathname).toBe("/guardian/student1");
    expect(scoreAttempt).not.toHaveBeenCalled();
    expect(completePractice).not.toHaveBeenCalled();
    expect(practiceCache()).toBe(cachedBeforeExit);

    await act(async () => {
      window.history.pushState({}, "", "/play/student1");
      window.dispatchEvent(new PopStateEvent("popstate"));
      await flush();
    });

    expect(container.textContent).toContain("Today: 2 things");
    expect(startPractice).toHaveBeenCalledTimes(1);
    expect(practiceCache()).toBe(cachedBeforeExit);
  });

  it("exits an unanswered drill card without scoring, advancing, or clearing it", async () => {
    window.history.pushState({}, "", "/play/student1");
    await act(async () => {
      root.render(<App />);
      await flush();
    });
    await act(async () => {
      container.querySelector("button")?.dispatchEvent(new MouseEvent("click", { bubbles: true }));
      await flush();
    });

    expect(container.textContent).toContain("cat");
    const cachedBeforeExit = practiceCache();

    await act(async () => {
      exitPractice(container)?.dispatchEvent(new MouseEvent("click", { bubbles: true }));
      await flush();
    });

    expect(window.location.pathname).toBe("/guardian/student1");
    expect(scoreAttempt).not.toHaveBeenCalled();
    expect(completePractice).not.toHaveBeenCalled();
    expect(practiceCache()).toBe(cachedBeforeExit);

    await act(async () => {
      window.history.pushState({}, "", "/play/student1/drill");
      window.dispatchEvent(new PopStateEvent("popstate"));
      await flush();
    });
    expect(container.textContent).toContain("cat");
  });

  it("disables exit while a score request is pending", async () => {
    let acceptScore!: (value: { attempt: { id: string; scoring_source: string } }) => void;
    (scoreAttempt as unknown as ReturnType<typeof vi.fn>).mockImplementationOnce(
      () => new Promise((resolve) => { acceptScore = resolve; })
    );

    window.history.pushState({}, "", "/play/student1");
    await act(async () => {
      root.render(<App />);
      await flush();
    });
    await act(async () => {
      container.querySelector("button")?.dispatchEvent(new MouseEvent("click", { bubbles: true }));
      await flush();
    });

    await act(async () => {
      container.querySelector('button[data-result="correct"]')?.dispatchEvent(new MouseEvent("click", { bubbles: true }));
      await flush();
    });

    const pendingExit = exitPractice(container);
    expect(pendingExit?.disabled).toBe(true);
    pendingExit?.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    expect(window.location.pathname).toBe("/play/student1/drill");

    await act(async () => {
      acceptScore({ attempt: { id: "attempt-pending", scoring_source: "guardian_tap" } });
      await flush();
    });
    expect(exitPractice(container)?.disabled).toBe(false);
  });

  it.each([
    ["correct", "correct"],
    ["incorrect", "incorrect"],
    ["skipped", "skipped"]
  ] as const)("preserves an accepted %s result and advanced card when exiting", async (hook, result) => {
    window.history.pushState({}, "", "/play/student1");
    await act(async () => {
      root.render(<App />);
      await flush();
    });
    await act(async () => {
      container.querySelector("button")?.dispatchEvent(new MouseEvent("click", { bubbles: true }));
      await flush();
    });

    await act(async () => {
      container.querySelector(`button[data-result="${hook}"]`)?.dispatchEvent(new MouseEvent("click", { bubbles: true }));
      await flush();
    });

    const cachedAfterScore = practiceCache();
    expect(JSON.parse(cachedAfterScore ?? "null")).toMatchObject({
      session: { id: "practice1", plan: { cards: expect.any(Array) } },
      index: 1
    });
    expect(scoreAttempt).toHaveBeenCalledWith("student1", expect.objectContaining({ item_id: "cat", result }));

    expect(exitPractice(container)).not.toBeNull();
    await act(async () => {
      exitPractice(container)?.dispatchEvent(new MouseEvent("click", { bubbles: true }));
      await flush();
    });

    expect(window.location.pathname).toBe("/guardian/student1");
    expect(scoreAttempt).toHaveBeenCalledTimes(1);
    expect(completePractice).not.toHaveBeenCalled();
    expect(practiceCache()).toBe(cachedAfterScore);

    await act(async () => {
      window.history.pushState({}, "", "/play/student1/drill");
      window.dispatchEvent(new PopStateEvent("popstate"));
      await flush();
    });
    expect(container.textContent).toContain("mat");
  });

  it("loads the same active card from session storage after a same-tab reload", async () => {
    sessionStorage.setItem("literacy.practice.student1", JSON.stringify({
      session: {
        id: "server-session",
        student_id: "student1",
        plan: { cards: [
          { skill_id: "phonics_k_u1_short_a", item_id: "cat", text: "cat" },
          { skill_id: "phonics_k_u1_short_a", item_id: "mat", text: "mat" }
        ] }
      },
      index: 1,
      shown_at: "2026-07-12T00:00:00.000Z"
    }));
    const cachedBeforeReload = practiceCache();

    window.history.pushState({}, "", "/play/student1/drill");
    await act(async () => {
      root.render(<App />);
      await flush();
    });
    expect(container.textContent).toContain("mat");

    await act(async () => root.unmount());
    root = createRoot(container);
    await act(async () => {
      root.render(<App />);
      await flush();
    });

    expect(container.textContent).toContain("mat");
    expect(startPractice).not.toHaveBeenCalled();
    expect(practiceCache()).toBe(cachedBeforeReload);
    expect(exitPractice(container)).not.toBeNull();
  });

  it("does not show Exit practice on loading, start error, no-cards, or done surfaces", async () => {
    let resolveStart!: (value: Awaited<ReturnType<typeof startPractice>>) => void;
    (startPractice as unknown as ReturnType<typeof vi.fn>).mockImplementationOnce(
      () => new Promise((resolve) => { resolveStart = resolve; })
    );
    window.history.pushState({}, "", "/play/student1");
    await act(async () => {
      root.render(<App />);
      await flush();
    });
    expect(exitPractice(container)).toBeNull();

    await act(async () => {
      resolveStart({ practice_session: { id: "empty", student_id: "student1", plan: { cards: [] } } });
      await flush();
    });
    expect(container.textContent).toContain("No cards available");
    expect(exitPractice(container)).toBeNull();

    await act(async () => {
      window.history.pushState({}, "", "/play/student1/done");
      window.dispatchEvent(new PopStateEvent("popstate"));
      await flush();
    });
    expect(exitPractice(container)).toBeNull();
  });
});

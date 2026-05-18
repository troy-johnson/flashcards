/** @vitest-environment jsdom */
import React from "react";
import { createRoot, type Root } from "react-dom/client";
import { act } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import App from "../App";
import { createStudent, listStudents, signIn } from "../api/literacy";

vi.mock("../api/literacy", () => ({
  signIn: vi.fn(async () => undefined),
  listStudents: vi.fn(async () => ({ students: [{ id: "student1", display_name: "Ada", grade: "K", birth_month: null, prefs_json: "{}", created_at: "now", archived_at: null }] })),
  createStudent: vi.fn(async () => ({ student: { id: "student2", display_name: "Ben", grade: "1", birth_month: null, prefs_json: "{}", created_at: "now", archived_at: null } })),
  getStudent: vi.fn(async () => ({ student: { id: "student1", display_name: "Ada", grade: "K", birth_month: null, prefs_json: "{}", created_at: "now", archived_at: null } })),
  startPractice: vi.fn(),
  scoreAttempt: vi.fn()
}));

const flush = () => new Promise((resolve) => setTimeout(resolve, 0));

describe("guardian and sign-in routes", () => {
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

  it("requests a magic link from /signin", async () => {
    window.history.pushState({}, "", "/signin");
    await act(async () => root.render(<App />));

    await act(async () => {
      (container.querySelector("input[name=email]") as HTMLInputElement).value = "Guardian@Example.com";
      container.querySelector("input[name=email]")?.dispatchEvent(new Event("input", { bubbles: true }));
      container.querySelector("form")?.dispatchEvent(new Event("submit", { bubbles: true, cancelable: true }));
      await flush();
    });

    expect(signIn).toHaveBeenCalledWith("Guardian@Example.com");
    expect(container.textContent).toContain("Check your email");
  });

  it("renders guardian dashboard and owned student navigation", async () => {
    window.history.pushState({}, "", "/guardian");
    await act(async () => {
      root.render(<App />);
      await flush();
    });

    expect(listStudents).toHaveBeenCalled();
    expect(container.textContent).toContain("Add a student");
    expect(container.textContent).toContain("Ada");
    expect(container.querySelector('a[href="/guardian/student1"]')).not.toBeNull();
  });

  it("creates a student from /guardian/add-student", async () => {
    window.history.pushState({}, "", "/guardian/add-student");
    await act(async () => root.render(<App />));

    await act(async () => {
      (container.querySelector("input[name=display_name]") as HTMLInputElement).value = "Ben";
      container.querySelector("input[name=display_name]")?.dispatchEvent(new Event("input", { bubbles: true }));
      (container.querySelector("select[name=grade]") as HTMLSelectElement).value = "1";
      container.querySelector("select[name=grade]")?.dispatchEvent(new Event("change", { bubbles: true }));
      container.querySelector("form")?.dispatchEvent(new Event("submit", { bubbles: true, cancelable: true }));
      await flush();
    });

    expect(createStudent).toHaveBeenCalledWith({ display_name: "Ben", grade: "1" });
    expect(container.textContent).toContain("Ben is ready");
  });
});

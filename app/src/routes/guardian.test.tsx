/** @vitest-environment jsdom */
import React from "react";
import { createRoot, type Root } from "react-dom/client";
import { act } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import App from "../App";
import { consumeMagicLink, createStudent, getCurrentGuardian, getStudent, listStudents, logout, signIn } from "../api/literacy";

vi.mock("../api/literacy", () => ({
  signIn: vi.fn(async () => ({})),
  consumeMagicLink: vi.fn(async () => undefined),
  listStudents: vi.fn(async () => ({ students: [{ id: "student1", display_name: "Ada", grade: "K", birth_month: null, prefs_json: {}, created_at: "now", archived_at: null }] })),
  createStudent: vi.fn(async () => ({ student: { id: "student2", display_name: "Ben", grade: "1", birth_month: null, prefs_json: {}, created_at: "now", archived_at: null } })),
  getStudent: vi.fn(async () => ({ student: { id: "student1", display_name: "Ada", grade: "K", birth_month: null, prefs_json: {}, created_at: "now", archived_at: null } })),
  getCurrentGuardian: vi.fn(async () => ({ guardian: { id: "g1", email: "g@example.com", display_name: null } })),
  getGuardianDiag: vi.fn(async () => ({ guardian: { id: "g1", email: "g@example.com", display_name: null }, summary: [], sessions: [], friction: [] })),
  logout: vi.fn(async () => undefined),
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

  it("renders a branded semantic guardian shell with a controlled menu", async () => {
    window.history.pushState({}, "", "/guardian");
    await act(async () => {
      root.render(<App />);
      await flush();
    });

    const header = container.querySelector("header.guardian-header");
    const layout = container.querySelector(".guardian-layout");
    const brand = header?.querySelector('.guardian-brand[href="/guardian"]');
    const nav = header?.querySelector('nav[aria-label="Guardian navigation"]');
    const menuButton = header?.querySelector<HTMLButtonElement>("button.guardian-menu-button");
    const menuActions = header?.querySelector(".guardian-nav-actions");

    expect(layout?.querySelector(":scope > header")).toBe(header);
    expect(layout?.querySelector(":scope > main.page-shell")).not.toBeNull();
    expect(brand?.textContent).toBe("Reader's Way");
    expect(nav).not.toBeNull();
    expect(menuButton?.textContent).toBe("Menu");
    expect(menuButton?.getAttribute("aria-expanded")).toBe("false");
    expect(menuActions).not.toBeNull();

    await act(async () => menuButton?.click());

    expect(menuButton?.getAttribute("aria-expanded")).toBe("true");
    expect(document.activeElement).toBe(header?.querySelector('a[href="/guardian"]:not(.guardian-brand)'));
  });

  it("closes the guardian menu with Escape or a repeated toggle and restores Menu focus", async () => {
    window.history.pushState({}, "", "/guardian");
    await act(async () => {
      root.render(<App />);
      await flush();
    });
    const menuButton = container.querySelector<HTMLButtonElement>(".guardian-menu-button");

    await act(async () => menuButton?.click());
    await act(async () => document.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape", bubbles: true })));
    expect(menuButton?.getAttribute("aria-expanded")).toBe("false");
    expect(document.activeElement).toBe(menuButton);

    await act(async () => menuButton?.click());
    await act(async () => menuButton?.click());
    expect(menuButton?.getAttribute("aria-expanded")).toBe("false");
    expect(document.activeElement).toBe(menuButton);
  });

  it("closes the guardian menu when an action is selected", async () => {
    window.history.pushState({}, "", "/guardian");
    await act(async () => {
      root.render(<App />);
      await flush();
    });
    const menuButton = container.querySelector<HTMLButtonElement>(".guardian-menu-button");
    const studentsLink = container.querySelector<HTMLAnchorElement>('.guardian-nav-actions a[href="/guardian"]');
    studentsLink?.addEventListener("click", (event) => event.preventDefault());

    await act(async () => menuButton?.click());
    await act(async () => studentsLink?.click());

    expect(menuButton?.getAttribute("aria-expanded")).toBe("false");
  });

  it("signs out from the guardian menu", async () => {
    window.history.pushState({}, "", "/guardian");
    await act(async () => {
      root.render(<App />);
      await flush();
    });

    await act(async () => {
      container.querySelector<HTMLFormElement>(".guardian-nav-actions form")?.dispatchEvent(
        new Event("submit", { bubbles: true, cancelable: true })
      );
      await flush();
    });

    expect(logout).toHaveBeenCalledOnce();
    expect(window.location.pathname).toBe("/");
  });

  it("shows operator navigation and dashboard links when operator_tools is true", async () => {
    (getCurrentGuardian as unknown as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      guardian: { id: "g1", email: "g@example.com", display_name: null },
      capabilities: { operator_tools: true }
    });
    window.history.pushState({}, "", "/guardian");

    await act(async () => {
      root.render(<App />);
      await flush();
    });

    expect(container.querySelectorAll('a[href="/guardian/diag"]')).toHaveLength(2);
    expect(container.querySelector('a[href="/guardian/audio-catalog"]')).not.toBeNull();
  });

  it("hides operator navigation and dashboard links when operator_tools is false", async () => {
    (getCurrentGuardian as unknown as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      guardian: { id: "g1", email: "g@example.com", display_name: null },
      capabilities: { operator_tools: false }
    });
    window.history.pushState({}, "", "/guardian");

    await act(async () => {
      root.render(<App />);
      await flush();
    });

    expect(container.querySelector('a[href="/guardian/diag"]')).toBeNull();
    expect(container.querySelector('a[href="/guardian/audio-catalog"]')).toBeNull();
  });

  it("hides operator navigation and dashboard links when capabilities are missing", async () => {
    (getCurrentGuardian as unknown as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      guardian: { id: "g1", email: "g@example.com", display_name: null }
    });
    window.history.pushState({}, "", "/guardian");

    await act(async () => {
      root.render(<App />);
      await flush();
    });

    expect(container.querySelector('a[href="/guardian/diag"]')).toBeNull();
    expect(container.querySelector('a[href="/guardian/audio-catalog"]')).toBeNull();
  });

  it("hides operator navigation and dashboard links when operator_tools is malformed", async () => {
    (getCurrentGuardian as unknown as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      guardian: { id: "g1", email: "g@example.com", display_name: null },
      capabilities: { operator_tools: "true" }
    });
    window.history.pushState({}, "", "/guardian");

    await act(async () => {
      root.render(<App />);
      await flush();
    });

    expect(container.querySelector('a[href="/guardian/diag"]')).toBeNull();
    expect(container.querySelector('a[href="/guardian/audio-catalog"]')).toBeNull();
  });

  it("renders K and 1st-grade siblings as separate selectable students", async () => {
    const siblings = [
      { id: "student_k", display_name: "Maya", grade: "K" as const, birth_month: null, prefs_json: {}, created_at: "now", archived_at: null },
      { id: "student_1", display_name: "Noah", grade: "1" as const, birth_month: null, prefs_json: {}, created_at: "now", archived_at: null }
    ];
    (listStudents as unknown as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      students: siblings
    });
    const findSibling = async (studentId: string) => {
      const student = siblings.find((candidate) => candidate.id === studentId);
      if (!student) throw new Error(`unexpected student ${studentId}`);
      return { student };
    };
    (getStudent as unknown as ReturnType<typeof vi.fn>)
      .mockImplementationOnce(findSibling)
      .mockImplementationOnce(findSibling);
    window.history.pushState({}, "", "/guardian");
    await act(async () => {
      root.render(<App />);
      await flush();
    });

    const mayaLink = container.querySelector('a[href="/guardian/student_k"]');
    const noahLink = container.querySelector('a[href="/guardian/student_1"]');
    expect(mayaLink?.textContent).toBe("Maya");
    expect(noahLink?.textContent).toBe("Noah");
    expect(mayaLink?.closest("li")?.textContent).toContain("Grade K");
    expect(noahLink?.closest("li")?.textContent).toContain("Grade 1");

    await act(async () => {
      window.history.pushState({}, "", "/guardian/student_k");
      window.dispatchEvent(new PopStateEvent("popstate"));
      await flush();
    });
    expect(getStudent).toHaveBeenCalledWith("student_k");
    expect(container.textContent).toContain("Maya's progress");
    expect(container.querySelector('a[href="/play/student_k"]')?.textContent).toBe("Start practice");

    await act(async () => {
      window.history.pushState({}, "", "/guardian/student_1");
      window.dispatchEvent(new PopStateEvent("popstate"));
      await flush();
    });
    expect(getStudent).toHaveBeenCalledWith("student_1");
    expect(container.textContent).toContain("Noah's progress");
    expect(container.querySelector('a[href="/play/student_1"]')?.textContent).toBe("Start practice");
  });

  it("creates a student from /guardian/add-student", async () => {
    window.history.pushState({}, "", "/guardian/add-student");
    await act(async () => root.render(<App />));

    await act(async () => {
      const nameInput = container.querySelector("input[name=display_name]") as HTMLInputElement;
      nameInput.value = "Ben";
      nameInput.dispatchEvent(new Event("input", { bubbles: true }));
      const gradeSelect = container.querySelector("select[name=grade]") as HTMLSelectElement;
      gradeSelect.value = "1";
      gradeSelect.dispatchEvent(new Event("change", { bubbles: true }));
      nameInput.closest("form")?.dispatchEvent(new Event("submit", { bubbles: true, cancelable: true }));
      await flush();
    });

    expect(createStudent).toHaveBeenCalledWith({ display_name: "Ben", grade: "1" });
    expect(container.textContent).toContain("Ben is ready");
  });

  it("consumes a magic link from /auth/consume and navigates to /guardian", async () => {
    window.history.pushState({}, "", "/auth/consume?token=abc123");
    await act(async () => {
      root.render(<App />);
      await flush();
    });
    await act(async () => { await flush(); });

    expect(consumeMagicLink).toHaveBeenCalledWith("abc123");
    expect(window.location.pathname).toBe("/guardian");
  });

  it("shows an error on /auth/consume when the token is rejected", async () => {
    (consumeMagicLink as unknown as ReturnType<typeof vi.fn>).mockRejectedValueOnce(new Error("401"));
    window.history.pushState({}, "", "/auth/consume?token=bad");
    await act(async () => {
      root.render(<App />);
      await flush();
    });
    await act(async () => { await flush(); });

    expect(window.location.pathname).toBe("/auth/consume");
    expect(container.textContent).toContain("invalid or expired");
  });
});

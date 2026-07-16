/** @vitest-environment jsdom */
import React from "react";
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import App from "../App";
import { support } from "copy";

vi.mock("../api/literacy", () => ({
  getCurrentGuardian: vi.fn(async () => ({ guardian: { id: "g1", email: "g@example.com", display_name: null } })),
  listStudents: vi.fn(async () => ({ students: [] }))
}));

describe("public legal routes", () => {
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
  });

  it("renders Privacy Policy topics and a deletion/data support contact", async () => {
    window.history.pushState({}, "", "/privacy");
    await act(async () => root.render(<App />));

    expect(container.textContent).toContain("Guardian accounts");
    expect(container.textContent).toContain("Child profiles");
    expect(container.textContent).toContain("Practice and session data");
    expect(container.textContent).toContain("Restrained telemetry");
    expect(container.textContent).toContain("magic link");
    expect(container.textContent).toContain("deletion");
    expect(container.textContent).toContain("There are no ads");
    expect(container.textContent).toContain("do not sell");
    expect(container.textContent).toContain("early-access pilot");
    expect(container.querySelector(`a[href="mailto:${support.email}"]`)).not.toBeNull();
    expect(container.querySelector(".guardian-header")).toBeNull();
  });

  it("renders Terms and a deletion/data support contact", async () => {
    window.history.pushState({}, "", "/terms");
    await act(async () => root.render(<App />));

    expect(container.querySelector("h1")?.textContent).toBe("Terms of Use");
    expect(container.textContent).toContain("Pilot purpose");
    expect(container.textContent).toContain("Acceptable use");
    expect(container.querySelector(`a[href="mailto:${support.email}"]`)).not.toBeNull();
  });

  it("links to the legal pages from the landing footer", async () => {
    window.history.pushState({}, "", "/");
    await act(async () => root.render(<App />));

    const footer = container.querySelector("footer");
    expect(footer).not.toBeNull();
    expect(footer?.querySelector('a[href="/privacy"]')).toBeTruthy();
    expect(footer?.querySelector('a[href="/terms"]')).toBeTruthy();
  });

  it("surfaces support contact in the authenticated guardian navigation", async () => {
    window.history.pushState({}, "", "/guardian");
    await act(async () => {
      root.render(<App />);
      await new Promise((resolve) => setTimeout(resolve, 0));
    });

    expect(container.querySelector(`a[href="mailto:${support.email}"]`)).toBeTruthy();
  });
});

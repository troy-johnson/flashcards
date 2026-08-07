/** @vitest-environment jsdom */
import React from "react";
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { landing, support } from "copy";
import App from "../App";

vi.mock("../api/literacy", () => ({
  getCurrentGuardian: vi.fn(async () => ({ guardian: null })),
  listStudents: vi.fn(async () => ({ students: [] })),
}));

describe("public landing route", () => {
  let container: HTMLDivElement;
  let root: Root;

  beforeEach(() => {
    container = document.createElement("div");
    document.body.appendChild(container);
    root = createRoot(container);
    window.history.pushState({}, "", "/");
  });

  afterEach(() => {
    root.unmount();
    container.remove();
  });

  it("renders the invited-pilot story and contact path", async () => {
    await act(async () => root.render(<App />));

    expect(container.textContent).toContain(landing.headline);
    expect(container.textContent).toContain(landing.subtitle);
    expect(container.textContent).toContain(landing.audience);
    expect(container.textContent).toContain(landing.practice);
    expect(container.textContent).toContain(landing.instruction);
    expect(container.textContent).toContain(landing.privacy);
    expect(container.textContent).toContain(landing.pilot);
    expect(container.textContent).toContain(landing.storyHeading);
    expect(container.textContent).toContain(landing.privacyHeading);
    expect(container.textContent).toContain(landing.stepsHeading);
    expect(container.textContent).toContain(landing.steps[0].title);
    expect(container.textContent).toContain(landing.steps[1].body);
    expect(container.textContent).toContain(landing.antiGamification);
    expect(container.textContent).toContain(landing.ctaPrompt);
    expect(container.textContent).toContain(landing.contactCta);
    expect(container.querySelector(`a[href="mailto:${support.email}"]`)).not.toBeNull();
    expect(container.querySelector('a[href="/privacy"]')).not.toBeNull();
    expect(container.querySelector('a[href="/terms"]')).not.toBeNull();
  });
});

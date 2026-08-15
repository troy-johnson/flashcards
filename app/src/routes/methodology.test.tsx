/** @vitest-environment jsdom */
import React from "react";
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import App from "../App";

vi.mock("../api/literacy", () => ({
  getCurrentGuardian: vi.fn(async () => ({ guardian: null })),
  listStudents: vi.fn(async () => ({ students: [] }))
}));

describe("public methodology route", () => {
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

  it("gives an SLP a cited, reviewable account of the instructional and audio approach", async () => {
    window.history.pushState({}, "", "/methodology");
    await act(async () => root.render(<App />));

    expect(container.querySelector("h1")?.textContent).toBe("Methodology and SLP review");
    expect(container.textContent).toContain("adult-supported");
    expect(container.textContent).toContain("phonemic awareness");
    expect(container.textContent).toContain("systematic phonics and decoding");
    expect(container.textContent).toContain("heart words");
    expect(container.textContent).toContain("fluency");
    expect(container.textContent).toContain("Evidence-backed principles");
    expect(container.textContent).toContain("Reader's Way implementation choices");

    expect(container.textContent).toContain("44 instructional sound targets");
    expect(container.textContent).toContain("12 grapheme-pattern mappings");
    expect(container.textContent).toContain("dialect difference is not a disorder");
    expect(container.textContent).toContain("checksum-bound");
    expect(container.textContent).toContain("whole words and sentences");
    expect(container.textContent).toContain("does not automatically score a child's speech");
    expect(container.textContent).toContain("not diagnosis or speech therapy");

    const reviewItems = container.querySelectorAll(".methodology-review-list li");
    expect(reviewItems.length).toBeGreaterThanOrEqual(5);

    const expectedSources = [
      "https://ies.ed.gov/ncee/wwc/Docs/PracticeGuide/wwc_foundationalreading_040717.pdf",
      "https://www.nichd.nih.gov/sites/default/files/publications/pubs/nrp/Documents/report.pdf",
      "https://ufli.education.ufl.edu/foundations/",
      "https://ufli.education.ufl.edu/wp-content/uploads/2023/09/UFLI-Sound-Wall-rev.pdf",
      "https://ufli.education.ufl.edu/resources/teaching-resources/instructional-activities/phonemic-awareness/",
      "https://www.asha.org/practice-portal/clinical-topics/written-language-disorders/",
      "https://www.asha.org/practice-portal/clinical-topics/articulation-and-phonology/",
      "https://webaudio.github.io/web-speech-api/"
    ];
    for (const href of expectedSources) {
      expect(container.querySelector(`a[href="${href}"]`)).not.toBeNull();
    }
    expect(container.querySelector(".guardian-header")).toBeNull();
  });

  it("is linked from the landing-page footer", async () => {
    window.history.pushState({}, "", "/");
    await act(async () => root.render(<App />));

    expect(container.querySelector('footer a[href="/methodology"]')?.textContent).toBe("Methodology");
  });
});

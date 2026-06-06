import { describe, expect, it } from "vitest";
import { productName, landing } from "copy";

describe("copy package", () => {
  it("exposes the product name as the single source of truth", () => {
    expect(productName).toBe("Reader's Way");
  });

  it("uses the product name in the landing eyebrow", () => {
    expect(landing.eyebrow).toBe(productName);
  });
});

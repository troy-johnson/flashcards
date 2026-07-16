import { describe, expect, it } from "vitest";
import { productName, landing, support } from "copy";

describe("copy package", () => {
  it("exposes the product name as the single source of truth", () => {
    expect(productName).toBe("Reader's Way");
  });

  it("uses the product name in the landing eyebrow", () => {
    expect(landing.eyebrow).toBe(productName);
  });

  it("centralizes the complete invited-pilot landing narrative and support contact", () => {
    expect(landing.audience).toContain("kindergarten and 1st-grade");
    expect(landing.practice).toContain("adult");
    expect(landing.instruction).toContain("Evidence-informed");
    expect(landing.instruction).toContain("phonics");
    expect(landing.instruction).toContain("heart words");
    expect(landing.instruction).toContain("fluency");
    expect(landing.privacy).toContain("no ads");
    expect(landing.privacy).toContain("never sell");
    expect(landing.pilot).toContain("early-access pilot");
    expect(support.email).toBe("support@troyjohnson.dev");
  });
});

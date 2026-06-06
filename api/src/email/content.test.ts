import { describe, expect, it } from "vitest";
import { buildMagicLinkEmail } from "./content";

describe("buildMagicLinkEmail", () => {
  const email = buildMagicLinkEmail("https://app.test/auth/consume?token=abc");

  it("brands the subject with the product name (FR20)", () => {
    expect(email.subject).toBe("Sign in to Reader's Way");
  });

  it("includes purpose, the sign-in link, expiry, and ignore language (FR21)", () => {
    expect(email.text).toContain("Reader's Way");
    expect(email.text).toContain("https://app.test/auth/consume?token=abc");
    expect(email.text.toLowerCase()).toContain("expires");
    expect(email.text.toLowerCase()).toContain("ignore");
  });
});

import { describe, expect, it } from "vitest";
import { canUseOperatorTools, guardianCapabilities } from "./operator-policy";

const guardian = { email: "operator@example.com" };

describe("operator policy", () => {
  it.each([
    ["absent", {}],
    ["null", { DIAG_GUARDIAN_EMAIL: null }],
    ["empty", { DIAG_GUARDIAN_EMAIL: "" }],
    ["whitespace-only", { DIAG_GUARDIAN_EMAIL: " \t\n " }]
  ])("fails closed when the configured operator email is %s", (_label, policyEnv) => {
    expect(guardianCapabilities(policyEnv, guardian)).toEqual({ operator_tools: false });
    expect(canUseOperatorTools(policyEnv, guardian)).toBe(false);
  });

  it("allows an exact match with the normalized guardian email", () => {
    const policyEnv = { DIAG_GUARDIAN_EMAIL: "operator@example.com" };

    expect(guardianCapabilities(policyEnv, guardian)).toEqual({ operator_tools: true });
    expect(canUseOperatorTools(policyEnv, guardian)).toBe(true);
  });

  it.each([
    ["different email", "other@example.com"],
    ["different case", "Operator@example.com"],
    ["leading whitespace", " operator@example.com"],
    ["trailing whitespace", "operator@example.com "]
  ])("denies a %s instead of normalizing the configured value", (_label, configuredEmail) => {
    const policyEnv = { DIAG_GUARDIAN_EMAIL: configuredEmail };

    expect(guardianCapabilities(policyEnv, guardian)).toEqual({ operator_tools: false });
    expect(canUseOperatorTools(policyEnv, guardian)).toBe(false);
  });
});

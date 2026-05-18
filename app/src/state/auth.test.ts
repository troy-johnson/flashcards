import { beforeEach, describe, expect, it, vi } from "vitest";
import { authState, loadAuthState, resetAuthState } from "./auth";

vi.mock("../api/literacy", () => ({
  getCurrentGuardian: vi.fn(async () => ({ guardian: { id: "g1", email: "guardian@example.com", display_name: null } }))
}));

describe("auth state", () => {
  beforeEach(() => resetAuthState());

  it("loads the current guardian into a simple app state store", async () => {
    await loadAuthState();

    expect(authState.status).toBe("authenticated");
    expect(authState.guardian?.email).toBe("guardian@example.com");
  });
});

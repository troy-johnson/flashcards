import { beforeEach, describe, expect, it, vi } from "vitest";
import { ApiError } from "../api/client";
import { getCurrentGuardian } from "../api/literacy";
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
    expect(authState.error).toBeNull();
  });

  it("treats a 401 as anonymous without recording an error", async () => {
    (getCurrentGuardian as unknown as ReturnType<typeof vi.fn>).mockRejectedValueOnce(new ApiError(401, "unauthorized"));
    await loadAuthState();
    expect(authState.status).toBe("anonymous");
    expect(authState.error).toBeNull();
  });

  it("surfaces non-401 failures so backend errors are not masked", async () => {
    (getCurrentGuardian as unknown as ReturnType<typeof vi.fn>).mockRejectedValueOnce(new ApiError(503, "service unavailable"));
    await loadAuthState();
    expect(authState.status).toBe("error");
    expect(authState.error).toContain("503");
  });
});

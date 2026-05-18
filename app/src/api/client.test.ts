import { beforeEach, describe, expect, it, vi } from "vitest";
import { apiFetch } from "./client";
import { signIn, getCurrentGuardian, createStudent, startPractice, scoreAttempt } from "./literacy";

describe("app API client", () => {
  beforeEach(() => {
    vi.stubGlobal("fetch", vi.fn(async () => new Response(JSON.stringify({ ok: true }), { status: 200 })));
  });

  it("sends API requests to VITE_API_ORIGIN with cookie credentials", async () => {
    await apiFetch<{ ok: boolean }>("/auth/me");

    expect(fetch).toHaveBeenCalledWith("http://localhost:8787/auth/me", expect.objectContaining({
      credentials: "include",
      headers: expect.objectContaining({ "content-type": "application/json" })
    }));
  });

  it("exposes typed guardian, student, practice, and attempt calls", async () => {
    await signIn("Guardian@Example.com");
    await getCurrentGuardian();
    await createStudent({ display_name: "Ada", grade: "K" });
    await startPractice("student1");
    await scoreAttempt("student1", {
      practice_session_id: "session1",
      skill_id: "phonics_k_u1_short_a",
      item_id: "phonics_k_u1_short_a_cat",
      result: "correct",
      duration_ms: 1200,
      shown_at: "2026-05-18T00:00:00.000Z"
    });

    expect(fetch).toHaveBeenCalledWith("http://localhost:8787/auth/start", expect.objectContaining({ method: "POST" }));
    expect(fetch).toHaveBeenCalledWith("http://localhost:8787/students", expect.objectContaining({ method: "POST" }));
    expect(fetch).toHaveBeenCalledWith("http://localhost:8787/practice/student1/start", expect.objectContaining({ method: "POST" }));
    expect(fetch).toHaveBeenCalledWith("http://localhost:8787/practice/student1/attempt", expect.objectContaining({ method: "POST" }));
  });
});

import { beforeEach, describe, expect, it, vi } from "vitest";
import { env, SELF } from "cloudflare:test";
import { resetFoundationDb } from "../test/reset-db";

const resetDb = async () => {
  await resetFoundationDb();
};

const extractToken = (logs: string[]): string => {
  const entry = logs.find((line) => line.startsWith("[magic-link] "));
  if (!entry) throw new Error("no magic link logged");
  const match = entry.match(/https?:\/\/\S*\/auth\/consume\?token=\S+/);
  if (!match) throw new Error("no magic link url logged");
  return new URL(match[0]).searchParams.get("token")!;
};

describe("auth routes", () => {
  beforeEach(resetDb);

  it("issues a magic link and consumes it exactly once", async () => {
    const logs: string[] = [];
    const spy = vi.spyOn(console, "log").mockImplementation((...args) => {
      logs.push(args.join(" "));
    });
    try {
      const start = await SELF.fetch("https://api.test/auth/start", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ email: "Guardian@Example.com" })
      });
      expect(start.status).toBe(200);
      const startBody = await start.json<{ devMagicLink: string }>();
      expect(startBody.devMagicLink).toMatch(/\/auth\/consume\?token=/);
      const token = extractToken(logs);
      expect(new URL(startBody.devMagicLink).searchParams.get("token")).toBe(token);

      const consume = await SELF.fetch(`https://api.test/auth/consume?token=${token}`);
      expect(consume.status).toBe(204);
      const cookie = consume.headers.get("set-cookie")!;
      expect(cookie).toContain("HttpOnly");
      expect(cookie).toContain("Secure");
      expect(cookie).toContain("SameSite=Lax");
      expect(cookie).toMatch(/Max-Age=\d+/);

      const replay = await SELF.fetch(`https://api.test/auth/consume?token=${token}`);
      expect(replay.status).toBe(401);
    } finally {
      spy.mockRestore();
    }
  });

  it("rejects an expired token", async () => {
    await env.DB.prepare("INSERT INTO guardian (id, email, role, created_at) VALUES (?, ?, 'guardian', ?)")
      .bind("g_expired", "expired@example.com", new Date().toISOString()).run();
    const longAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
    const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode("expired"));
    const hash = Array.from(new Uint8Array(digest)).map((b) => b.toString(16).padStart(2, "0")).join("");
    await env.DB.prepare("INSERT INTO auth_token (token_hash, guardian_id, expires_at) VALUES (?, ?, ?)")
      .bind(hash, "g_expired", longAgo).run();
    const consume = await SELF.fetch("https://api.test/auth/consume?token=expired");
    expect(consume.status).toBe(401);
  });

  it("/auth/me returns 401 without a valid session and the guardian otherwise", async () => {
    const unauth = await SELF.fetch("https://api.test/auth/me");
    expect(unauth.status).toBe(401);

    await env.DB.prepare("INSERT INTO guardian (id, email, role, created_at) VALUES (?, ?, 'guardian', ?)")
      .bind("g_me", "me@example.com", new Date().toISOString()).run();
    const future = new Date(Date.now() + 60_000).toISOString();
    await env.DB.prepare("INSERT INTO session (id, guardian_id, expires_at, created_at) VALUES (?, ?, ?, ?)")
      .bind("sess_me", "g_me", future, new Date().toISOString()).run();
    const me = await SELF.fetch("https://api.test/auth/me", { headers: { cookie: "session=sess_me" } });
    expect(me.status).toBe(200);
    const body = await me.json<{ guardian: { email: string } }>();
    expect(body.guardian.email).toBe("me@example.com");
  });

  it("/auth/logout clears the cookie and removes the session row", async () => {
    await env.DB.prepare("INSERT INTO guardian (id, email, role, created_at) VALUES (?, ?, 'guardian', ?)")
      .bind("g_out", "out@example.com", new Date().toISOString()).run();
    const future = new Date(Date.now() + 60_000).toISOString();
    await env.DB.prepare("INSERT INTO session (id, guardian_id, expires_at, created_at) VALUES (?, ?, ?, ?)")
      .bind("sess_out", "g_out", future, new Date().toISOString()).run();
    const logout = await SELF.fetch("https://api.test/auth/logout", {
      method: "POST",
      headers: { cookie: "session=sess_out" }
    });
    expect(logout.status).toBe(204);
    expect(logout.headers.get("set-cookie")!).toContain("Max-Age=0");
    const row = await env.DB.prepare("SELECT id FROM session WHERE id = ?").bind("sess_out").first();
    expect(row).toBeNull();
  });
});

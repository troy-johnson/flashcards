import { beforeEach, describe, expect, it, vi } from "vitest";
import { env, SELF } from "cloudflare:test";
import { resetFoundationDb } from "../test/reset-db";
import { authRoutes } from "./auth";
import type { Env } from "../types";

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

  it("fails closed before creating data for an email outside the pilot allowlist", async () => {
    const bindings = {
      ...env,
      AUTH_ACCESS_MODE: "allowlist",
      GUARDIAN_EMAIL_ALLOWLIST: "owner@example.com"
    } as Env;

    const start = await authRoutes.request("https://api.test/start", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ email: "outside@example.com" })
    }, bindings);

    expect(start.status).toBe(204);
    expect(await env.DB.prepare("SELECT id FROM guardian WHERE email = ?")
      .bind("outside@example.com").first()).toBeNull();
    expect(await env.DB.prepare("SELECT token_hash FROM auth_token").first()).toBeNull();
  });

  it("fails closed in allowlist mode when the allowlist secret is absent", async () => {
    const bindings = {
      ...env,
      AUTH_ACCESS_MODE: "allowlist"
    } as Env;

    const start = await authRoutes.request("https://api.test/start", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ email: "owner@example.com" })
    }, bindings);

    expect(start.status).toBe(204);
    expect(await env.DB.prepare("SELECT id FROM guardian WHERE email = ?")
      .bind("owner@example.com").first()).toBeNull();
  });

  it("issues a token without echoing it for a normalized email in the pilot allowlist", async () => {
    const bindings = {
      ...env,
      AUTH_ACCESS_MODE: "allowlist",
      GUARDIAN_EMAIL_ALLOWLIST: "first@example.com, Owner@Example.com\nthird@example.com"
    } as Env;
    const spy = vi.spyOn(console, "log").mockImplementation(() => {});

    try {
      const start = await authRoutes.request("https://api.test/start", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ email: "Owner@Example.com" })
      }, bindings);

      expect(start.status).toBe(204);
      expect(await start.text()).toBe("");
      const guardian = await env.DB.prepare("SELECT id, email FROM guardian WHERE email = ?")
        .bind("owner@example.com").first<{ id: string; email: string }>();
      expect(guardian?.email).toBe("owner@example.com");
      expect(await env.DB.prepare("SELECT token_hash FROM auth_token WHERE guardian_id = ?")
        .bind(guardian!.id).first()).not.toBeNull();
    } finally {
      spy.mockRestore();
    }
  });

  it.each([undefined, "allow-list"])(
    "fails closed when AUTH_ACCESS_MODE is %s",
    async (accessMode) => {
      const bindings = {
        ...env,
        AUTH_ACCESS_MODE: accessMode,
        GUARDIAN_EMAIL_ALLOWLIST: "owner@example.com"
      } as unknown as Env;

      const start = await authRoutes.request("https://api.test/start", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ email: "owner@example.com" })
      }, bindings);

      expect(start.status).toBe(204);
      expect(await env.DB.prepare("SELECT id FROM guardian WHERE email = ?")
        .bind("owner@example.com").first()).toBeNull();
    }
  );

  it("fails closed in public Resend mode when the IP limiter is not configured", async () => {
    const bindings = {
      ...env,
      AUTH_ACCESS_MODE: "open",
      AUTH_EMAIL_ISSUER: "resend"
    } as Env;

    const start = await authRoutes.request("https://api.test/start", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "cf-connecting-ip": "203.0.113.10"
      },
      body: JSON.stringify({ email: "public@example.com" })
    }, bindings);

    expect(start.status).toBe(204);
    expect(await env.DB.prepare("SELECT id FROM guardian WHERE email = ?")
      .bind("public@example.com").first()).toBeNull();
  });

  it("fails closed in public Resend mode without Cloudflare's source IP header", async () => {
    const limit = vi.fn(async () => ({ success: true }));
    const bindings = {
      ...env,
      AUTH_ACCESS_MODE: "open",
      AUTH_EMAIL_ISSUER: "resend",
      AUTH_RATE_LIMITER: { limit }
    } as unknown as Env;

    const start = await authRoutes.request("https://api.test/start", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ email: "missing-ip@example.com" })
    }, bindings);

    expect(start.status).toBe(204);
    expect(limit).not.toHaveBeenCalled();
    expect(await env.DB.prepare("SELECT id FROM guardian WHERE email = ?")
      .bind("missing-ip@example.com").first()).toBeNull();
  });

  it("stops a rate-limited public IP before creating guardian or token data", async () => {
    const limit = vi.fn(async (_input: { key: string }) => ({ success: false }));
    const bindings = {
      ...env,
      AUTH_ACCESS_MODE: "open",
      AUTH_EMAIL_ISSUER: "resend",
      AUTH_RATE_LIMITER: { limit }
    } as unknown as Env;

    const start = await authRoutes.request("https://api.test/start", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "cf-connecting-ip": "203.0.113.11"
      },
      body: JSON.stringify({ email: "limited-ip@example.com" })
    }, bindings);

    expect(start.status).toBe(204);
    expect(limit).toHaveBeenCalledTimes(1);
    const key = limit.mock.calls[0]?.[0]?.key;
    expect(key).toMatch(/^[a-f0-9]{64}$/);
    expect(key).not.toContain("203.0.113.11");
    expect(await env.DB.prepare("SELECT id FROM guardian WHERE email = ?")
      .bind("limited-ip@example.com").first()).toBeNull();
    expect(await env.DB.prepare("SELECT token_hash FROM auth_token").first()).toBeNull();
  });

  it("does not enumerate an allowed address when email delivery fails", async () => {
    const bindings = {
      ...env,
      AUTH_ACCESS_MODE: "allowlist",
      GUARDIAN_EMAIL_ALLOWLIST: "owner@example.com",
      AUTH_EMAIL_ISSUER: "resend"
    } as Env;
    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    try {
      for (let request = 0; request < 4; request += 1) {
        const start = await authRoutes.request("https://api.test/start", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ email: "owner@example.com" })
        }, bindings);
        expect(start.status).toBe(204);
        expect(await start.text()).toBe("");
      }

      const failedAttempts = await env.DB.prepare("SELECT token_hash, consumed_at FROM auth_token")
        .all<{ token_hash: string; consumed_at: string | null }>();
      expect(failedAttempts.results).toHaveLength(3);
      expect(failedAttempts.results.every((attempt) => attempt.consumed_at !== null)).toBe(true);
      expect(errorSpy).toHaveBeenCalledTimes(3);
    } finally {
      errorSpy.mockRestore();
    }
  });

  it("rate-limits repeated magic-link requests without creating another token", async () => {
    const logs: string[] = [];
    const spy = vi.spyOn(console, "log").mockImplementation((...args) => {
      logs.push(args.join(" "));
    });

    try {
      const responses: Response[] = await Promise.all(Array.from({ length: 4 }, () =>
        SELF.fetch("https://api.test/auth/start", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ email: "Repeated@Example.com" })
        })
      ));

      expect(responses.map((response) => response.status).sort()).toEqual([200, 200, 200, 204]);
      expect(await responses.find((response) => response.status === 204)!.text()).toBe("");
      expect(logs.filter((line) => line.startsWith("[magic-link] "))).toHaveLength(3);
      const guardian = await env.DB.prepare("SELECT id FROM guardian WHERE email = ?")
        .bind("repeated@example.com").first<{ id: string }>();
      const tokenCount = await env.DB.prepare("SELECT COUNT(*) AS count FROM auth_token WHERE guardian_id = ?")
        .bind(guardian!.id).first<{ count: number }>();
      expect(tokenCount?.count).toBe(3);
    } finally {
      spy.mockRestore();
    }
  });

  it("allows another request after the prior attempts expire", async () => {
    await env.DB.prepare("INSERT INTO guardian (id, email, role, created_at) VALUES (?, ?, 'guardian', ?)")
      .bind("g_rate_expired", "rate-expired@example.com", new Date().toISOString()).run();
    const expiredAt = new Date(Date.now() - 1).toISOString();
    for (let attempt = 0; attempt < 3; attempt += 1) {
      await env.DB.prepare("INSERT INTO auth_token (token_hash, guardian_id, expires_at) VALUES (?, ?, ?)")
        .bind(`expired_rate_${attempt}`, "g_rate_expired", expiredAt).run();
    }
    const spy = vi.spyOn(console, "log").mockImplementation(() => {});

    try {
      const start = await SELF.fetch("https://api.test/auth/start", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ email: "rate-expired@example.com" })
      });

      expect(start.status).toBe(200);
      const activeAttempts = await env.DB.prepare(
        "SELECT COUNT(*) AS count FROM auth_token WHERE guardian_id = ? AND expires_at > ?"
      ).bind("g_rate_expired", new Date().toISOString()).first<{ count: number }>();
      expect(activeAttempts?.count).toBe(1);
    } finally {
      spy.mockRestore();
    }
  });

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

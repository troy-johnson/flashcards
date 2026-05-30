import { Hono } from "hono";
import { z } from "zod";
import { ulid } from "ulid";
import { json } from "../db/client";
import { clearSessionCookie, createSession, deleteSession, getAuthenticatedGuardian, parseSessionCookie, setSessionCookie } from "../db/session";
import { issueMagicLink } from "../email/magic-link";
import type { Env } from "../types";

const startSchema = z.object({ email: z.string().email() });
const tokenTtlMs = 15 * 60 * 1000;

const randomToken = (): string => {
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  return Array.from(bytes).map((b) => b.toString(16).padStart(2, "0")).join("");
};

const sha256Hex = async (value: string): Promise<string> => {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value));
  return Array.from(new Uint8Array(digest)).map((b) => b.toString(16).padStart(2, "0")).join("");
};

export const authRoutes = new Hono<{ Bindings: Env }>();

authRoutes.post("/start", async (c) => {
  const parsed = startSchema.safeParse(await c.req.json().catch(() => null));
  if (!parsed.success) return c.text("invalid email", 400);
  const email = parsed.data.email.trim().toLowerCase();
  const now = new Date().toISOString();
  let guardian = await c.env.DB.prepare("SELECT id, email FROM guardian WHERE email = ?").bind(email).first<{ id: string; email: string }>();
  if (!guardian) {
    const id = ulid();
    await c.env.DB.prepare("INSERT INTO guardian (id, email, role, created_at) VALUES (?, ?, 'guardian', ?)").bind(id, email, now).run();
    guardian = { id, email };
  }
  const token = randomToken();
  const hash = await sha256Hex(token);
  const expiresAt = new Date(Date.now() + tokenTtlMs).toISOString();
  await c.env.DB.prepare("INSERT INTO auth_token (token_hash, guardian_id, expires_at) VALUES (?, ?, ?)").bind(hash, guardian.id, expiresAt).run();
  const issued = await issueMagicLink(c.env, email, token);
  if (issued.echoable) return json({ devMagicLink: issued.url });
  return c.body(null, 204);
});

authRoutes.get("/consume", async (c) => {
  const token = c.req.query("token");
  if (!token) return c.text("invalid token", 401);
  const hash = await sha256Hex(token);
  const row = await c.env.DB.prepare(
    "SELECT guardian_id FROM auth_token WHERE token_hash = ? AND consumed_at IS NULL AND expires_at > ?"
  ).bind(hash, new Date().toISOString()).first<{ guardian_id: string }>();
  if (!row) return c.text("invalid token", 401);
  await c.env.DB.prepare("UPDATE auth_token SET consumed_at = ? WHERE token_hash = ? AND consumed_at IS NULL")
    .bind(new Date().toISOString(), hash).run();
  const sessionId = await createSession(c.env, row.guardian_id);
  c.header("Set-Cookie", setSessionCookie(sessionId));
  return c.body(null, 204);
});

authRoutes.get("/me", async (c) => {
  const guardian = await getAuthenticatedGuardian(c);
  if (!guardian) return c.text("unauthorized", 401);
  return json({ guardian });
});

authRoutes.post("/logout", async (c) => {
  const sessionId = parseSessionCookie(c.req.header("cookie") ?? null);
  if (sessionId) await deleteSession(c.env, sessionId);
  c.header("Set-Cookie", clearSessionCookie());
  return c.body(null, 204);
});

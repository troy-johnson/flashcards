import { ulid } from "ulid";
import type { AuthenticatedGuardian, Env } from "../types";

export const SESSION_COOKIE = "session";
const SESSION_TTL_MS = 30 * 24 * 60 * 60 * 1000;

export const setSessionCookie = (sessionId: string): string =>
  `${SESSION_COOKIE}=${sessionId}; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=${SESSION_TTL_MS / 1000}`;

export const clearSessionCookie = (): string =>
  `${SESSION_COOKIE}=; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=0`;

export const parseSessionCookie = (header: string | null): string | null => {
  if (!header) return null;
  const match = header.split(/;\s*/).find((part) => part.startsWith(`${SESSION_COOKIE}=`));
  return match ? match.slice(SESSION_COOKIE.length + 1) || null : null;
};

export const createSession = async (env: Env, guardianId: string): Promise<string> => {
  const id = ulid();
  const now = new Date().toISOString();
  const expiresAt = new Date(Date.now() + SESSION_TTL_MS).toISOString();
  await env.DB.prepare("INSERT INTO session (id, guardian_id, expires_at, created_at) VALUES (?, ?, ?, ?)")
    .bind(id, guardianId, expiresAt, now).run();
  return id;
};

export const loadGuardianBySession = async (env: Env, sessionId: string): Promise<AuthenticatedGuardian | null> => {
  const row = await env.DB.prepare(
    `SELECT g.id, g.email, g.display_name FROM session s
       JOIN guardian g ON g.id = s.guardian_id
      WHERE s.id = ? AND s.expires_at > ?`
  ).bind(sessionId, new Date().toISOString()).first<AuthenticatedGuardian>();
  return row ?? null;
};

export const deleteSession = async (env: Env, sessionId: string): Promise<void> => {
  await env.DB.prepare("DELETE FROM session WHERE id = ?").bind(sessionId).run();
};

type AuthContext = {
  env: Env;
  req: { header: (name: string) => string | undefined };
};

export const getAuthenticatedGuardian = async (c: AuthContext): Promise<AuthenticatedGuardian | null> => {
  const sessionId = parseSessionCookie(c.req.header("cookie") ?? null);
  if (!sessionId) return null;
  return loadGuardianBySession(c.env, sessionId);
};

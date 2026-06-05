import { Hono } from "hono";
import { json } from "../db/client";
import { getAuthenticatedGuardian } from "../db/session";
import type { Env } from "../types";

export const diagRoutes = new Hono<{ Bindings: Env }>();

diagRoutes.get("/", async (c) => {
  const guardian = await getAuthenticatedGuardian(c);
  if (!guardian) return c.text("unauthorized", 401);
  if (guardian.email !== c.env.DIAG_GUARDIAN_EMAIL) return c.text("forbidden", 403);
  const { results: summary } = await c.env.DB.prepare(
    `SELECT a.student_id, a.skill_id, a.item_id, a.result, COUNT(*) AS attempts
       FROM attempt a
       JOIN student s ON s.id = a.student_id
      WHERE s.guardian_id = ?
      GROUP BY a.student_id, a.skill_id, a.item_id, a.result
      ORDER BY a.student_id, a.skill_id, a.item_id, a.result`
  ).bind(guardian.id).all<{ student_id: string; skill_id: string; item_id: string; result: string; attempts: number }>();

  const { results: sessions } = await c.env.DB.prepare(
    `SELECT p.student_id,
            COUNT(*) AS started,
            SUM(CASE WHEN p.completed_at IS NOT NULL THEN 1 ELSE 0 END) AS completed,
            AVG(CASE WHEN p.completed_at IS NOT NULL
                     THEN (julianday(p.completed_at) - julianday(p.started_at)) * 86400000
                     END) AS avg_duration_ms
       FROM practice_session p
       JOIN student s ON s.id = p.student_id
      WHERE s.guardian_id = ?
      GROUP BY p.student_id
      ORDER BY p.student_id`
  ).bind(guardian.id).all<{ student_id: string; started: number; completed: number; avg_duration_ms: number | null }>();

  const { results: friction } = await c.env.DB.prepare(
    `SELECT a.student_id, a.skill_id, a.item_id, COUNT(*) AS misses
       FROM attempt a
       JOIN student s ON s.id = a.student_id
      WHERE s.guardian_id = ? AND a.result IN ('incorrect', 'skipped')
      GROUP BY a.student_id, a.skill_id, a.item_id
      ORDER BY misses DESC, a.student_id, a.skill_id, a.item_id
      LIMIT 10`
  ).bind(guardian.id).all<{ student_id: string; skill_id: string; item_id: string; misses: number }>();

  return json({ guardian: { id: guardian.id, email: guardian.email }, summary, sessions, friction });
});

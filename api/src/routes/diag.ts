import { Hono } from "hono";
import { json } from "../db/client";
import { getAuthenticatedGuardian } from "../db/session";
import { canUseOperatorTools } from "../auth/operator-policy";
import type { Env } from "../types";

export const diagRoutes = new Hono<{ Bindings: Env }>();

diagRoutes.get("/", async (c) => {
  const guardian = await getAuthenticatedGuardian(c);
  if (!guardian) return c.text("unauthorized", 401);
  if (!canUseOperatorTools(c.env, guardian)) return c.text("forbidden", 403);
  const [
    { results: summary },
    { results: sessions },
    { results: friction },
    { results: exitMarkerHouseholds },
    { results: exitMarkerStudents }
  ] = await Promise.all([
    c.env.DB.prepare(
      `SELECT a.student_id, a.skill_id, a.item_id, a.result, COUNT(*) AS attempts
         FROM attempt a
         JOIN student s ON s.id = a.student_id
        WHERE s.guardian_id = ?
        GROUP BY a.student_id, a.skill_id, a.item_id, a.result
        ORDER BY a.student_id, a.skill_id, a.item_id, a.result`
    ).bind(guardian.id).all<{ student_id: string; skill_id: string; item_id: string; result: string; attempts: number }>(),
    c.env.DB.prepare(
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
    ).bind(guardian.id).all<{ student_id: string; started: number; completed: number; avg_duration_ms: number | null }>(),
    c.env.DB.prepare(
      `SELECT a.student_id, a.skill_id, a.item_id, COUNT(*) AS misses
         FROM attempt a
         JOIN student s ON s.id = a.student_id
        WHERE s.guardian_id = ? AND a.result IN ('incorrect', 'skipped')
        GROUP BY a.student_id, a.skill_id, a.item_id
        ORDER BY misses DESC, a.student_id, a.skill_id, a.item_id
        LIMIT 10`
    ).bind(guardian.id).all<{ student_id: string; skill_id: string; item_id: string; misses: number }>(),
    c.env.DB.prepare(
      `SELECT g.id AS guardian_id,
              g.email AS guardian_email,
              COUNT(*) AS completed_sessions,
              MIN(p.completed_at) AS first_completed_at,
              MAX(p.completed_at) AS last_completed_at
         FROM practice_session p
         JOIN student s ON s.id = p.student_id
         JOIN guardian g ON g.id = s.guardian_id
        WHERE p.completed_at IS NOT NULL
        GROUP BY g.id, g.email
        ORDER BY g.id`
    ).all<{
      guardian_id: string;
      guardian_email: string;
      completed_sessions: number;
      first_completed_at: string;
      last_completed_at: string;
    }>(),
    c.env.DB.prepare(
      `SELECT s.guardian_id,
              g.email AS guardian_email,
              s.id AS student_id,
              s.display_name AS student_name,
              COUNT(*) AS completed_sessions,
              MIN(p.completed_at) AS first_completed_at,
              MAX(p.completed_at) AS last_completed_at
         FROM practice_session p
         JOIN student s ON s.id = p.student_id
         JOIN guardian g ON g.id = s.guardian_id
        WHERE p.completed_at IS NOT NULL
        GROUP BY s.guardian_id, g.email, s.id, s.display_name
        ORDER BY s.guardian_id, s.id`
    ).all<{
      guardian_id: string;
      guardian_email: string;
      student_id: string;
      student_name: string;
      completed_sessions: number;
      first_completed_at: string;
      last_completed_at: string;
    }>()
  ]);

  return json({
    guardian: { id: guardian.id, email: guardian.email },
    summary,
    sessions,
    friction,
    exit_markers: {
      households: exitMarkerHouseholds,
      students: exitMarkerStudents
    }
  });
});

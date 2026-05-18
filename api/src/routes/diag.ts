import { Hono } from "hono";
import { json } from "../db/client";
import { getAuthenticatedGuardian } from "../db/session";
import type { Env } from "../types";

export const diagRoutes = new Hono<{ Bindings: Env }>();

diagRoutes.get("/", async (c) => {
  const guardian = await getAuthenticatedGuardian(c);
  if (!guardian) return c.text("unauthorized", 401);
  if (guardian.email !== c.env.DIAG_GUARDIAN_EMAIL) return c.text("forbidden", 403);
  const { results } = await c.env.DB.prepare(
    `SELECT a.student_id, a.skill_id, a.item_id, a.result, COUNT(*) AS attempts
       FROM attempt a
       JOIN student s ON s.id = a.student_id
      WHERE s.guardian_id = ?
      GROUP BY a.student_id, a.skill_id, a.item_id, a.result
      ORDER BY a.student_id, a.skill_id, a.item_id, a.result`
  ).bind(guardian.id).all<{ student_id: string; skill_id: string; item_id: string; result: string; attempts: number }>();
  return json({ guardian: { id: guardian.id, email: guardian.email }, summary: results });
});

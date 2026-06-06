import { Hono } from "hono";
import { z } from "zod";
import { ulid } from "ulid";
import seedItems from "../../../content/items/seed.json";
import { json } from "../db/client";
import { getAuthenticatedGuardian } from "../db/session";
import type { AuthenticatedGuardian, Env } from "../types";

type SeedItem = { item_id: string; skill_id: string; text?: string; prompt?: string; answer?: string };
const seedCards = (seedItems as SeedItem[]).filter((item) => item.skill_id === "phonics_k_u1_short_a");

const attemptSchema = z.object({
  practice_session_id: z.string().min(1),
  skill_id: z.string().min(1),
  item_id: z.string().min(1),
  result: z.enum(["correct", "incorrect", "skipped"]),
  scoring_source: z.literal("guardian_tap").optional(),
  duration_ms: z.number().int().nonnegative(),
  shown_at: z.string().min(1)
});

export const practiceRoutes = new Hono<{ Bindings: Env; Variables: { guardian: AuthenticatedGuardian } }>();

practiceRoutes.use("*", async (c, next) => {
  const guardian = await getAuthenticatedGuardian(c);
  if (!guardian) return c.text("unauthorized", 401);
  c.set("guardian", guardian);
  await next();
});

const ownsStudent = async (env: Env, guardianId: string, studentId: string): Promise<boolean> => {
  const row = await env.DB.prepare("SELECT id FROM student WHERE id = ? AND guardian_id = ? AND archived_at IS NULL")
    .bind(studentId, guardianId).first<{ id: string }>();
  return !!row;
};

practiceRoutes.post("/:studentId/start", async (c) => {
  const guardian = c.get("guardian");
  const studentId = c.req.param("studentId");
  if (!(await ownsStudent(c.env, guardian.id, studentId))) return c.text("not found", 404);
  const id = ulid();
  const plan = {
    cards: seedCards.map((item) => ({ item_id: item.item_id, skill_id: item.skill_id, text: item.text ?? item.prompt ?? item.item_id }))
  };
  await c.env.DB.prepare("INSERT INTO practice_session (id, student_id, plan_json, started_at) VALUES (?, ?, ?, ?)")
    .bind(id, studentId, JSON.stringify(plan), new Date().toISOString()).run();
  return json({ practice_session: { id, student_id: studentId, plan } }, { status: 201 });
});

practiceRoutes.post("/:studentId/complete", async (c) => {
  const guardian = c.get("guardian");
  const studentId = c.req.param("studentId");
  if (!(await ownsStudent(c.env, guardian.id, studentId))) return c.text("not found", 404);
  const body = await c.req.json().catch(() => null);
  const sessionId = body?.practice_session_id;
  if (typeof sessionId !== "string" || sessionId.length === 0) return c.text("invalid", 400);
  const row = await c.env.DB.prepare("SELECT id, completed_at FROM practice_session WHERE id = ? AND student_id = ?")
    .bind(sessionId, studentId).first<{ id: string; completed_at: string | null }>();
  if (!row) return c.text("practice session not found", 404);
  if (!row.completed_at) {
    // Conditional write so a concurrent completion cannot overwrite the first
    // timestamp; only the call that finds completed_at still NULL lands.
    await c.env.DB.prepare("UPDATE practice_session SET completed_at = ? WHERE id = ? AND completed_at IS NULL")
      .bind(new Date().toISOString(), sessionId).run();
  }
  // Re-read so every caller returns the persisted (authoritative) value, even
  // if another request won the race.
  const persisted = await c.env.DB.prepare("SELECT completed_at FROM practice_session WHERE id = ?")
    .bind(sessionId).first<{ completed_at: string | null }>();
  return json({ practice_session: { id: sessionId, completed_at: persisted?.completed_at ?? null } });
});

practiceRoutes.post("/:studentId/attempt", async (c) => {
  const guardian = c.get("guardian");
  const studentId = c.req.param("studentId");
  if (!(await ownsStudent(c.env, guardian.id, studentId))) return c.text("not found", 404);
  const body = await c.req.json().catch(() => null);
  if (body?.scoring_source && body.scoring_source !== "guardian_tap") return c.text("invalid scoring source", 400);
  const parsed = attemptSchema.safeParse(body);
  if (!parsed.success) return c.text("invalid attempt", 400);
  const session = await c.env.DB.prepare("SELECT id, plan_json, completed_at FROM practice_session WHERE id = ? AND student_id = ?")
    .bind(parsed.data.practice_session_id, studentId).first<{ id: string; plan_json: string; completed_at: string | null }>();
  if (!session) return c.text("practice session not found", 404);
  if (session.completed_at) return c.text("practice session completed", 409);
  const plan = JSON.parse(session.plan_json) as { cards: { skill_id: string; item_id: string }[] };
  const planMatch = plan.cards.some((card) => card.skill_id === parsed.data.skill_id && card.item_id === parsed.data.item_id);
  if (!planMatch) return c.text("attempt does not match plan", 400);
  const id = ulid();
  await c.env.DB.prepare(
    `INSERT INTO attempt (id, practice_session_id, student_id, skill_id, item_id, result, scoring_source, duration_ms, shown_at, scored_at)
     VALUES (?, ?, ?, ?, ?, ?, 'guardian_tap', ?, ?, ?)`
  ).bind(
    id,
    parsed.data.practice_session_id,
    studentId,
    parsed.data.skill_id,
    parsed.data.item_id,
    parsed.data.result,
    parsed.data.duration_ms,
    parsed.data.shown_at,
    new Date().toISOString()
  ).run();
  return json({ attempt: { id, scoring_source: "guardian_tap" } }, { status: 201 });
});

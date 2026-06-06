import { Hono } from "hono";
import { z } from "zod";
import { ulid } from "ulid";
import { json } from "../db/client";
import { buildPracticePlan, type MasteryState } from "../scheduler/planner";
import type { ReviewAttempt } from "../scheduler/review";
import { getAuthenticatedGuardian } from "../db/session";
import type { AuthenticatedGuardian, Env } from "../types";

type StudentPlanState = {
  grade: string;
  skillMastery: Record<string, MasteryState>;
  itemMastery: Record<string, MasteryState>;
  recentAttempts: Record<string, ReviewAttempt[]>;
};

const attemptSchema = z.object({
  practice_session_id: z.string().min(1),
  skill_id: z.string().min(1),
  item_id: z.string().min(1),
  result: z.enum(["correct", "incorrect", "skipped"]),
  scoring_source: z.literal("guardian_tap").optional(),
  duration_ms: z.number().int().nonnegative(),
  shown_at: z.string().min(1)
});

// Spaced-repetition interval per mastery level (days). `ease` is reserved for a
// later tuning pass and intentionally left untouched in Phase A.
const INTERVAL_DAYS: Record<number, number> = { 0: 0, 1: 1, 2: 2, 3: 4, 4: 7 };

type MasteryDelta = { level: number; streak: number; dueAt: string };

const nextMastery = (
  prev: { level: number; streak: number } | null,
  result: "correct" | "incorrect" | "skipped",
  scoredAt: string
): MasteryDelta => {
  const prevLevel = prev?.level ?? 0;
  const prevStreak = prev?.streak ?? 0;
  let level: number;
  let streak: number;
  switch (result) {
    case "correct":
      level = Math.min(4, prevLevel + 1);
      streak = prevStreak + 1;
      break;
    case "incorrect":
      level = Math.max(0, prevLevel - 1);
      streak = 0;
      break;
    case "skipped":
      level = prevLevel;
      streak = 0;
      break;
  }
  const dueAt = new Date(Date.parse(scoredAt) + (INTERVAL_DAYS[level] ?? 0) * 86_400_000).toISOString();
  return { level, streak, dueAt };
};

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

const loadStudentPlanState = async (env: Env, guardianId: string, studentId: string): Promise<StudentPlanState | null> => {
  const student = await env.DB.prepare("SELECT grade FROM student WHERE id = ? AND guardian_id = ? AND archived_at IS NULL")
    .bind(studentId, guardianId).first<{ grade: string }>();
  if (!student) return null;

  const { results: skillRows } = await env.DB.prepare("SELECT skill_id, level, streak FROM skill_mastery WHERE student_id = ?")
    .bind(studentId).all<{ skill_id: string; level: number; streak: number }>();
  const { results: itemRows } = await env.DB.prepare("SELECT item_id, level, streak FROM item_mastery WHERE student_id = ?")
    .bind(studentId).all<{ item_id: string; level: number; streak: number }>();
  const { results: attemptRows } = await env.DB.prepare(
    "SELECT skill_id, result, duration_ms FROM attempt WHERE student_id = ? ORDER BY scored_at DESC"
  ).bind(studentId).all<{ skill_id: string; result: ReviewAttempt["result"]; duration_ms: number }>();

  const skillMastery = Object.fromEntries(skillRows.map((row) => [row.skill_id, { level: row.level, streak: row.streak }]));
  const itemMastery = Object.fromEntries(itemRows.map((row) => [row.item_id, { level: row.level, streak: row.streak }]));
  const recentAttempts: Record<string, ReviewAttempt[]> = {};
  for (const row of attemptRows) {
    recentAttempts[row.skill_id] ??= [];
    recentAttempts[row.skill_id]!.push({ result: row.result, duration_ms: row.duration_ms });
  }

  return { grade: student.grade, skillMastery, itemMastery, recentAttempts };
};

practiceRoutes.post("/:studentId/start", async (c) => {
  const guardian = c.get("guardian");
  const studentId = c.req.param("studentId");
  const state = await loadStudentPlanState(c.env, guardian.id, studentId);
  if (!state) return c.text("not found", 404);
  const id = ulid();
  const plan = buildPracticePlan(state);
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
  const scoredAt = new Date().toISOString();

  // Read current mastery, compute new values in TS, then write the attempt and
  // both upserts in a single D1 batch (one implicit transaction — all statements
  // commit together or none do). The read-then-batch is intentionally NOT row-locked:
  // per the plan's atomicity decision, D1 is single-writer and one student's
  // guardian-tap attempts are issued strictly serially, so no concurrent writer
  // races the same (student_id, skill_id) row. Revisit if concurrent multi-device
  // practice for one student becomes possible.
  const skillPrev = await c.env.DB.prepare("SELECT level, streak FROM skill_mastery WHERE student_id = ? AND skill_id = ?")
    .bind(studentId, parsed.data.skill_id).first<{ level: number; streak: number }>();
  const itemPrev = await c.env.DB.prepare("SELECT level, streak FROM item_mastery WHERE student_id = ? AND item_id = ?")
    .bind(studentId, parsed.data.item_id).first<{ level: number; streak: number }>();
  const skillNext = nextMastery(skillPrev, parsed.data.result, scoredAt);
  const itemNext = nextMastery(itemPrev, parsed.data.result, scoredAt);

  await c.env.DB.batch([
    c.env.DB.prepare(
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
      scoredAt
    ),
    c.env.DB.prepare(
      `INSERT INTO skill_mastery (student_id, skill_id, level, streak, due_at, last_seen_at)
       VALUES (?, ?, ?, ?, ?, ?)
       ON CONFLICT(student_id, skill_id) DO UPDATE SET level = ?, streak = ?, due_at = ?, last_seen_at = ?`
    ).bind(
      studentId, parsed.data.skill_id, skillNext.level, skillNext.streak, skillNext.dueAt, scoredAt,
      skillNext.level, skillNext.streak, skillNext.dueAt, scoredAt
    ),
    c.env.DB.prepare(
      `INSERT INTO item_mastery (student_id, item_id, skill_id, level, streak, due_at, last_seen_at)
       VALUES (?, ?, ?, ?, ?, ?, ?)
       ON CONFLICT(student_id, item_id) DO UPDATE SET level = ?, streak = ?, due_at = ?, last_seen_at = ?`
    ).bind(
      studentId, parsed.data.item_id, parsed.data.skill_id, itemNext.level, itemNext.streak, itemNext.dueAt, scoredAt,
      itemNext.level, itemNext.streak, itemNext.dueAt, scoredAt
    )
  ]);
  return json({ attempt: { id, scoring_source: "guardian_tap" } }, { status: 201 });
});

import { Hono } from "hono";
import { z } from "zod";
import { ulid } from "ulid";
import { json } from "../db/client";
import { getAuthenticatedGuardian } from "../db/session";
import type { StudentRow } from "../db/schema";
import type { AuthenticatedGuardian, Env } from "../types";

const createSchema = z.object({
  display_name: z.string().trim().min(1),
  grade: z.enum(["K", "1"]),
  birth_month: z.string().regex(/^\d{4}-\d{2}$/).optional()
});

const patchSchema = z.object({
  display_name: z.string().trim().min(1).optional(),
  grade: z.enum(["K", "1"]).optional(),
  prefs_json: z.record(z.unknown()).optional()
});

const serializeStudent = (row: StudentRow) => ({
  ...row,
  prefs_json: JSON.parse(row.prefs_json) as unknown
});

export const studentRoutes = new Hono<{ Bindings: Env; Variables: { guardian: AuthenticatedGuardian } }>();

studentRoutes.use("*", async (c, next) => {
  const guardian = await getAuthenticatedGuardian(c);
  if (!guardian) return c.text("unauthorized", 401);
  c.set("guardian", guardian);
  await next();
});

studentRoutes.get("/", async (c) => {
  const guardian = c.get("guardian");
  const { results } = await c.env.DB.prepare(
    "SELECT * FROM student WHERE guardian_id = ? AND archived_at IS NULL ORDER BY created_at"
  ).bind(guardian.id).all<StudentRow>();
  return json({ students: results.map(serializeStudent) });
});

studentRoutes.post("/", async (c) => {
  const guardian = c.get("guardian");
  const parsed = createSchema.safeParse(await c.req.json().catch(() => null));
  if (!parsed.success) return c.text("invalid student", 400);
  const id = ulid();
  const now = new Date().toISOString();
  await c.env.DB.prepare(
    "INSERT INTO student (id, guardian_id, display_name, grade, birth_month, created_at) VALUES (?, ?, ?, ?, ?, ?)"
  ).bind(id, guardian.id, parsed.data.display_name, parsed.data.grade, parsed.data.birth_month ?? null, now).run();
  const row = await c.env.DB.prepare("SELECT * FROM student WHERE id = ?").bind(id).first<StudentRow>();
  return json({ student: serializeStudent(row!) }, { status: 201 });
});

studentRoutes.get("/:id", async (c) => {
  const guardian = c.get("guardian");
  const row = await c.env.DB.prepare("SELECT * FROM student WHERE id = ? AND guardian_id = ? AND archived_at IS NULL")
    .bind(c.req.param("id"), guardian.id).first<StudentRow>();
  if (!row) return c.text("not found", 404);
  return json({ student: serializeStudent(row) });
});

studentRoutes.patch("/:id", async (c) => {
  const guardian = c.get("guardian");
  const existing = await c.env.DB.prepare("SELECT * FROM student WHERE id = ? AND guardian_id = ? AND archived_at IS NULL")
    .bind(c.req.param("id"), guardian.id).first<StudentRow>();
  if (!existing) return c.text("not found", 404);
  const parsed = patchSchema.safeParse(await c.req.json().catch(() => null));
  if (!parsed.success) return c.text("invalid student", 400);
  const next = {
    display_name: parsed.data.display_name ?? existing.display_name,
    grade: parsed.data.grade ?? existing.grade,
    prefs_json: parsed.data.prefs_json ? JSON.stringify(parsed.data.prefs_json) : existing.prefs_json
  };
  await c.env.DB.prepare("UPDATE student SET display_name = ?, grade = ?, prefs_json = ? WHERE id = ? AND guardian_id = ?")
    .bind(next.display_name, next.grade, next.prefs_json, existing.id, guardian.id).run();
  const row = await c.env.DB.prepare("SELECT * FROM student WHERE id = ?").bind(existing.id).first<StudentRow>();
  return json({ student: serializeStudent(row!) });
});

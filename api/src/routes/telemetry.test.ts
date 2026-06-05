import { beforeEach, describe, expect, it } from "vitest";
import { env, SELF } from "cloudflare:test";
import { resetFoundationDb } from "../test/reset-db";

const seed = async () => {
  await resetFoundationDb();
  const now = new Date().toISOString();
  const future = new Date(Date.now() + 60_000).toISOString();
  await env.DB.prepare("INSERT INTO guardian (id, email, role, created_at) VALUES (?, ?, 'guardian', ?)").bind("g_diag", "local-guardian@example.com", now).run();
  await env.DB.prepare("INSERT INTO guardian (id, email, role, created_at) VALUES (?, ?, 'guardian', ?)").bind("g_other", "other@example.com", now).run();
  await env.DB.prepare("INSERT INTO session (id, guardian_id, expires_at, created_at) VALUES (?, ?, ?, ?)").bind("s_diag", "g_diag", future, now).run();
  await env.DB.prepare("INSERT INTO session (id, guardian_id, expires_at, created_at) VALUES (?, ?, ?, ?)").bind("s_other", "g_other", future, now).run();
  await env.DB.prepare("INSERT INTO student (id, guardian_id, display_name, grade, created_at) VALUES (?, ?, ?, ?, ?)").bind("student1", "g_diag", "Ada", "K", now).run();
};

describe("complete-session endpoint", () => {
  beforeEach(seed);

  it("writes completed_at and is idempotent", async () => {
    const start = await SELF.fetch("https://api.test/practice/student1/start", { method: "POST", headers: { cookie: "session=s_diag" } });
    const started = await start.json<{ practice_session: { id: string } }>();
    const sessionId = started.practice_session.id;

    const first = await SELF.fetch("https://api.test/practice/student1/complete", {
      method: "POST",
      headers: { "content-type": "application/json", cookie: "session=s_diag" },
      body: JSON.stringify({ practice_session_id: sessionId })
    });
    expect(first.status).toBe(200);
    const firstBody = await first.json<{ practice_session: { completed_at: string } }>();
    expect(firstBody.practice_session.completed_at).toBeTruthy();

    const row = await env.DB.prepare("SELECT completed_at FROM practice_session WHERE id = ?").bind(sessionId).first<{ completed_at: string | null }>();
    expect(row?.completed_at).toBe(firstBody.practice_session.completed_at);

    const second = await SELF.fetch("https://api.test/practice/student1/complete", {
      method: "POST",
      headers: { "content-type": "application/json", cookie: "session=s_diag" },
      body: JSON.stringify({ practice_session_id: sessionId })
    });
    const secondBody = await second.json<{ practice_session: { completed_at: string } }>();
    expect(secondBody.practice_session.completed_at).toBe(firstBody.practice_session.completed_at);
  });

  it("rejects completion of a session the caller does not own", async () => {
    const start = await SELF.fetch("https://api.test/practice/student1/start", { method: "POST", headers: { cookie: "session=s_diag" } });
    const started = await start.json<{ practice_session: { id: string } }>();
    const forbidden = await SELF.fetch("https://api.test/practice/student1/complete", {
      method: "POST",
      headers: { "content-type": "application/json", cookie: "session=s_other" },
      body: JSON.stringify({ practice_session_id: started.practice_session.id })
    });
    expect(forbidden.status).toBe(404);
  });
});

describe("diag telemetry aggregates", () => {
  beforeEach(seed);

  it("reports sessions started/completed and top friction items", async () => {
    const startedAt = new Date(Date.now() - 5 * 60_000).toISOString();
    const completedAt = new Date(Date.now() - 4 * 60_000).toISOString();
    // One completed session, one still open.
    await env.DB.prepare("INSERT INTO practice_session (id, student_id, plan_json, started_at, completed_at) VALUES (?, ?, '{}', ?, ?)").bind("ps_done", "student1", startedAt, completedAt).run();
    await env.DB.prepare("INSERT INTO practice_session (id, student_id, plan_json, started_at) VALUES (?, ?, '{}', ?)").bind("ps_open", "student1", startedAt).run();
    // Friction: two misses on the same item.
    const ins = "INSERT INTO attempt (id, practice_session_id, student_id, skill_id, item_id, result, scoring_source, duration_ms, shown_at, scored_at) VALUES (?, ?, ?, ?, ?, ?, 'guardian_tap', 1000, ?, ?)";
    await env.DB.prepare(ins).bind("a1", "ps_done", "student1", "phonics_k_u1_short_a", "word_cat", "incorrect", startedAt, completedAt).run();
    await env.DB.prepare(ins).bind("a2", "ps_done", "student1", "phonics_k_u1_short_a", "word_cat", "skipped", startedAt, completedAt).run();
    await env.DB.prepare(ins).bind("a3", "ps_done", "student1", "phonics_k_u1_short_a", "word_map", "correct", startedAt, completedAt).run();

    const res = await SELF.fetch("https://api.test/guardian/diag", { headers: { cookie: "session=s_diag" } });
    expect(res.status).toBe(200);
    const body = await res.json<{
      sessions: { student_id: string; started: number; completed: number; avg_duration_ms: number | null }[];
      friction: { student_id: string; skill_id: string; item_id: string; misses: number }[];
    }>();

    const student1Sessions = body.sessions.find((s) => s.student_id === "student1");
    expect(student1Sessions).toMatchObject({ started: 2, completed: 1 });
    expect(student1Sessions!.avg_duration_ms).toBeGreaterThan(0);

    const topFriction = body.friction[0]!;
    expect(topFriction).toMatchObject({ item_id: "word_cat", misses: 2 });
  });
});

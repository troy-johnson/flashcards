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

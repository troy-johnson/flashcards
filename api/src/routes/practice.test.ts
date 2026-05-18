import { beforeEach, describe, expect, it } from "vitest";
import { env, SELF } from "cloudflare:test";
import { resetFoundationDb } from "../test/reset-db";

const resetDb = async () => {
  await resetFoundationDb();
  const now = new Date().toISOString();
  const future = new Date(Date.now() + 60_000).toISOString();
  await env.DB.prepare("INSERT INTO guardian (id, email, role, created_at) VALUES (?, ?, 'guardian', ?)").bind("g_diag", "local-guardian@example.com", now).run();
  await env.DB.prepare("INSERT INTO guardian (id, email, role, created_at) VALUES (?, ?, 'guardian', ?)").bind("g_other", "other@example.com", now).run();
  await env.DB.prepare("INSERT INTO session (id, guardian_id, expires_at, created_at) VALUES (?, ?, ?, ?)").bind("s_diag", "g_diag", future, now).run();
  await env.DB.prepare("INSERT INTO session (id, guardian_id, expires_at, created_at) VALUES (?, ?, ?, ?)").bind("s_other", "g_other", future, now).run();
  await env.DB.prepare("INSERT INTO student (id, guardian_id, display_name, grade, created_at) VALUES (?, ?, ?, ?, ?)").bind("student1", "g_diag", "Ada", "K", now).run();
};

describe("practice and diagnostic routes", () => {
  beforeEach(resetDb);

  it("creates a practice session and persists guardian-tap attempts", async () => {
    const start = await SELF.fetch("https://api.test/practice/student1/start", { method: "POST", headers: { cookie: "session=s_diag" } });
    expect(start.status).toBe(201);
    const started = await start.json<{ practice_session: { id: string; plan_json: { cards: { item_id: string; skill_id: string }[] } } }>();
    expect(started.practice_session.plan_json.cards.length).toBeGreaterThan(0);
    const card = started.practice_session.plan_json.cards[0]!;

    const attempt = await SELF.fetch("https://api.test/practice/student1/attempt", {
      method: "POST",
      headers: { "content-type": "application/json", cookie: "session=s_diag" },
      body: JSON.stringify({ practice_session_id: started.practice_session.id, skill_id: card.skill_id, item_id: card.item_id, result: "correct", duration_ms: 1200, shown_at: new Date().toISOString() })
    });
    expect(attempt.status).toBe(201);
    const row = await env.DB.prepare("SELECT scoring_source, result FROM attempt WHERE student_id = ?").bind("student1").first<{ scoring_source: string; result: string }>();
    expect(row).toEqual({ scoring_source: "guardian_tap", result: "correct" });
  });

  it("rejects non-guardian-tap scoring sources and gates diagnostics", async () => {
    const start = await SELF.fetch("https://api.test/practice/student1/start", { method: "POST", headers: { cookie: "session=s_diag" } });
    const started = await start.json<{ practice_session: { id: string; plan_json: { cards: { item_id: string; skill_id: string }[] } } }>();
    const card = started.practice_session.plan_json.cards[0]!;
    const rejected = await SELF.fetch("https://api.test/practice/student1/attempt", {
      method: "POST",
      headers: { "content-type": "application/json", cookie: "session=s_diag" },
      body: JSON.stringify({ practice_session_id: started.practice_session.id, skill_id: card.skill_id, item_id: card.item_id, result: "correct", scoring_source: "mic_auto", duration_ms: 1200, shown_at: new Date().toISOString() })
    });
    expect(rejected.status).toBe(400);

    const forbidden = await SELF.fetch("https://api.test/guardian/diag", { headers: { cookie: "session=s_other" } });
    expect(forbidden.status).toBe(403);
    const allowed = await SELF.fetch("https://api.test/guardian/diag", { headers: { cookie: "session=s_diag" } });
    expect(allowed.status).toBe(200);
  });
});

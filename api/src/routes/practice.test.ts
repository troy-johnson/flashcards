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

type PracticeSession = { id: string; plan: { cards: { item_id: string; skill_id: string }[] } };
type MasteryRow = { level: number; streak: number; ease: number; due_at: string; last_seen_at: string };

const startSession = async (): Promise<PracticeSession> => {
  const start = await SELF.fetch("https://api.test/practice/student1/start", { method: "POST", headers: { cookie: "session=s_diag" } });
  const started = await start.json<{ practice_session: PracticeSession }>();
  return started.practice_session;
};

const postAttempt = (sessionId: string, body: Record<string, unknown>) =>
  SELF.fetch("https://api.test/practice/student1/attempt", {
    method: "POST",
    headers: { "content-type": "application/json", cookie: "session=s_diag" },
    body: JSON.stringify({ practice_session_id: sessionId, shown_at: new Date().toISOString(), ...body })
  });

const skillRow = () =>
  env.DB.prepare("SELECT level, streak, ease, due_at, last_seen_at FROM skill_mastery WHERE student_id = ? AND skill_id = ?")
    .bind("student1", "phonics_k_u1_short_a").first<MasteryRow>();
const itemRow = () =>
  env.DB.prepare("SELECT level, streak, ease, due_at, last_seen_at FROM item_mastery WHERE student_id = ? AND item_id = ?")
    .bind("student1", "phonics_k_u1_short_a_cat").first<MasteryRow>();
const attemptCount = async () =>
  (await env.DB.prepare("SELECT COUNT(*) AS n FROM attempt WHERE student_id = ?").bind("student1").first<{ n: number }>())!.n;

const addDaysIso = (iso: string, days: number) => new Date(Date.parse(iso) + days * 86_400_000).toISOString();

describe("practice and diagnostic routes", () => {
  beforeEach(resetDb);

  it("creates a practice session and persists guardian-tap attempts", async () => {
    const start = await SELF.fetch("https://api.test/practice/student1/start", { method: "POST", headers: { cookie: "session=s_diag" } });
    expect(start.status).toBe(201);
    const started = await start.json<{ practice_session: { id: string; plan: { cards: { item_id: string; skill_id: string }[] } } }>();
    expect(started.practice_session.plan.cards.length).toBeGreaterThan(0);
    const card = started.practice_session.plan.cards[0]!;

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
    const started = await start.json<{ practice_session: { id: string; plan: { cards: { item_id: string; skill_id: string }[] } } }>();
    const card = started.practice_session.plan.cards[0]!;
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

  it("rejects attempts whose skill_id/item_id are not in the started plan", async () => {
    const start = await SELF.fetch("https://api.test/practice/student1/start", { method: "POST", headers: { cookie: "session=s_diag" } });
    const started = await start.json<{ practice_session: { id: string; plan: { cards: { item_id: string; skill_id: string }[] } } }>();
    const forged = await SELF.fetch("https://api.test/practice/student1/attempt", {
      method: "POST",
      headers: { "content-type": "application/json", cookie: "session=s_diag" },
      body: JSON.stringify({
        practice_session_id: started.practice_session.id,
        skill_id: "phonics_k_u1_short_a",
        item_id: "not_in_plan",
        result: "correct",
        duration_ms: 100,
        shown_at: new Date().toISOString()
      })
    });
    expect(forged.status).toBe(400);
  });

  it("upserts skill and item mastery across correct/incorrect/skipped transitions", async () => {
    const session = await startSession();
    const card = session.plan.cards[0]!;
    const attempt = (result: string, duration_ms: number) =>
      postAttempt(session.id, { skill_id: card.skill_id, item_id: card.item_id, result, duration_ms });

    // 1. first correct → streak 1, level 1, ease 2.5, due_at = scored_at + 1 day
    expect((await attempt("correct", 1200)).status).toBe(201);
    for (const row of [await skillRow(), await itemRow()]) {
      expect(row).not.toBeNull();
      expect(row!.streak).toBe(1);
      expect(row!.level).toBe(1);
      expect(row!.ease).toBe(2.5);
      expect(row!.due_at).toBe(addDaysIso(row!.last_seen_at, 1));
    }

    // 2. second consecutive correct → streak 2, level 2, due_at = scored_at + 2 days
    expect((await attempt("correct", 1200)).status).toBe(201);
    for (const row of [await skillRow(), await itemRow()]) {
      expect(row!.streak).toBe(2);
      expect(row!.level).toBe(2);
      expect(row!.due_at).toBe(addDaysIso(row!.last_seen_at, 2));
    }

    // 3. incorrect → streak 0, level max(0, 2-1)=1, due_at = scored_at + 1 day
    expect((await attempt("incorrect", 1500)).status).toBe(201);
    for (const row of [await skillRow(), await itemRow()]) {
      expect(row!.streak).toBe(0);
      expect(row!.level).toBe(1);
      expect(row!.due_at).toBe(addDaysIso(row!.last_seen_at, 1));
    }

    // 4. skipped → streak 0, level unchanged (1), due_at = scored_at + interval(1) = 1 day
    expect((await attempt("skipped", 800)).status).toBe(201);
    for (const row of [await skillRow(), await itemRow()]) {
      expect(row!.streak).toBe(0);
      expect(row!.level).toBe(1);
      expect(row!.due_at).toBe(addDaysIso(row!.last_seen_at, 1));
    }
  });

  it("writes no attempt or mastery row when the attempt is not in the plan", async () => {
    const session = await startSession();
    const forged = await postAttempt(session.id, { skill_id: "phonics_k_u1_short_a", item_id: "not_in_plan", result: "correct", duration_ms: 100 });
    expect(forged.status).toBe(400);
    expect(await attemptCount()).toBe(0);
    expect(await skillRow()).toBeNull();
    expect(await itemRow()).toBeNull();
  });

  it("returns 409 and writes nothing for a completed session", async () => {
    const session = await startSession();
    const card = session.plan.cards[0]!;
    await env.DB.prepare("UPDATE practice_session SET completed_at = ? WHERE id = ?").bind(new Date().toISOString(), session.id).run();
    const res = await postAttempt(session.id, { skill_id: card.skill_id, item_id: card.item_id, result: "correct", duration_ms: 1200 });
    expect(res.status).toBe(409);
    expect(await attemptCount()).toBe(0);
    expect(await skillRow()).toBeNull();
    expect(await itemRow()).toBeNull();
  });
});

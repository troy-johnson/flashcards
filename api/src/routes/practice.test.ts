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
  await env.DB.prepare("INSERT INTO student (id, guardian_id, display_name, grade, created_at) VALUES (?, ?, ?, ?, ?)").bind("student2", "g_diag", "Grace", "1", now).run();
};

type PracticeSession = { id: string; student_id: string; plan: { cards: { item_id: string; skill_id: string }[] } };
type MasteryRow = { level: number; streak: number; ease: number; due_at: string; last_seen_at: string };

const startSessionFor = async (studentId: string): Promise<PracticeSession> => {
  const start = await SELF.fetch(`https://api.test/practice/${studentId}/start`, { method: "POST", headers: { cookie: "session=s_diag" } });
  expect(start.status).toBe(201);
  const started = await start.json<{ practice_session: PracticeSession }>();
  return started.practice_session;
};

const startSession = () => startSessionFor("student1");

const postAttempt = (sessionId: string, body: Record<string, unknown>) =>
  SELF.fetch("https://api.test/practice/student1/attempt", {
    method: "POST",
    headers: { "content-type": "application/json", cookie: "session=s_diag" },
    body: JSON.stringify({ practice_session_id: sessionId, shown_at: new Date().toISOString(), ...body })
  });

const skillRow = (skillId = "phonics_k_u1_short_a") =>
  env.DB.prepare("SELECT level, streak, ease, due_at, last_seen_at FROM skill_mastery WHERE student_id = ? AND skill_id = ?")
    .bind("student1", skillId).first<MasteryRow>();
const itemRow = (itemId = "phonics_k_u1_short_a_mat") =>
  env.DB.prepare("SELECT level, streak, ease, due_at, last_seen_at FROM item_mastery WHERE student_id = ? AND item_id = ?")
    .bind("student1", itemId).first<MasteryRow>();
const masteryRowsFor = async (card: { skill_id: string; item_id: string }) => [await skillRow(card.skill_id), await itemRow(card.item_id)];
const attemptCount = async () =>
  (await env.DB.prepare("SELECT COUNT(*) AS n FROM attempt WHERE student_id = ?").bind("student1").first<{ n: number }>())!.n;

const addDaysIso = (iso: string, days: number) => new Date(Date.parse(iso) + days * 86_400_000).toISOString();
const insertAttemptStatement = (id: string, studentId: string, skillId: string, itemId: string, scoredAt: string) =>
  env.DB.prepare(
    `INSERT INTO attempt (id, practice_session_id, student_id, skill_id, item_id, result, scoring_source, duration_ms, shown_at, scored_at)
     VALUES (?, ?, ?, ?, ?, 'correct', 'guardian_tap', ?, ?, ?)`
  ).bind(id, "history_session", studentId, skillId, itemId, 1000, scoredAt, scoredAt);

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

  it("starts grade-aware plans from scheduler content", async () => {
    const kSession = await startSessionFor("student1");
    const firstGradeSession = await startSessionFor("student2");

    expect(kSession.plan.cards[0]?.skill_id).toBe("pa_k_u1_blend_two_sound");
    expect(firstGradeSession.plan.cards[0]?.skill_id).toBe("pa_k_u1_blend_two_sound");
    expect(new Set(kSession.plan.cards.map((card) => card.skill_id)).size).toBeGreaterThan(1);
    expect(new Set(firstGradeSession.plan.cards.map((card) => card.skill_id)).size).toBeGreaterThan(1);
  });

  it("uses 1st-grade review history when starting and persisting scheduler plans", async () => {
    const startedAt = "2026-01-01T00:00:00.000Z";
    await env.DB.prepare("INSERT INTO practice_session (id, student_id, plan_json, started_at) VALUES (?, ?, ?, ?)")
      .bind("history_session", "student2", JSON.stringify({ cards: [] }), startedAt).run();

    const statements = [];
    for (let i = 0; i < 4; i++) {
      const scoredAt = new Date(Date.parse(startedAt) + i * 1000).toISOString();
      statements.push(insertAttemptStatement(`review_pass_${i}`, "student2", "pa_k_u1_blend_two_sound", "pa_k_u1_blend_at", scoredAt));
    }
    for (let i = 0; i < 200; i++) {
      const scoredAt = new Date(Date.parse(startedAt) + 10_000 + i * 1000).toISOString();
      statements.push(insertAttemptStatement(`noise_${i}`, "student2", "noise_skill", "noise_item", scoredAt));
    }
    await env.DB.batch(statements);

    const session = await startSessionFor("student2");
    expect(session.student_id).toBe("student2");
    expect(session.plan.cards[0]?.skill_id).toBe("phonics_k_u1_short_a");
    expect(session.plan.cards.some((card) => card.skill_id === "pa_k_u1_blend_two_sound")).toBe(false);

    const stored = await env.DB.prepare("SELECT plan_json FROM practice_session WHERE id = ?").bind(session.id).first<{ plan_json: string }>();
    expect(JSON.parse(stored!.plan_json)).toEqual(session.plan);
  });

  it("serves 1st-grade active content when a 1st grader has exhausted the K-review path", async () => {
    const startedAt = "2026-01-01T00:00:00.000Z";
    await env.DB.prepare("INSERT INTO practice_session (id, student_id, plan_json, started_at) VALUES (?, ?, ?, ?)")
      .bind("history_session", "student2", JSON.stringify({ cards: [] }), startedAt).run();
    const kSkills = [
      "pa_k_u1_isolate_initial_sound",
      "pa_k_u1_blend_two_sound",
      "phonics_k_u1_consonants_mstp",
      "phonics_k_u1_short_a",
      "phonics_k_u1_cvc_blend_short_a",
      "heart_k_u1_batch_01",
      "fluency_k_u1_cvc_sentences",
      "pa_k_u2_segment_three_sound",
      "phonics_k_u2_consonants_ncdg",
      "phonics_k_u2_short_o",
      "phonics_k_u2_cvc_blend_short_o",
      "fluency_k_u2_cvc_sentences"
    ];
    const statements = [];
    let n = 0;
    for (const skillId of kSkills) {
      for (let i = 0; i < 4; i++) {
        const scoredAt = new Date(Date.parse(startedAt) + n * 1000).toISOString();
        statements.push(insertAttemptStatement(`rp_${n}`, "student2", skillId, `${skillId}_item`, scoredAt));
        n++;
      }
    }
    await env.DB.batch(statements);

    const start = await SELF.fetch("https://api.test/practice/student2/start", { method: "POST", headers: { cookie: "session=s_diag" } });
    expect(start.status).toBe(201);
    const body = await start.json<{ practice_session: { plan: { cards: { skill_id: string }[] } }; terminal_reason?: string }>();
    expect(body.practice_session.plan.cards).toHaveLength(22);
    expect(body.practice_session.plan.cards[0]?.skill_id).toBe("phonics_1_u1_alphabet_review");
    expect(body.terminal_reason).toBeUndefined();
  });

  it("surfaces a terminal reason only at the true end of the K plus 1st-grade sequence", async () => {
    const startedAt = "2026-01-01T00:00:00.000Z";
    await env.DB.prepare("INSERT INTO practice_session (id, student_id, plan_json, started_at) VALUES (?, ?, ?, ?)")
      .bind("history_session", "student2", JSON.stringify({ cards: [] }), startedAt).run();
    const allPracticeableSkills = [
      "pa_k_u1_blend_two_sound",
      "phonics_k_u1_short_a",
      "phonics_k_u1_cvc_blend_short_a",
      "heart_k_u1_batch_01",
      "fluency_k_u1_cvc_sentences",
      "phonics_k_u2_consonants_ncdg",
      "phonics_k_u2_cvc_blend_short_o",
      "fluency_k_u2_cvc_sentences",
      "phonics_1_u1_alphabet_review",
      "phonics_1_u1_short_i",
      "phonics_1_u1_short_e_u",
      "heart_1_u1_batch_01",
      "fluency_1_u1_short_vowel_sentences"
    ];
    const statements = [];
    let n = 0;
    for (const skillId of allPracticeableSkills) {
      for (let i = 0; i < 4; i++) {
        const scoredAt = new Date(Date.parse(startedAt) + n * 1000).toISOString();
        statements.push(insertAttemptStatement(`end_${n}`, "student2", skillId, `${skillId}_item`, scoredAt));
        n++;
      }
    }
    await env.DB.batch(statements);

    const start = await SELF.fetch("https://api.test/practice/student2/start", { method: "POST", headers: { cookie: "session=s_diag" } });
    expect(start.status).toBe(201);
    const body = await start.json<{ practice_session: { plan: { cards: unknown[] } }; terminal_reason?: string }>();
    expect(body.practice_session.plan.cards).toHaveLength(0);
    expect(body.terminal_reason).toBe("review_complete_no_active_content");
  });

  it("omits the terminal reason for a normal (non-exhausted) start", async () => {
    const kStart = await SELF.fetch("https://api.test/practice/student1/start", { method: "POST", headers: { cookie: "session=s_diag" } });
    const firstGradeStart = await SELF.fetch("https://api.test/practice/student2/start", { method: "POST", headers: { cookie: "session=s_diag" } });
    const kBody = await kStart.json<{ practice_session: { plan: { cards: unknown[] } }; terminal_reason?: string }>();
    const firstGradeBody = await firstGradeStart.json<{ practice_session: { plan: { cards: unknown[] } }; terminal_reason?: string }>();
    expect(kBody.practice_session.plan.cards.length).toBeGreaterThan(0);
    expect(kBody.terminal_reason).toBeUndefined();
    expect(firstGradeBody.practice_session.plan.cards.length).toBeGreaterThan(0);
    expect(firstGradeBody.terminal_reason).toBeUndefined();
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
    for (const row of await masteryRowsFor(card)) {
      expect(row).not.toBeNull();
      expect(row!.streak).toBe(1);
      expect(row!.level).toBe(1);
      expect(row!.ease).toBe(2.5);
      expect(row!.due_at).toBe(addDaysIso(row!.last_seen_at, 1));
    }

    // 2. second consecutive correct → streak 2, level 2, due_at = scored_at + 2 days
    expect((await attempt("correct", 1200)).status).toBe(201);
    for (const row of await masteryRowsFor(card)) {
      expect(row!.streak).toBe(2);
      expect(row!.level).toBe(2);
      expect(row!.due_at).toBe(addDaysIso(row!.last_seen_at, 2));
    }

    // 3. incorrect → streak 0, level max(0, 2-1)=1, due_at = scored_at + 1 day
    expect((await attempt("incorrect", 1500)).status).toBe(201);
    for (const row of await masteryRowsFor(card)) {
      expect(row!.streak).toBe(0);
      expect(row!.level).toBe(1);
      expect(row!.due_at).toBe(addDaysIso(row!.last_seen_at, 1));
    }

    // 4. skipped → streak 0, level unchanged (1), due_at = scored_at + interval(1) = 1 day
    expect((await attempt("skipped", 800)).status).toBe(201);
    for (const row of await masteryRowsFor(card)) {
      expect(row!.streak).toBe(0);
      expect(row!.level).toBe(1);
      expect(row!.due_at).toBe(addDaysIso(row!.last_seen_at, 1));
    }
  });

  it("bases last_seen_at and due_at on the server scored_at, not a stale or zero base", async () => {
    const session = await startSession();
    const card = session.plan.cards[0]!;
    const before = Date.now() - 60_000;
    const res = await postAttempt(session.id, { skill_id: card.skill_id, item_id: card.item_id, result: "correct", duration_ms: 1200 });
    const after = Date.now() + 60_000;
    expect(res.status).toBe(201);
    for (const row of await masteryRowsFor(card)) {
      const seen = Date.parse(row!.last_seen_at);
      // last_seen_at is the real server scored_at (within the request window), not epoch 0 / null / far future.
      expect(seen).toBeGreaterThanOrEqual(before);
      expect(seen).toBeLessThanOrEqual(after);
      // due_at is exactly one interval (level 1 => +1 day) past that same base.
      expect(Date.parse(row!.due_at)).toBe(seen + 86_400_000);
    }
  });

  it("rolls back the entire D1 batch when a later statement violates a constraint", async () => {
    // Proves the atomicity the attempt handler relies on: a batch is one transaction,
    // so a later failure leaves no earlier row behind. Second insert violates
    // CHECK (level BETWEEN 0 AND 4).
    await expect(
      env.DB.batch([
        env.DB.prepare("INSERT INTO skill_mastery (student_id, skill_id, level, streak) VALUES (?, ?, ?, ?)").bind("student1", "skill_valid", 1, 1),
        env.DB.prepare("INSERT INTO skill_mastery (student_id, skill_id, level, streak) VALUES (?, ?, ?, ?)").bind("student1", "skill_bad", 99, 0)
      ])
    ).rejects.toThrow();
    const valid = await env.DB.prepare("SELECT skill_id FROM skill_mastery WHERE student_id = ? AND skill_id = ?").bind("student1", "skill_valid").first();
    expect(valid).toBeNull();
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

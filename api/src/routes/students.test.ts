import { beforeEach, describe, expect, it } from "vitest";
import { env, SELF } from "cloudflare:test";
import { resetFoundationDb } from "../test/reset-db";
import { resolveProgressMetadata } from "./students";

const resetDb = async () => {
  await resetFoundationDb();
  const now = new Date().toISOString();
  const future = new Date(Date.now() + 60_000).toISOString();
  await env.DB.prepare("INSERT INTO guardian (id, email, role, created_at) VALUES (?, ?, 'guardian', ?)").bind("g1", "one@example.com", now).run();
  await env.DB.prepare("INSERT INTO guardian (id, email, role, created_at) VALUES (?, ?, 'guardian', ?)").bind("g2", "two@example.com", now).run();
  await env.DB.prepare("INSERT INTO session (id, guardian_id, expires_at, created_at) VALUES (?, ?, ?, ?)").bind("s1", "g1", future, now).run();
  await env.DB.prepare("INSERT INTO session (id, guardian_id, expires_at, created_at) VALUES (?, ?, ?, ?)").bind("s2", "g2", future, now).run();
  await env.DB.prepare("INSERT INTO student (id, guardian_id, display_name, grade, created_at) VALUES (?, ?, ?, ?, ?)").bind("student_owned", "g1", "Ada", "K", now).run();
  await env.DB.prepare("INSERT INTO student (id, guardian_id, display_name, grade, created_at) VALUES (?, ?, ?, ?, ?)").bind("student_other", "g2", "Other", "K", now).run();
  await env.DB.prepare("INSERT INTO student (id, guardian_id, display_name, grade, created_at, archived_at) VALUES (?, ?, ?, ?, ?, ?)").bind("student_archived", "g1", "Archived", "K", now, now).run();
  await env.DB.prepare("INSERT INTO practice_session (id, student_id, plan_json, started_at) VALUES (?, ?, '{}', ?)").bind("ps_owned", "student_owned", now).run();
  await env.DB.prepare("INSERT INTO practice_session (id, student_id, plan_json, started_at) VALUES (?, ?, '{}', ?)").bind("ps_other", "student_other", now).run();
};

const insertAttempt = async ({
  id,
  studentId = "student_owned",
  skillId,
  result
}: {
  id: string;
  studentId?: "student_owned" | "student_other";
  skillId: string;
  result: "correct" | "incorrect" | "skipped";
}) => {
  const now = new Date().toISOString();
  await env.DB.prepare(
    `INSERT INTO attempt
       (id, practice_session_id, student_id, skill_id, item_id, result, scoring_source,
        duration_ms, shown_at, scored_at)
     VALUES (?, ?, ?, ?, ?, ?, 'guardian_tap', 1000, ?, ?)`
  )
    .bind(
      id,
      studentId === "student_owned" ? "ps_owned" : "ps_other",
      studentId,
      skillId,
      `${skillId}_item`,
      result,
      now,
      now
    )
    .run();
};

describe("resolveProgressMetadata", () => {
  const fallback = {
    display_name: "Earlier practice",
    guardian_description: "Practice from an earlier version of the learning sequence.",
    uses_fallback: true
  };

  it("passes through complete canonical metadata", () => {
    expect(
      resolveProgressMetadata({
        display_name: "Short a",
        guardian_description: "Recognizes the short a sound."
      })
    ).toEqual({
      display_name: "Short a",
      guardian_description: "Recognizes the short a sound.",
      uses_fallback: false
    });
  });

  it.each([
    ["missing", undefined],
    ["blank display name", { display_name: " ", guardian_description: "Description." }],
    ["blank description", { display_name: "Name", guardian_description: "" }]
  ])("uses safe family copy for %s metadata", (_label, metadata) => {
    expect(resolveProgressMetadata(metadata)).toEqual(fallback);
  });
});

describe("student routes", () => {
  beforeEach(resetDb);

  it("creates and lists only the authenticated guardian's students", async () => {
    const create = await SELF.fetch("https://api.test/students", {
      method: "POST",
      headers: { "content-type": "application/json", cookie: "session=s1" },
      body: JSON.stringify({ display_name: "Ada", grade: "K", birth_month: "2021-05" })
    });
    expect(create.status).toBe(201);
    const created = await create.json<{ student: { id: string; display_name: string } }>();
    expect(created.student.display_name).toBe("Ada");

    const list = await SELF.fetch("https://api.test/students", { headers: { cookie: "session=s1" } });
    expect(list.status).toBe(200);
    const body = await list.json<{ students: { id: string }[] }>();
    expect(body.students.map((s: { id: string }) => s.id)).toEqual([
      "student_owned",
      created.student.id
    ]);
  });

  it("rejects birth_month outside the 01-12 month range", async () => {
    const bad = await SELF.fetch("https://api.test/students", {
      method: "POST",
      headers: { "content-type": "application/json", cookie: "session=s1" },
      body: JSON.stringify({ display_name: "Ada", grade: "K", birth_month: "2021-13" })
    });
    expect(bad.status).toBe(400);
  });

  it("prevents a guardian from reading or mutating another guardian's student", async () => {
    const read = await SELF.fetch("https://api.test/students/student_other", { headers: { cookie: "session=s1" } });
    expect(read.status).toBe(404);
    const patch = await SELF.fetch("https://api.test/students/student_other", {
      method: "PATCH",
      headers: { "content-type": "application/json", cookie: "session=s1" },
      body: JSON.stringify({ display_name: "Nope" })
    });
    expect(patch.status).toBe(404);
  });

  it("requires authentication for student progress", async () => {
    const response = await SELF.fetch("https://api.test/students/student_owned/progress");
    expect(response.status).toBe(401);
  });

  it("returns zeroed progress for an owned active student with no attempts", async () => {
    const response = await SELF.fetch("https://api.test/students/student_owned/progress", {
      headers: { cookie: "session=s1" }
    });

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({
      progress: {
        total_attempts: 0,
        correct: 0,
        skills: []
      }
    });
  });

  it("aggregates only the owned student's attempts with canonical family metadata", async () => {
    await insertAttempt({ id: "a1", skillId: "phonics_k_u1_short_a", result: "correct" });
    await insertAttempt({ id: "a2", skillId: "phonics_k_u1_short_a", result: "correct" });
    await insertAttempt({ id: "a3", skillId: "phonics_k_u1_short_a", result: "incorrect" });
    await insertAttempt({ id: "a4", skillId: "heart_k_u1_batch_01", result: "correct" });
    await insertAttempt({
      id: "other-a1",
      studentId: "student_other",
      skillId: "phonics_k_u1_short_a",
      result: "incorrect"
    });

    const response = await SELF.fetch("https://api.test/students/student_owned/progress", {
      headers: { cookie: "session=s1" }
    });
    expect(response.status).toBe(200);
    const body = await response.json<Record<string, unknown>>();

    expect(Object.keys(body)).toEqual(["progress"]);
    const progress = body.progress as Record<string, unknown>;
    expect(Object.keys(progress)).toEqual(["total_attempts", "correct", "skills"]);
    expect(progress.total_attempts).toBe(4);
    expect(progress.correct).toBe(3);
    expect(progress.skills).toEqual([
      {
        skill_id: "heart_k_u1_batch_01",
        display_name: "Kindergarten heart words",
        guardian_description:
          "Reads common words with a part that does not follow the phonics patterns taught so far.",
        attempts: 1,
        correct: 1
      },
      {
        skill_id: "phonics_k_u1_short_a",
        display_name: "Short a",
        guardian_description: "Recognizes the short a sound, as in “mat.”",
        attempts: 3,
        correct: 2
      }
    ]);
    for (const row of progress.skills as Record<string, unknown>[]) {
      expect(Object.keys(row)).toEqual([
        "skill_id",
        "display_name",
        "guardian_description",
        "attempts",
        "correct"
      ]);
    }
  });

  it("counts skipped attempts in the denominator without counting them as correct", async () => {
    await insertAttempt({ id: "skipped", skillId: "phonics_k_u1_short_a", result: "skipped" });
    const response = await SELF.fetch("https://api.test/students/student_owned/progress", {
      headers: { cookie: "session=s1" }
    });
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({
      progress: {
        total_attempts: 1,
        correct: 0,
        skills: [{
          skill_id: "phonics_k_u1_short_a",
          display_name: "Short a",
          guardian_description: "Recognizes the short a sound, as in “mat.”",
          attempts: 1,
          correct: 0
        }]
      }
    });
  });

  it("returns 404 for another guardian's student and an archived owned student", async () => {
    for (const studentId of ["student_other", "student_archived"]) {
      const response = await SELF.fetch(`https://api.test/students/${studentId}/progress`, {
        headers: { cookie: "session=s1" }
      });
      expect(response.status).toBe(404);
    }
  });

  it("collapses unknown historical skills into one sorted safe fallback row", async () => {
    await insertAttempt({ id: "known", skillId: "phonics_k_u1_short_a", result: "correct" });
    await insertAttempt({ id: "old-1", skillId: "old_skill_alpha", result: "correct" });
    await insertAttempt({ id: "old-2", skillId: "old_skill_beta", result: "incorrect" });

    const response = await SELF.fetch("https://api.test/students/student_owned/progress", {
      headers: { cookie: "session=s1" }
    });
    expect(response.status).toBe(200);
    const body = await response.json<{
      progress: {
        total_attempts: number;
        correct: number;
        skills: Array<Record<string, unknown>>;
      };
    }>();

    expect(body.progress.total_attempts).toBe(3);
    expect(body.progress.correct).toBe(2);
    expect(body.progress.skills).toEqual([
      {
        skill_id: "__earlier_practice__",
        display_name: "Earlier practice",
        guardian_description: "Practice from an earlier version of the learning sequence.",
        attempts: 2,
        correct: 1
      },
      {
        skill_id: "phonics_k_u1_short_a",
        display_name: "Short a",
        guardian_description: "Recognizes the short a sound, as in “mat.”",
        attempts: 1,
        correct: 1
      }
    ]);
  });
});

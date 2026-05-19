import { beforeEach, describe, expect, it } from "vitest";
import { env, SELF } from "cloudflare:test";
import { resetFoundationDb } from "../test/reset-db";

const resetDb = async () => {
  await resetFoundationDb();
  const now = new Date().toISOString();
  const future = new Date(Date.now() + 60_000).toISOString();
  await env.DB.prepare("INSERT INTO guardian (id, email, role, created_at) VALUES (?, ?, 'guardian', ?)").bind("g1", "one@example.com", now).run();
  await env.DB.prepare("INSERT INTO guardian (id, email, role, created_at) VALUES (?, ?, 'guardian', ?)").bind("g2", "two@example.com", now).run();
  await env.DB.prepare("INSERT INTO session (id, guardian_id, expires_at, created_at) VALUES (?, ?, ?, ?)").bind("s1", "g1", future, now).run();
  await env.DB.prepare("INSERT INTO session (id, guardian_id, expires_at, created_at) VALUES (?, ?, ?, ?)").bind("s2", "g2", future, now).run();
  await env.DB.prepare("INSERT INTO student (id, guardian_id, display_name, grade, created_at) VALUES (?, ?, ?, ?, ?)").bind("student_other", "g2", "Other", "K", now).run();
};

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
    expect(body.students.map((s: { id: string }) => s.id)).toEqual([created.student.id]);
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
});

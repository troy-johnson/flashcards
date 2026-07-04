import { beforeEach, describe, expect, it } from "vitest";
import { env, SELF } from "cloudflare:test";
import { resetFoundationDb } from "../test/reset-db";
import publicManifest from "../../../content/audio/manifest.json";

const seed = async () => {
  await resetFoundationDb();
  const now = new Date().toISOString();
  const future = new Date(Date.now() + 60_000).toISOString();
  await env.DB.prepare("INSERT INTO guardian (id, email, role, created_at) VALUES (?, ?, 'guardian', ?)").bind("g_diag", "local-guardian@example.com", now).run();
  await env.DB.prepare("INSERT INTO guardian (id, email, role, created_at) VALUES (?, ?, 'guardian', ?)").bind("g_other", "other@example.com", now).run();
  await env.DB.prepare("INSERT INTO session (id, guardian_id, expires_at, created_at) VALUES (?, ?, ?, ?)").bind("s_diag", "g_diag", future, now).run();
  await env.DB.prepare("INSERT INTO session (id, guardian_id, expires_at, created_at) VALUES (?, ?, ?, ?)").bind("s_other", "g_other", future, now).run();
};

describe("protected audio catalog (003a Task 6)", () => {
  beforeEach(seed);

  it("rejects unauthenticated requests", async () => {
    const res = await SELF.fetch("https://api.test/guardian/audio-catalog");
    expect(res.status).toBe(401);
  });

  it("rejects authenticated non-diag guardians", async () => {
    const res = await SELF.fetch("https://api.test/guardian/audio-catalog", {
      headers: { cookie: "session=s_other" }
    });
    expect(res.status).toBe(403);
  });

  it("serves the full 44/12 inventory with review metadata to the diag guardian", async () => {
    const res = await SELF.fetch("https://api.test/guardian/audio-catalog", {
      headers: { cookie: "session=s_diag" }
    });
    expect(res.status).toBe(200);
    const body = await res.json<{
      sounds: { sound_id: string; recording_guidance: string; reviews: unknown[] }[];
      patterns: { mapping_id: string; grapheme: string; sound_ids: string[] }[];
    }>();
    expect(body.sounds.length).toBe(44);
    expect(body.patterns.length).toBe(12);
    // Protected metadata is present: guidance + the checksum-bound review lane.
    for (const sound of body.sounds) {
      expect(sound.recording_guidance.length).toBeGreaterThan(0);
      expect(Array.isArray(sound.reviews)).toBe(true);
    }
    expect(body.patterns.map((p) => p.grapheme)).toContain("sh");
  });

  it("keeps reviewer metadata out of the public runtime manifest", () => {
    // The catalog is the ONLY surface for review records; the public manifest
    // (content/audio/manifest.json, served to browsers) must never leak them.
    const serialized = JSON.stringify(publicManifest);
    expect(serialized).not.toContain("reviewer");
    expect(serialized).not.toContain("reviews");
    expect(serialized).not.toContain("notes");
    expect(serialized).not.toContain("recording_guidance");
  });
});

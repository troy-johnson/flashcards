import { beforeEach, describe, expect, it } from "vitest";
import { env, SELF } from "cloudflare:test";
import { resetFoundationDb } from "../test/reset-db";
import publicManifest from "../../../content/audio/manifest.json";
import {
  audioCatalogRoutes,
  computeProtectedReviewSubject,
  toProtectedSoundView,
  toRuntimePlaybackUrl,
  type ProtectedSoundView,
} from "./audio-catalog";
import type { Env } from "../types";

const seed = async () => {
  await resetFoundationDb();
  const now = new Date().toISOString();
  const future = new Date(Date.now() + 60_000).toISOString();
  await env.DB.prepare("INSERT INTO guardian (id, email, role, created_at) VALUES (?, ?, 'guardian', ?)").bind("g_diag", "local-guardian@example.com", now).run();
  await env.DB.prepare("INSERT INTO guardian (id, email, role, created_at) VALUES (?, ?, 'guardian', ?)").bind("g_other", "other@example.com", now).run();
  await env.DB.prepare("INSERT INTO session (id, guardian_id, expires_at, created_at) VALUES (?, ?, ?, ?)").bind("s_diag", "g_diag", future, now).run();
  await env.DB.prepare("INSERT INTO session (id, guardian_id, expires_at, created_at) VALUES (?, ?, ?, ?)").bind("s_other", "g_other", future, now).run();
};

const catalogRequest = (configuredEmail: string | undefined, cookie?: string) => {
  const bindings = { ...env } as Env;
  if (configuredEmail === undefined) {
    delete (bindings as Partial<Env>).DIAG_GUARDIAN_EMAIL;
  } else {
    bindings.DIAG_GUARDIAN_EMAIL = configuredEmail;
  }
  return audioCatalogRoutes.request(
    "https://api.test/",
    cookie ? { headers: { cookie } } : undefined,
    bindings
  );
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

  it.each([
    { label: "matching", configuredEmail: "local-guardian@example.com", cookie: "session=s_diag", expected: 200 },
    { label: "non-matching", configuredEmail: "other@example.com", cookie: "session=s_diag", expected: 403 },
    { label: "missing", configuredEmail: undefined, cookie: "session=s_diag", expected: 403 },
    { label: "blank", configuredEmail: "   ", cookie: "session=s_diag", expected: 403 },
    { label: "no session", configuredEmail: "local-guardian@example.com", cookie: undefined, expected: 401 }
  ])("returns $expected for $label operator configuration", async ({ configuredEmail, cookie, expected }) => {
    const response = await catalogRequest(configuredEmail, cookie);
    expect(response.status).toBe(expected);
  });

  it("serves the full 44/12 inventory with review metadata to the diag guardian", async () => {
    const res = await SELF.fetch("https://api.test/guardian/audio-catalog", {
      headers: { cookie: "session=s_diag" }
    });
    expect(res.status).toBe(200);
    const body = (await res.json()) as {
      sounds: { sound_id: string; recording_guidance: string; reviews: unknown[] }[];
      patterns: { mapping_id: string; grapheme: string; sound_ids: string[] }[];
    };
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

  it("maps canonical source media to the staged runtime URL for catalog playback", async () => {
    expect(toRuntimePlaybackUrl("/audio/sound_short_a.m4a")).toBe(
      "/audio/generated/sound_short_a.m4a"
    );
    expect(toRuntimePlaybackUrl(undefined)).toBeUndefined();
    expect(toRuntimePlaybackUrl("/audio/generated/sound_short_a.m4a")).toBeUndefined();
    expect(toRuntimePlaybackUrl("/audio/../private.m4a")).toBeUndefined();

    const sound: ProtectedSoundView = {
      sound_id: "sound_short_a",
      instructional_label: "ă",
      ipa: "/æ/",
      example_word: "apple",
      phonetic_class: "front vowel",
      production_behavior: "sustain",
      production_notes: "Short front vowel.",
      dialect_notes: "Varies by dialect.",
      recording_guidance: "Record in isolation.",
      processing_profile: "standard_vowel",
      playback_url: "/audio/sound_short_a.m4a",
      reviews: [],
    };
    expect((await toProtectedSoundView(sound)).runtime_playback_url).toBeUndefined();
    expect((await toProtectedSoundView({ ...sound, playback_sha256: "a".repeat(64) })).runtime_playback_url).toBe(
      "/audio/generated/sound_short_a.m4a"
    );
  });

  it("marks only a current checksum-bound SLP approval as releasable", async () => {
    const sound: ProtectedSoundView = {
      sound_id: "sound_short_a",
      instructional_label: "ă",
      ipa: "/æ/",
      example_word: "apple",
      phonetic_class: "front vowel",
      production_behavior: "sustain",
      production_notes: "Short front vowel.",
      dialect_notes: "Varies by dialect.",
      recording_guidance: "Record in isolation.",
      processing_profile: "standard_vowel",
      playback_url: "/audio/sound_short_a.m4a",
      playback_sha256: "a".repeat(64),
      reviews: [],
    };
    const subject = await computeProtectedReviewSubject(sound);
    const approved = await toProtectedSoundView({
      ...sound,
      reviews: [{
        kind: "slp",
        reviewer: "slp-reviewer",
        reviewed_at: "2026-07-14T00:00:00Z",
        status: "approved",
        subject_sha256: subject,
      }],
    });
    expect(approved.slp_approved).toBe(true);

    const stale = await toProtectedSoundView({
      ...sound,
      playback_sha256: "b".repeat(64),
      reviews: approved.reviews,
    });
    expect(stale.slp_approved).toBe(false);

    const objected = await toProtectedSoundView({
      ...sound,
      reviews: [...approved.reviews, {
        kind: "slp",
        reviewer: "slp-reviewer",
        reviewed_at: "2026-07-14T00:01:00Z",
        status: "changes_requested",
        subject_sha256: subject,
      }],
    });
    expect(objected.slp_approved).toBe(false);
  });
});

import { join } from "node:path";
import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  loadAudioSources,
  validateAudioSources,
  checkAudioCardinality,
  resolvePlaybackPath,
  computeReviewSubject,
  type AudioSources,
  type InstructionalSound,
} from "./audio-schema.ts";

const root = process.cwd();

describe("loadAudioSources", () => {
  it("loads 44 sounds and 12 patterns from content/audio", () => {
    const sources = loadAudioSources(join(root, "content"));
    assert.equal(sources.sounds.length, 44);
    assert.equal(sources.patterns.length, 12);
  });

  it("sounds cover all four production behaviors", () => {
    const sources = loadAudioSources(join(root, "content"));
    const behaviors = new Set(sources.sounds.map((s) => s.production_behavior));
    assert.deepEqual(behaviors, new Set(["clip", "sustain", "glide", "sequence"]));
  });

  it("mapping_grapheme_qu references sound_k and sound_w", () => {
    const sources = loadAudioSources(join(root, "content"));
    const patternById = Object.fromEntries(sources.patterns.map((p) => [p.mapping_id, p]));
    assert.deepEqual(patternById["mapping_grapheme_qu"]?.sound_ids, ["sound_k", "sound_w"]);
  });

  it("mapping_grapheme_th references both th sounds", () => {
    const sources = loadAudioSources(join(root, "content"));
    const patternById = Object.fromEntries(sources.patterns.map((p) => [p.mapping_id, p]));
    assert.deepEqual(patternById["mapping_grapheme_th"]?.sound_ids, [
      "sound_th_unvoiced",
      "sound_th_voiced",
    ]);
  });
});

describe("validateAudioSources", () => {
  it("returns empty errors for the canonical production files", () => {
    const sources = loadAudioSources(join(root, "content"));
    const errors = validateAudioSources(sources);
    assert.deepEqual(errors, []);
  });

  it("rejects duplicate sound IDs", () => {
    const sources = loadAudioSources(join(root, "content"));
    const dup: AudioSources = {
      sounds: [sources.sounds[0]!, sources.sounds[0]!],
      patterns: [],
    };
    const errors = validateAudioSources(dup);
    assert.ok(errors.some((e) => e.includes("duplicate")));
  });

  it("rejects duplicate mapping IDs", () => {
    const sources = loadAudioSources(join(root, "content"));
    const dup: AudioSources = {
      sounds: sources.sounds,
      patterns: [sources.patterns[0]!, sources.patterns[0]!],
    };
    const errors = validateAudioSources(dup);
    assert.ok(errors.some((e) => e.includes("duplicate")));
  });

  it("rejects a pattern with an unresolved sound reference", () => {
    const sources = loadAudioSources(join(root, "content"));
    const bad: AudioSources = {
      sounds: sources.sounds,
      patterns: [
        {
          mapping_id: "mapping_grapheme_xx",
          grapheme: "xx",
          sound_ids: ["sound_nonexistent"],
          example_word: "test",
          note: "",
        },
      ],
    };
    const errors = validateAudioSources(bad);
    assert.ok(errors.some((e) => e.includes("sound_nonexistent")));
  });

  it("rejects a sound with an unknown production_behavior", () => {
    const sources = loadAudioSources(join(root, "content"));
    const bad: AudioSources = {
      sounds: [
        {
          ...sources.sounds[0]!,
          sound_id: "sound_fake",
          // @ts-expect-error intentional bad value
          production_behavior: "explode",
        },
      ],
      patterns: [],
    };
    const errors = validateAudioSources(bad);
    assert.ok(errors.some((e) => e.includes("production_behavior")));
  });

  it("rejects a sound missing dialect_notes", () => {
    const sources = loadAudioSources(join(root, "content"));
    const bad: AudioSources = {
      sounds: [
        {
          ...sources.sounds[0]!,
          sound_id: "sound_fake2",
          // @ts-expect-error intentional bad value
          dialect_notes: undefined,
        },
      ],
      patterns: [],
    };
    const errors = validateAudioSources(bad);
    assert.ok(errors.some((e) => e.includes("dialect_notes")));
  });

  it("rejects a sound with an empty required string field (e.g. ipa)", () => {
    const sources = loadAudioSources(join(root, "content"));
    const bad: AudioSources = {
      sounds: [{ ...sources.sounds[0]!, sound_id: "sound_fake3", ipa: "  " }],
      patterns: [],
    };
    const errors = validateAudioSources(bad);
    assert.ok(errors.some((e) => e.includes("ipa must be a non-empty string")));
  });

  it("rejects a sound whose reviews field is not an array", () => {
    const sources = loadAudioSources(join(root, "content"));
    const bad: AudioSources = {
      // @ts-expect-error intentional bad value
      sounds: [{ ...sources.sounds[0]!, sound_id: "sound_fake4", reviews: "nope" }],
      patterns: [],
    };
    const errors = validateAudioSources(bad);
    assert.ok(errors.some((e) => e.includes("reviews must be an array")));
  });

  it("rejects a pattern whose grapheme is outside the canonical 12", () => {
    const sources = loadAudioSources(join(root, "content"));
    const bad: AudioSources = {
      sounds: sources.sounds,
      patterns: [
        {
          mapping_id: "mapping_grapheme_xx",
          grapheme: "xx",
          sound_ids: ["sound_short_a"],
          example_word: "test",
          note: "x",
        },
      ],
    };
    const errors = validateAudioSources(bad);
    assert.ok(errors.some((e) => e.includes('unknown grapheme "xx"')));
  });

  it("rejects a pattern with an empty sound_ids array", () => {
    const sources = loadAudioSources(join(root, "content"));
    const bad: AudioSources = {
      sounds: sources.sounds,
      patterns: [
        { mapping_id: "mapping_grapheme_sh", grapheme: "sh", sound_ids: [], example_word: "ship", note: "x" },
      ],
    };
    const errors = validateAudioSources(bad);
    assert.ok(errors.some((e) => e.includes("sound_ids must be a non-empty array")));
  });

  it("rejects a review record missing reviewer / reviewed_at and with a bad kind", () => {
    const sources = loadAudioSources(join(root, "content"));
    const bad: AudioSources = {
      sounds: [
        {
          ...sources.sounds[0]!,
          sound_id: "sound_fake5",
          reviews: [
            // @ts-expect-error intentional bad shape
            { kind: "wizard", status: "approved", subject_sha256: "abc" },
          ],
        },
      ],
      patterns: [],
    };
    const errors = validateAudioSources(bad);
    assert.ok(errors.some((e) => e.includes("reviews[0].kind")));
    assert.ok(errors.some((e) => e.includes("reviews[0].reviewer")));
    assert.ok(errors.some((e) => e.includes("reviews[0].reviewed_at")));
  });

  it("does not throw on malformed sound_ids or missing reviews (returns errors instead)", () => {
    const bad = {
      sounds: [{ sound_id: "sound_x" } as unknown as InstructionalSound],
      // @ts-expect-error intentional malformed shape
      patterns: [{ mapping_id: "mapping_grapheme_sh", grapheme: "sh", example_word: "ship", note: "x" }],
    } as AudioSources;
    assert.doesNotThrow(() => validateAudioSources(bad));
    const errors = validateAudioSources(bad);
    assert.ok(errors.some((e) => e.includes("sound_ids must be a non-empty array")));
    assert.ok(errors.some((e) => e.includes("reviews must be an array")));
  });
});

describe("checkAudioCardinality", () => {
  it("returns no errors when counts match", () => {
    const sources = loadAudioSources(join(root, "content"));
    assert.deepEqual(checkAudioCardinality(sources, 44, 12), []);
  });

  it("reports a too-small sound inventory", () => {
    const sources = loadAudioSources(join(root, "content"));
    const short: AudioSources = { sounds: sources.sounds.slice(0, 43), patterns: sources.patterns };
    const errors = checkAudioCardinality(short, 44, 12);
    assert.ok(errors.some((e) => e.includes("expected 44 sounds") && e.includes("found 43")));
  });

  it("reports a wrong pattern count", () => {
    const sources = loadAudioSources(join(root, "content"));
    const short: AudioSources = { sounds: sources.sounds, patterns: sources.patterns.slice(0, 11) };
    const errors = checkAudioCardinality(short, 44, 12);
    assert.ok(errors.some((e) => e.includes("expected 12 patterns") && e.includes("found 11")));
  });
});

describe("resolvePlaybackPath", () => {
  const base = "/tmp/content";

  it("resolves a normal /audio/ url under audio/playback", () => {
    assert.equal(
      resolvePlaybackPath(base, "/audio/sound_short_a.mp3"),
      join(base, "audio/playback", "sound_short_a.mp3")
    );
  });

  it("returns null when the url does not start with /audio/", () => {
    assert.equal(resolvePlaybackPath(base, "https://evil.example/x.mp3"), null);
    assert.equal(resolvePlaybackPath(base, "audio/x.mp3"), null);
  });

  it("returns null for a path-traversal url that escapes the playback dir", () => {
    assert.equal(resolvePlaybackPath(base, "/audio/../../../etc/passwd"), null);
    assert.equal(resolvePlaybackPath(base, "/audio/"), null);
  });
});

describe("computeReviewSubject", () => {
  it("returns a deterministic hex string", () => {
    const sources = loadAudioSources(join(root, "content"));
    const sound = sources.sounds[0]!;
    const subject1 = computeReviewSubject(sound);
    const subject2 = computeReviewSubject(sound);
    assert.equal(subject1, subject2);
    assert.match(subject1, /^[0-9a-f]{64}$/);
  });

  it("changes when production_notes change", () => {
    const sources = loadAudioSources(join(root, "content"));
    const sound = sources.sounds[0]!;
    const original = computeReviewSubject(sound);
    const modified = computeReviewSubject({ ...sound, production_notes: "different notes" });
    assert.notEqual(original, modified);
  });

  it("does not change when only reviews change", () => {
    const sources = loadAudioSources(join(root, "content"));
    const sound = sources.sounds[0]!;
    const withNoReviews = computeReviewSubject({ ...sound, reviews: [] });
    const withFakeReview = computeReviewSubject({
      ...sound,
      reviews: [
        {
          kind: "owner",
          reviewer: "troy",
          reviewed_at: "2026-01-01T00:00:00Z",
          status: "approved",
          subject_sha256: "abc",
        },
      ],
    });
    assert.equal(withNoReviews, withFakeReview);
  });
});

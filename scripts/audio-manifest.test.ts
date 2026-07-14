import assert from "node:assert/strict";
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, it } from "node:test";
import { computeFileSha256, computeReviewSubject, type InstructionalSound } from "./audio-schema.ts";
import {
  checkPublicManifest,
  projectPublicManifest,
  projectStagedManifest,
} from "./audio-manifest.ts";
import { stageAudioAssets, stageAudioAssetsChecked } from "./audio-stage.ts";

const makeSound = (overrides: Partial<InstructionalSound> = {}): InstructionalSound => {
  const sound: InstructionalSound = {
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
    playback_url: "/audio/sound_short_a.mp3",
    playback_sha256: "0".repeat(64),
    reviews: [],
    ...overrides,
  };
  return sound;
};

const approve = (sound: InstructionalSound): InstructionalSound => ({
  ...sound,
  reviews: [
    {
      kind: "recorder",
      reviewer: "recorder",
      reviewed_at: "2026-06-30T00:00:00Z",
      status: "approved",
      subject_sha256: computeReviewSubject(sound),
    },
    {
      kind: "owner",
      reviewer: "owner",
      reviewed_at: "2026-06-30T00:01:00Z",
      status: "approved",
      subject_sha256: computeReviewSubject(sound),
    },
    {
      kind: "slp",
      reviewer: "slp-reviewer",
      reviewed_at: "2026-06-30T00:02:00Z",
      status: "approved",
      subject_sha256: computeReviewSubject(sound),
    },
  ],
});

const withTempRoot = (fn: (root: string) => void) => {
  const root = mkdtempSync(join(tmpdir(), "audio-manifest-"));
  try {
    fn(root);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
};

describe("projectPublicManifest", () => {
  it("projects source playback_url to a staged /audio/generated/ runtime URL", () => {
    const approved = approve(makeSound());
    const pending = makeSound({ sound_id: "sound_short_e" });

    assert.deepEqual(projectPublicManifest([approved]), {
      schema_version: 2,
      audio: [
        {
          audio_id: approved.sound_id,
          src: "/audio/generated/sound_short_a.mp3",
          sha256: approved.playback_sha256,
        },
      ],
    });
    assert.deepEqual(projectPublicManifest([pending]), {
      schema_version: 2,
      audio: [],
    });
  });

  it("rejects a playback_url that is already a generated runtime URL", () => {
    assert.throws(
      () => projectPublicManifest([approve(makeSound({ playback_url: "/audio/generated/x.mp3" }))]),
      /playback_url must be a source \/audio\/ path \(not \/audio\/generated\/\)/
    );
  });

  it("requires current recorder, owner, and SLP approvals", () => {
    const sound = makeSound();
    const subject = computeReviewSubject(sound);
    const slpOnly = {
      ...sound,
      reviews: [{
        kind: "slp" as const,
        reviewer: "slp-reviewer",
        reviewed_at: "2026-06-30T00:00:00Z",
        status: "approved" as const,
        subject_sha256: subject,
      }],
    };

    assert.deepEqual(projectPublicManifest([slpOnly]).audio, []);
    assert.equal(projectPublicManifest([approve(sound)]).audio.length, 1);
  });

  it("uses the last current review per kind so objections revoke and later approval resolves", () => {
    const approved = approve(makeSound());
    const subject = computeReviewSubject(approved);
    const objected = {
      ...approved,
      reviews: [...approved.reviews, {
        kind: "slp" as const,
        reviewer: "slp-reviewer",
        reviewed_at: "2026-06-30T00:03:00Z",
        status: "changes_requested" as const,
        subject_sha256: subject,
      }],
    };
    const resolved = {
      ...objected,
      reviews: [...objected.reviews, {
        kind: "slp" as const,
        reviewer: "slp-reviewer",
        reviewed_at: "2026-06-30T00:04:00Z",
        status: "approved" as const,
        subject_sha256: subject,
      }],
    };

    assert.deepEqual(projectPublicManifest([objected]).audio, []);
    assert.equal(projectPublicManifest([resolved]).audio.length, 1);
  });

  it("sorts learner-facing entries by sound_id", () => {
    const b = approve(makeSound({ sound_id: "sound_b", playback_url: "/audio/b.mp3" }));
    const a = approve(makeSound({ sound_id: "sound_a", playback_url: "/audio/a.mp3" }));

    assert.deepEqual(projectPublicManifest([b, a]).audio.map((entry) => entry.audio_id), [
      "sound_a",
      "sound_b",
    ]);
  });

  it("rejects unsafe public URLs and duplicate URLs", () => {
    assert.throws(
      () => projectPublicManifest([approve(makeSound({ playback_url: "audio/foo.mp3" }))]),
      /playback_url must be origin-rooted under \/audio\//
    );
    assert.throws(
      () => projectPublicManifest([approve(makeSound({ playback_url: "/audio/../foo.mp3" }))]),
      /playback_url must be a safe \/audio\/ path/
    );

    const one = approve(makeSound({ sound_id: "sound_one", playback_url: "/audio/dup.mp3" }));
    const two = approve(makeSound({ sound_id: "sound_two", playback_url: "/audio/dup.mp3" }));
    assert.throws(() => projectPublicManifest([one, two]), /duplicate public audio URL/);
  });
});

describe("projectStagedManifest", () => {
  it("includes recorded candidates before SLP approval without changing the public manifest", () => {
    const pending = makeSound();

    assert.deepEqual(projectStagedManifest([pending]), {
      schema_version: 2,
      audio: [
        {
          audio_id: pending.sound_id,
          src: "/audio/generated/sound_short_a.mp3",
          sha256: pending.playback_sha256,
        },
      ],
    });
    assert.deepEqual(projectPublicManifest([pending]).audio, []);
  });

  it("sorts recorded candidates and excludes sounds without playback media", () => {
    const b = makeSound({ sound_id: "sound_b", playback_url: "/audio/b.mp3" });
    const a = makeSound({ sound_id: "sound_a", playback_url: "/audio/a.mp3" });
    const missing = makeSound({ sound_id: "sound_missing", playback_url: undefined, playback_sha256: undefined });

    assert.deepEqual(projectStagedManifest([b, missing, a]).audio.map((entry) => entry.audio_id), [
      "sound_a",
      "sound_b",
    ]);
  });
});

describe("checkPublicManifest", () => {
  it("rejects stale generated JSON", () => {
    withTempRoot((root) => {
      mkdirSync(join(root, "content/audio"), { recursive: true });
      writeFileSync(join(root, "content/audio/sounds.json"), `${JSON.stringify([], null, 2)}\n`);
      writeFileSync(join(root, "content/audio/patterns.json"), `${JSON.stringify([], null, 2)}\n`);
      writeFileSync(
        join(root, "content/audio/manifest.json"),
        `${JSON.stringify({ schema_version: 2, audio: [{ audio_id: "stale", src: "/audio/generated/stale.mp3", sha256: "0".repeat(64) }] }, null, 2)}\n`
      );

      assert.throws(() => checkPublicManifest(root), /content\/audio\/manifest\.json is stale/);
    });
  });
});

describe("stageAudioAssets", () => {
  it("recreates an empty generated directory when no audio is approved", () => {
    withTempRoot((root) => {
      mkdirSync(join(root, "content/audio/playback"), { recursive: true });
      mkdirSync(join(root, "app/public/audio/generated"), { recursive: true });
      writeFileSync(join(root, "app/public/audio/generated/stale.mp3"), "stale");
      writeFileSync(join(root, "content/audio/manifest.json"), `${JSON.stringify({ schema_version: 2, audio: [] }, null, 2)}\n`);

      stageAudioAssets(root);

      assert.deepEqual(readFileSync(join(root, "content/audio/manifest.json"), "utf8"), "{\n  \"schema_version\": 2,\n  \"audio\": []\n}\n");
      assert.throws(() => readFileSync(join(root, "app/public/audio/generated/stale.mp3")));
    });
  });

  it("copies staged playback assets and verifies their SHA-256", () => {
    withTempRoot((root) => {
      mkdirSync(join(root, "content/audio/playback"), { recursive: true });
      const playbackPath = join(root, "content/audio/playback/sound_short_a.mp3");
      writeFileSync(playbackPath, "fake-mp3-bytes");
      const sha256 = computeFileSha256(playbackPath);
      writeFileSync(
        join(root, "content/audio/manifest.json"),
        `${JSON.stringify({ schema_version: 2, audio: [{ audio_id: "sound_short_a", src: "/audio/generated/sound_short_a.mp3", sha256 }] }, null, 2)}\n`
      );

      stageAudioAssets(root);

      assert.equal(readFileSync(join(root, "app/public/audio/generated/sound_short_a.mp3"), "utf8"), "fake-mp3-bytes");
    });
  });
});

describe("stageAudioAssetsChecked", () => {
  it("refuses to stage when the generated manifest is stale", () => {
    withTempRoot((root) => {
      mkdirSync(join(root, "content/audio/playback"), { recursive: true });
      writeFileSync(join(root, "content/audio/sounds.json"), `${JSON.stringify([], null, 2)}\n`);
      writeFileSync(join(root, "content/audio/patterns.json"), `${JSON.stringify([], null, 2)}\n`);
      // Manifest claims an entry the projection (empty sounds) would not emit.
      writeFileSync(
        join(root, "content/audio/manifest.json"),
        `${JSON.stringify({ schema_version: 2, audio: [{ audio_id: "stale", src: "/audio/generated/stale.mp3", sha256: "0".repeat(64) }] }, null, 2)}\n`
      );

      assert.throws(() => stageAudioAssetsChecked(root), /content\/audio\/manifest\.json is stale/);
    });
  });

  it("stages when the manifest is fresh", () => {
    withTempRoot((root) => {
      mkdirSync(join(root, "content/audio/playback"), { recursive: true });
      writeFileSync(join(root, "content/audio/sounds.json"), `${JSON.stringify([], null, 2)}\n`);
      writeFileSync(join(root, "content/audio/patterns.json"), `${JSON.stringify([], null, 2)}\n`);
      writeFileSync(join(root, "content/audio/manifest.json"), `${JSON.stringify({ schema_version: 2, audio: [] }, null, 2)}\n`);

      assert.doesNotThrow(() => stageAudioAssetsChecked(root));
    });
  });

  it("stages a recorded pending candidate for protected catalog QA", () => {
    withTempRoot((root) => {
      const playbackPath = join(root, "content/audio/playback/sound_short_a.mp3");
      mkdirSync(join(root, "content/audio/playback"), { recursive: true });
      writeFileSync(playbackPath, "candidate-mp3-bytes");
      const sound = makeSound({ playback_sha256: computeFileSha256(playbackPath) });
      writeFileSync(join(root, "content/audio/sounds.json"), `${JSON.stringify([sound], null, 2)}\n`);
      writeFileSync(join(root, "content/audio/patterns.json"), `${JSON.stringify([], null, 2)}\n`);
      writeFileSync(join(root, "content/audio/manifest.json"), `${JSON.stringify({ schema_version: 2, audio: [] }, null, 2)}\n`);

      stageAudioAssetsChecked(root);

      assert.equal(
        readFileSync(join(root, "app/public/audio/generated/sound_short_a.mp3"), "utf8"),
        "candidate-mp3-bytes"
      );
    });
  });
});

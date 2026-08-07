import { execFileSync } from "node:child_process";
import { copyFileSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import assert from "node:assert/strict";
import { afterEach, beforeEach, describe, it } from "node:test";
import { checkManifestMigration } from "./manifest-migration.ts";
import { computeReviewSubject, computeFileSha256, type InstructionalSound } from "./audio-schema.ts";

const root = process.cwd();
const productionManifest = readFileSync(join(root, "content/manifest.json"), "utf8");
const productionAudioManifest = readFileSync(join(root, "content/audio/manifest.json"), "utf8");
const productionSounds = readFileSync(join(root, "content/audio/sounds.json"), "utf8");
const productionPatterns = readFileSync(join(root, "content/audio/patterns.json"), "utf8");
const productionSkills = readFileSync(join(root, "content/skills.json"), "utf8");
const productionScope = readFileSync(join(root, "content/scope-sequence.json"), "utf8");
const productionItems = readFileSync(join(root, "content/items/seed.json"), "utf8");
let contentRoot = "";
let manifestPath = "";
let audioManifestPath = "";
let soundsPath = "";
let patternsPath = "";
let skillsPath = "";
let scopePath = "";
let itemsPath = "";
let decodabilityMapPath = "";

const createTempContentRoot = () => {
  const tempContentRoot = mkdtempSync(join(tmpdir(), "content-validate-"));
  mkdirSync(join(tempContentRoot, "items"));
  mkdirSync(join(tempContentRoot, "audio"));
  mkdirSync(join(tempContentRoot, "audio/masters"));
  mkdirSync(join(tempContentRoot, "audio/playback"));
  writeFileSync(join(tempContentRoot, "manifest.json"), productionManifest);
  writeFileSync(join(tempContentRoot, "audio/manifest.json"), productionAudioManifest);
  writeFileSync(join(tempContentRoot, "audio/sounds.json"), productionSounds);
  writeFileSync(join(tempContentRoot, "audio/patterns.json"), productionPatterns);
  const sounds = JSON.parse(productionSounds) as Array<{ sound_id: string }>;
  for (const sound of sounds) {
    copyFileSync(
      join(root, "content/audio/masters", `${sound.sound_id}.wav`),
      join(tempContentRoot, "audio/masters", `${sound.sound_id}.wav`)
    );
    copyFileSync(
      join(root, "content/audio/playback", `${sound.sound_id}.m4a`),
      join(tempContentRoot, "audio/playback", `${sound.sound_id}.m4a`)
    );
  }
  writeFileSync(join(tempContentRoot, "skills.json"), productionSkills);
  writeFileSync(join(tempContentRoot, "scope-sequence.json"), productionScope);
  writeFileSync(join(tempContentRoot, "items/seed.json"), productionItems);
  return tempContentRoot;
};

const resetTempContentRoot = () => {
  contentRoot = createTempContentRoot();
  manifestPath = join(contentRoot, "manifest.json");
  audioManifestPath = join(contentRoot, "audio/manifest.json");
  soundsPath = join(contentRoot, "audio/sounds.json");
  patternsPath = join(contentRoot, "audio/patterns.json");
  skillsPath = join(contentRoot, "skills.json");
  scopePath = join(contentRoot, "scope-sequence.json");
  itemsPath = join(contentRoot, "items/seed.json");
  decodabilityMapPath = join(contentRoot, "decodability-map.json");
};

const removeTempContentRoot = () => {
  rmSync(contentRoot, { recursive: true, force: true });
};

const writeRawSkills = (skills: unknown[]) => {
  writeFileSync(skillsPath, `${JSON.stringify(skills, null, 2)}\n`);
};

const writeSkills = (skills: unknown[]) => {
  writeRawSkills(
    skills.map((skill) => ({
      display_name: "Test skill",
      guardian_description: "A plain-language description for families.",
      ...(skill as Record<string, unknown>)
    }))
  );
};

const writeScopeSequence = (units: unknown[]) => {
  writeFileSync(scopePath, `${JSON.stringify(units, null, 2)}\n`);
};

const writeItems = (items: unknown[]) => {
  writeFileSync(itemsPath, `${JSON.stringify(items, null, 2)}\n`);
};

const writeDecodabilityMap = (entries: unknown[]) => {
  writeFileSync(decodabilityMapPath, `${JSON.stringify(entries, null, 2)}\n`);
};

const runValidator = () =>
  execFileSync(process.execPath, ["--import", "tsx", "scripts/content-validate.ts"], {
    cwd: root,
    encoding: "utf8",
    env: { ...process.env, CONTENT_VALIDATE_CONTENT_ROOT: contentRoot },
    stdio: ["ignore", "pipe", "pipe"]
  });

const runValidatorWithEnv = (extra: Record<string, string>) =>
  execFileSync(process.execPath, ["--import", "tsx", "scripts/content-validate.ts"], {
    cwd: root,
    encoding: "utf8",
    env: { ...process.env, CONTENT_VALIDATE_CONTENT_ROOT: contentRoot, ...extra },
    stdio: ["ignore", "pipe", "pipe"]
  });

const writeManifest = (
  categories: Record<string, { v1_target: number; required_now: number }>,
  schemaVersion = 2
) => {
  writeFileSync(
    manifestPath,
    `${JSON.stringify(
      {
        schema_version: schemaVersion,
        phase: "phase_a",
        categories
      },
      null,
      2
    )}\n`
  );
};

const writeAudioManifest = (audio: Record<string, unknown>[]) => {
  writeFileSync(audioManifestPath, `${JSON.stringify({ audio }, null, 2)}\n`);
};

// Writes a fake playback file under the temp content root's audio/playback dir
// and returns its real sha256, so byte-level media verification has a real file
// to check.
const writePlaybackFile = (relName: string, bytes: string): string => {
  const dir = join(contentRoot, "audio/playback");
  mkdirSync(dir, { recursive: true });
  const filePath = join(dir, relName);
  writeFileSync(filePath, bytes);
  return computeFileSha256(filePath);
};

const writeMasterFile = (relName: string, bytes: string): string => {
  const dir = join(contentRoot, "audio/masters");
  mkdirSync(dir, { recursive: true });
  const filePath = join(dir, relName);
  writeFileSync(filePath, bytes);
  return computeFileSha256(filePath);
};

const ttsAudioEntries = [
  { audio_id: "tts_word_mat", tts_fallback: true },
  { audio_id: "tts_word_the", tts_fallback: true },
  { audio_id: "tts_sentence_sam_sat", tts_fallback: true }
];

const validCategories = {
  phonics_skills: { v1_target: 12, required_now: 12 },
  heart_words: { v1_target: 50, required_now: 50 },
  decodable_words: { v1_target: 200, required_now: 200 },
  fluency_sentences: { v1_target: 30, required_now: 30 },
  recorded_sound_targets: { v1_target: 44, required_now: 0 },
  grapheme_pattern_mappings: { v1_target: 12, required_now: 12 }
};

describe("content manifest count gate", () => {
  beforeEach(resetTempContentRoot);
  afterEach(removeTempContentRoot);

  const withCanonicalSkillMetadata = () =>
    (JSON.parse(productionSkills) as Record<string, unknown>[]).map((skill) => ({
      ...skill,
      display_name: `Display name for ${String(skill.skill_id)}`,
      guardian_description: `Description for ${String(skill.skill_id)}.`
    }));

  for (const field of ["display_name", "guardian_description"] as const) {
    for (const invalidValue of [undefined, "", "   "] as const) {
      const caseName =
        invalidValue === undefined ? "missing" : invalidValue === "" ? "empty" : "whitespace-only";

      for (const retainedState of ["live", "deprecated"] as const) {
        it(`rejects a retained ${retainedState} skill whose ${field} is ${caseName}`, () => {
          const skills = withCanonicalSkillMetadata();
          const target =
            retainedState === "live"
              ? skills[0]!
              : {
                  skill_id: "phonics_k_retired",
                  grade: "K",
                  prerequisites: [],
                  deprecated: true,
                  display_name: "Retired skill",
                  guardian_description: "A retained historical skill."
                };
          if (retainedState === "deprecated") skills.push(target);
          if (invalidValue === undefined) delete target[field];
          else target[field] = invalidValue;
          writeRawSkills(skills);

          assert.throws(
            runValidator,
            new RegExp(`skill ${String(target.skill_id)} requires nonblank ${field}`)
          );
        });
      }
    }
  }

  const withCanonicalPaInstructions = () => {
    const items = JSON.parse(productionItems) as Record<string, unknown>[];
    for (const item of items) {
      if (typeof item.item_id === "string" && item.item_id.startsWith("pa_") && !item.deprecated) {
        item.guardian_script = "Say the sounds slowly.";
        item.student_task = "Put the sounds together and say the word.";
        item.answer = "at";
      }
    }
    return items;
  };

  for (const field of ["guardian_script", "student_task", "answer"] as const) {
    for (const invalidValue of [undefined, "", "   "] as const) {
      const caseName = invalidValue === undefined ? "missing" : invalidValue === "" ? "empty" : "whitespace-only";

      it(`rejects every live pa_ item whose ${field} is ${caseName}`, () => {
        const livePaItems = withCanonicalPaInstructions().filter(
          (item) => typeof item.item_id === "string" && item.item_id.startsWith("pa_") && !item.deprecated
        );
        assert.ok(livePaItems.length > 0, "expected at least one live canonical PA item");

        for (const target of livePaItems) {
          const items = withCanonicalPaInstructions();
          const invalidItem = items.find((item) => item.item_id === target.item_id);
          assert.ok(invalidItem, `expected fixture for ${String(target.item_id)}`);
          if (invalidValue === undefined) delete invalidItem[field];
          else invalidItem[field] = invalidValue;
          writeItems(items);

          assert.throws(
            runValidator,
            new RegExp(`item ${String(target.item_id)} requires nonblank ${field}`)
          );
        }
      });
    }
  }

  it("accepts a live pa_ item with a prompt and all canonical instruction fields", () => {
    writeItems(withCanonicalPaInstructions());

    assert.match(runValidator(), /\[content-validate\] ok:/);
  });

  it("does not require canonical instruction fields on non-PA or deprecated PA items", () => {
    const items = withCanonicalPaInstructions();
    items.push({
      item_id: "pa_k_u1_retired",
      skill_id: "pa_k_u1_blend_two_sound",
      prompt: "Retired prompt.",
      deprecated: true
    });
    writeItems(items);

    assert.match(runValidator(), /\[content-validate\] ok:/);
  });

  it("can validate an injected content root without using production content files", () => {
    writeSkills([{ skill_id: "phonics_temp", grade: "K", prerequisites: [] }]);
    writeScopeSequence([{ unit_id: "k_temp", grade: "K", skill_ids: ["phonics_temp"] }]);
    writeItems([]);
    writeManifest({
      phonics_skills: { v1_target: 12, required_now: 2 },
      heart_words: { v1_target: 50, required_now: 0 },
      decodable_words: { v1_target: 200, required_now: 0 },
      fluency_sentences: { v1_target: 30, required_now: 0 },
      recorded_sound_targets: { v1_target: 44, required_now: 0 },
      grapheme_pattern_mappings: { v1_target: 12, required_now: 0 }
    });
    writeAudioManifest([]);

    assert.throws(runValidator, /phonics_skills requires at least 2, found 1/);
  });

  it("fails when a decodable word uses graphemes not introduced before its skill", () => {
    writeSkills([{ skill_id: "phonics_k_u1_short_a", grade: "K", prerequisites: [] }]);
    writeScopeSequence([{ unit_id: "k_u1", grade: "K", skill_ids: ["phonics_k_u1_short_a"] }]);
    writeItems([{ item_id: "phonics_k_u1_bad", skill_id: "phonics_k_u1_short_a", text: "bat" }]);
    writeAudioManifest([]);
    writeDecodabilityMap([{ skill_id: "phonics_k_u1_short_a", graphemes: ["a", "t"] }]);
    writeManifest({
      phonics_skills: { v1_target: 12, required_now: 1 },
      heart_words: { v1_target: 50, required_now: 0 },
      decodable_words: { v1_target: 200, required_now: 1 },
      fluency_sentences: { v1_target: 30, required_now: 0 },
      recorded_sound_targets: { v1_target: 44, required_now: 0 },
      grapheme_pattern_mappings: { v1_target: 12, required_now: 0 }
    });

    assert.throws(runValidator, /phonics_k_u1_bad uses untaught grapheme b/);
  });

  it("fails when a word uses a later-declared digraph even though its letters were introduced", () => {
    writeSkills([
      { skill_id: "phonics_k_u1_consonants", grade: "K", prerequisites: [] },
      { skill_id: "phonics_k_u2_digraph_sh", grade: "K", prerequisites: [] }
    ]);
    writeScopeSequence([
      { unit_id: "k_u1", grade: "K", skill_ids: ["phonics_k_u1_consonants"] },
      { unit_id: "k_u2", grade: "K", skill_ids: ["phonics_k_u2_digraph_sh"] }
    ]);
    writeItems([{ item_id: "phonics_k_u1_ship", skill_id: "phonics_k_u1_consonants", text: "ship" }]);
    writeAudioManifest([]);
    writeDecodabilityMap([
      { skill_id: "phonics_k_u1_consonants", graphemes: ["s", "h", "i", "p"] },
      { skill_id: "phonics_k_u2_digraph_sh", graphemes: ["sh"] }
    ]);
    writeManifest({
      phonics_skills: { v1_target: 12, required_now: 2 },
      heart_words: { v1_target: 50, required_now: 0 },
      decodable_words: { v1_target: 200, required_now: 1 },
      fluency_sentences: { v1_target: 30, required_now: 0 },
      recorded_sound_targets: { v1_target: 44, required_now: 0 },
      grapheme_pattern_mappings: { v1_target: 12, required_now: 0 }
    });

    assert.throws(runValidator, /phonics_k_u1_ship uses untaught grapheme sh/);
  });

  it("accepts a digraph once the skill introduces it", () => {
    writeSkills([{ skill_id: "phonics_k_u2_digraph_sh", grade: "K", prerequisites: [] }]);
    writeScopeSequence([{ unit_id: "k_u2", grade: "K", skill_ids: ["phonics_k_u2_digraph_sh"] }]);
    writeItems([{ item_id: "phonics_k_u2_ship", skill_id: "phonics_k_u2_digraph_sh", text: "ship" }]);
    writeAudioManifest([]);
    writeDecodabilityMap([{ skill_id: "phonics_k_u2_digraph_sh", graphemes: ["sh", "i", "p"] }]);
    writeManifest({
      phonics_skills: { v1_target: 12, required_now: 1 },
      heart_words: { v1_target: 50, required_now: 0 },
      decodable_words: { v1_target: 200, required_now: 1 },
      fluency_sentences: { v1_target: 30, required_now: 0 },
      recorded_sound_targets: { v1_target: 44, required_now: 0 },
      grapheme_pattern_mappings: { v1_target: 12, required_now: 0 }
    });

    assert.match(runValidator(), /\[content-validate\] ok:/);
  });

  it("fails when authored content is below the manifest minimum", () => {
    writeItems(
      JSON.parse(productionItems).filter(
        (item: { item_id: string }) => item.item_id !== "phonics_1_u1_short_e_u_yum"
      )
    );
    writeManifest({
      phonics_skills: { v1_target: 12, required_now: 12 },
      heart_words: { v1_target: 50, required_now: 1 },
      decodable_words: { v1_target: 200, required_now: 200 },
      fluency_sentences: { v1_target: 30, required_now: 1 },
      recorded_sound_targets: { v1_target: 44, required_now: 0 },
      grapheme_pattern_mappings: { v1_target: 12, required_now: 0 }
    });

    assert.throws(
      runValidator,
      /decodable_words requires at least 200, found 199/
    );
  });

  it("rejects a tts_ audio reference on an item with no text/prompt to synthesize", () => {
    // Regression for the over-broad tts_ exemption: a tts_* id must have
    // synthesizable text, not merely the tts_ prefix. Production content no
    // longer carries tts_ audio_ids (003a Task 5 moved TTS to speech_text),
    // so inject one onto a production item and strip its text so only this
    // gate fires.
    const items = JSON.parse(productionItems) as {
      item_id: string;
      audio_id?: string;
      text?: string;
      prompt?: string;
    }[];
    const target = items.find((item) => item.item_id === "phonics_k_u1_short_a_mat");
    assert.ok(target, "expected the production short-a exemplar item");
    target!.audio_id = "tts_word_mat";
    delete target!.text;
    delete target!.prompt;
    writeItems(items);

    assert.throws(
      runValidator,
      new RegExp(`${target!.item_id} references TTS audio ${target!.audio_id} but has no text/prompt`)
    );
  });

  it("rejects a malformed bare \"tts_\" audio_id with no suffix", () => {
    const items = JSON.parse(productionItems) as { item_id: string; audio_id?: string }[];
    const target = items.find((item) => item.item_id === "phonics_k_u1_short_a_mat");
    assert.ok(target, "expected the production short-a exemplar item");
    target!.audio_id = "tts_";
    writeItems(items);

    assert.throws(runValidator, /has a malformed TTS audio_id "tts_" with no suffix/);
  });

  it("accepts a tts_ item whose text is blank but whose prompt is synthesizable", () => {
    // A blank `text` must not shadow a real `prompt`: the predicate uses the
    // first NON-empty of the two, not the first defined one.
    const items = JSON.parse(productionItems) as {
      item_id: string;
      audio_id?: string;
      text?: string;
      prompt?: string;
    }[];
    const target = items.find((item) => item.item_id === "phonics_k_u1_short_a_mat");
    assert.ok(target, "expected the production short-a exemplar item");
    target!.audio_id = "tts_word_mat";
    target!.text = "   ";
    target!.prompt = "say the word";
    writeItems(items);

    assert.match(runValidator(), /\[content-validate\] ok:/);
  });

  it("fails when the manifest categories do not exactly match the expected keys", () => {
    const { phonics_skills: _phonicsSkills, ...categoriesWithMissingKey } = validCategories;

    writeManifest({
      ...categoriesWithMissingKey,
      phonics_skill: { v1_target: 12, required_now: 2 }
    });

    assert.throws(
      runValidator,
      /manifest categories must include exactly: phonics_skills, heart_words, decodable_words, fluency_sentences, recorded_sound_targets, grapheme_pattern_mappings/
    );
  });

  it("rejects a manifest that still includes the legacy phoneme_digraph_audio category", () => {
    // The legacy category is no longer one of the exactly-six v2 categories, so a
    // manifest carrying it (here alongside the v2 set) is rejected by the
    // exact-categories gate, which lists the required v2 category names.
    writeManifest({
      ...validCategories,
      phoneme_digraph_audio: { v1_target: 56, required_now: 0 }
    });

    assert.throws(runValidator, /recorded_sound_targets.*grapheme_pattern_mappings/);
  });

  it("accepts a complete schema v2 manifest", () => {
    writeManifest(validCategories, 2);

    assert.match(runValidator(), /\[content-validate\] ok:/);
  });

  it("rejects a manifest whose schema_version is not 2", () => {
    writeManifest(validCategories, 1);

    assert.throws(runValidator, /schema_version must be 2, found 1/);
  });

  it("recorded_sound_targets counts 0 when no sounds have SLP-approved media", () => {
    // The canonical sounds.json has candidate media but no SLP approvals yet,
    // so the count must be 0 regardless of required_now being 0 as well.
    writeManifest({
      ...validCategories,
      recorded_sound_targets: { v1_target: 44, required_now: 0 }
    });

    assert.match(runValidator(), /\[content-validate\] ok:/);
  });

  it("recorded_sound_targets gate fires when required_now exceeds SLP-approved count", () => {
    // With no SLP approvals in sounds.json, requiring even 1 should fail.
    writeManifest({
      ...validCategories,
      recorded_sound_targets: { v1_target: 44, required_now: 1 }
    });

    assert.throws(
      runValidator,
      /recorded_sound_targets requires at least 1, found 0/
    );
  });

  it("recorded_sound_targets counts valid media with current recorder, owner, and SLP approvals", () => {
    // Build a minimal sounds.json with one sound that has media and an SLP
    // approval whose subject_sha256 matches the current computeReviewSubject.
    // Verifies the positive path including the anti-staleness hash check.
    const playbackSha = writePlaybackFile("sound_short_a.mp3", "fake-mp3-bytes");
    const approvedSound: InstructionalSound = {
      sound_id: "sound_short_a",
      instructional_label: "ă",
      ipa: "/æ/",
      example_word: "apple",
      phonetic_class: "front vowel",
      production_behavior: "sustain",
      production_notes: "Short front vowel.",
      dialect_notes: "Varies.",
      recording_guidance: "Record in isolation.",
      processing_profile: "standard_vowel",
      playback_url: "/audio/sound_short_a.mp3",
      playback_sha256: playbackSha,
      reviews: [],
    };
    const subject = computeReviewSubject(approvedSound);
    approvedSound.reviews = [
      {
        kind: "recorder",
        reviewer: "recorder",
        reviewed_at: "2026-01-01T00:00:00Z",
        status: "approved",
        subject_sha256: subject,
      },
      {
        kind: "owner",
        reviewer: "owner",
        reviewed_at: "2026-01-01T00:01:00Z",
        status: "approved",
        subject_sha256: subject,
      },
      {
        kind: "slp",
        reviewer: "slp-reviewer",
        reviewed_at: "2026-01-01T00:02:00Z",
        status: "approved",
        subject_sha256: subject,
      },
    ];
    writeFileSync(soundsPath, JSON.stringify([approvedSound], null, 2));
    writeFileSync(patternsPath, JSON.stringify([], null, 2));
    writeManifest({
      ...validCategories,
      recorded_sound_targets: { v1_target: 44, required_now: 1 },
      grapheme_pattern_mappings: { v1_target: 12, required_now: 0 },
    });

    assert.match(runValidator(), /\[content-validate\] ok:/);
  });

  it("recorded_sound_targets ignores an SLP approval with a stale subject_sha256", () => {
    // Same setup but the review records a different subject_sha256 — simulating
    // an approval recorded against older guidance or different audio bytes.
    const playbackSha = writePlaybackFile("sound_short_a.mp3", "fake-mp3-bytes");
    const sound: InstructionalSound = {
      sound_id: "sound_short_a",
      instructional_label: "ă",
      ipa: "/æ/",
      example_word: "apple",
      phonetic_class: "front vowel",
      production_behavior: "sustain",
      production_notes: "Short front vowel.",
      dialect_notes: "Varies.",
      recording_guidance: "Record in isolation.",
      processing_profile: "standard_vowel",
      playback_url: "/audio/sound_short_a.mp3",
      playback_sha256: playbackSha,
      reviews: [
        {
          kind: "recorder",
          reviewer: "recorder",
          reviewed_at: "2026-01-01T00:00:00Z",
          status: "approved",
          subject_sha256: "stale-hash-does-not-match",
        },
        {
          kind: "owner",
          reviewer: "owner",
          reviewed_at: "2026-01-01T00:01:00Z",
          status: "approved",
          subject_sha256: "stale-hash-does-not-match",
        },
        {
          kind: "slp",
          reviewer: "slp-reviewer",
          reviewed_at: "2026-01-01T00:02:00Z",
          status: "approved",
          subject_sha256: "stale-hash-does-not-match",
        },
      ],
    };
    writeFileSync(soundsPath, JSON.stringify([sound], null, 2));
    writeFileSync(patternsPath, JSON.stringify([], null, 2));
    writeManifest({
      ...validCategories,
      recorded_sound_targets: { v1_target: 44, required_now: 1 },
      grapheme_pattern_mappings: { v1_target: 12, required_now: 0 },
    });

    assert.throws(
      runValidator,
      /recorded_sound_targets requires at least 1, found 0/
    );
  });

  it("rejects declared playback media when the file does not exist", () => {
    const sound = {
      sound_id: "sound_short_a",
      instructional_label: "ă",
      ipa: "/æ/",
      example_word: "apple",
      phonetic_class: "front vowel",
      production_behavior: "sustain",
      production_notes: "Short front vowel.",
      dialect_notes: "Varies.",
      recording_guidance: "Record in isolation.",
      processing_profile: "standard_vowel",
      playback_url: "/audio/sound_short_a.mp3",
      playback_sha256: "deadbeef",
      reviews: [],
    };
    writeFileSync(soundsPath, JSON.stringify([sound], null, 2));
    writeFileSync(patternsPath, JSON.stringify([], null, 2));
    writeManifest(validCategories);

    assert.throws(runValidator, /audio media: sound_short_a playback file not found/);
  });

  it("rejects declared playback media when the sha256 does not match the file bytes", () => {
    writePlaybackFile("sound_short_a.mp3", "real-bytes");
    const sound = {
      sound_id: "sound_short_a",
      instructional_label: "ă",
      ipa: "/æ/",
      example_word: "apple",
      phonetic_class: "front vowel",
      production_behavior: "sustain",
      production_notes: "Short front vowel.",
      dialect_notes: "Varies.",
      recording_guidance: "Record in isolation.",
      processing_profile: "standard_vowel",
      playback_url: "/audio/sound_short_a.mp3",
      playback_sha256: "0000000000000000000000000000000000000000000000000000000000000000",
      reviews: [],
    };
    writeFileSync(soundsPath, JSON.stringify([sound], null, 2));
    writeFileSync(patternsPath, JSON.stringify([], null, 2));
    writeManifest(validCategories);

    assert.throws(runValidator, /audio media: sound_short_a playback_sha256 does not match/);
  });

  it("rejects a playback_url that attempts path traversal", () => {
    const sound = {
      sound_id: "sound_short_a",
      instructional_label: "ă",
      ipa: "/æ/",
      example_word: "apple",
      phonetic_class: "front vowel",
      production_behavior: "sustain",
      production_notes: "Short front vowel.",
      dialect_notes: "Varies.",
      recording_guidance: "Record in isolation.",
      processing_profile: "standard_vowel",
      playback_url: "/audio/../../../etc/passwd",
      playback_sha256: "deadbeef",
      reviews: [],
    };
    writeFileSync(soundsPath, JSON.stringify([sound], null, 2));
    writeFileSync(patternsPath, JSON.stringify([], null, 2));
    writeManifest(validCategories);

    assert.throws(runValidator, /audio media: sound_short_a playback_url must be a safe path/);
  });

  it("rejects declared master media when the file does not exist", () => {
    const sound = {
      sound_id: "sound_short_a",
      instructional_label: "ă",
      ipa: "/æ/",
      example_word: "apple",
      phonetic_class: "front vowel",
      production_behavior: "sustain",
      production_notes: "Short front vowel.",
      dialect_notes: "Varies.",
      recording_guidance: "Record in isolation.",
      processing_profile: "standard_vowel",
      master_path: "missing-sound_short_a.wav",
      master_sha256: "deadbeef",
      reviews: [],
    };
    writeFileSync(soundsPath, JSON.stringify([sound], null, 2));
    writeFileSync(patternsPath, JSON.stringify([], null, 2));
    writeManifest(validCategories);

    assert.throws(runValidator, /audio media: sound_short_a master file not found/);
  });

  it("rejects declared master media when the sha256 does not match the file bytes", () => {
    writeMasterFile("sound_short_a.wav", "real-master-bytes");
    const sound = {
      sound_id: "sound_short_a",
      instructional_label: "ă",
      ipa: "/æ/",
      example_word: "apple",
      phonetic_class: "front vowel",
      production_behavior: "sustain",
      production_notes: "Short front vowel.",
      dialect_notes: "Varies.",
      recording_guidance: "Record in isolation.",
      processing_profile: "standard_vowel",
      master_path: "sound_short_a.wav",
      master_sha256: "0".repeat(64),
      reviews: [],
    };
    writeFileSync(soundsPath, JSON.stringify([sound], null, 2));
    writeFileSync(patternsPath, JSON.stringify([], null, 2));
    writeManifest(validCategories);

    assert.throws(runValidator, /audio media: sound_short_a master_sha256 does not match/);
  });

  it("rejects a master_path that attempts path traversal", () => {
    const sound = {
      sound_id: "sound_short_a",
      instructional_label: "ă",
      ipa: "/æ/",
      example_word: "apple",
      phonetic_class: "front vowel",
      production_behavior: "sustain",
      production_notes: "Short front vowel.",
      dialect_notes: "Varies.",
      recording_guidance: "Record in isolation.",
      processing_profile: "standard_vowel",
      master_path: "../sound_short_a.wav",
      master_sha256: "deadbeef",
      reviews: [],
    };
    writeFileSync(soundsPath, JSON.stringify([sound], null, 2));
    writeFileSync(patternsPath, JSON.stringify([], null, 2));
    writeManifest(validCategories);

    assert.throws(runValidator, /audio media: sound_short_a master_path must be a safe path/);
  });

  it("byte-verifies master media under a configured RW_AUDIO_MASTER_ROOT", () => {
    // Master WAVs may live outside the repo; the env override relocates the
    // byte-verification base. Place the master out-of-tree, attach it to a
    // production sound, and confirm resolution flips on the env var.
    const externalMasterRoot = mkdtempSync(join(tmpdir(), "master-root-"));
    try {
      const masterFile = join(externalMasterRoot, "external-sound_short_a.wav");
      writeFileSync(masterFile, "external-master-bytes");
      const masterSha = computeFileSha256(masterFile);

      const sounds = JSON.parse(productionSounds) as Record<string, unknown>[];
      for (const sound of sounds) {
        delete sound.master_path;
        delete sound.master_sha256;
      }
      sounds[0]!.master_path = "external-sound_short_a.wav";
      sounds[0]!.master_sha256 = masterSha;
      writeFileSync(soundsPath, JSON.stringify(sounds, null, 2));

      // Without the override the master resolves under content/audio/masters and
      // is not found; with it, byte-verification passes against the external root.
      assert.throws(runValidator, /master file not found under the master audio root/);
      assert.match(
        runValidatorWithEnv({ RW_AUDIO_MASTER_ROOT: externalMasterRoot }),
        /\[content-validate\] ok:/
      );
    } finally {
      rmSync(externalMasterRoot, { recursive: true, force: true });
    }
  });

  it("grapheme_pattern_mappings rejects patterns with unresolved sound_ids at schema validation", () => {
    // A pattern whose sound_ids reference a nonexistent sound is caught by
    // validateAudioSources before counting — the validator must hard-fail.
    writeFileSync(
      patternsPath,
      JSON.stringify([
        {
          mapping_id: "mapping_grapheme_sh",
          grapheme: "sh",
          sound_ids: ["sound_nonexistent"],
          example_word: "ship",
          note: "x"
        }
      ], null, 2)
    );
    writeManifest({
      ...validCategories,
      grapheme_pattern_mappings: { v1_target: 12, required_now: 0 }
    });

    assert.throws(
      runValidator,
      /audio schema: mapping_grapheme_sh: unresolved sound_id reference "sound_nonexistent"/
    );
  });

  it("grapheme_pattern_mappings rejects an empty sound_ids array at schema validation", () => {
    // A mapping with no sound_ids is meaningless and must hard-fail validation
    // rather than silently count as 0.
    writeFileSync(
      patternsPath,
      JSON.stringify([
        {
          mapping_id: "mapping_grapheme_sh",
          grapheme: "sh",
          sound_ids: [],
          example_word: "ship",
          note: "x"
        }
      ], null, 2)
    );
    writeManifest({
      ...validCategories,
      grapheme_pattern_mappings: { v1_target: 12, required_now: 0 }
    });

    assert.throws(
      runValidator,
      /audio schema: mapping_grapheme_sh: sound_ids must be a non-empty array/
    );
  });

  it("rejects an unknown grapheme outside the canonical 12", () => {
    writeFileSync(
      patternsPath,
      JSON.stringify([
        {
          mapping_id: "mapping_grapheme_xx",
          grapheme: "xx",
          sound_ids: ["sound_short_a"],
          example_word: "test",
          note: "x"
        }
      ], null, 2)
    );
    writeManifest({
      ...validCategories,
      grapheme_pattern_mappings: { v1_target: 12, required_now: 0 }
    });

    assert.throws(runValidator, /audio schema: mapping_grapheme_xx: unknown grapheme "xx"/);
  });

  it("passes when authored content meets the manifest minimum", () => {
    writeManifest(validCategories);

    assert.match(runValidator(), /\[content-validate\] ok:/);
  });

  it("does not count deprecated items toward manifest category totals", () => {
    // One live decodable + one deprecated decodable; a required_now of 2 must fail
    // because retired content cannot satisfy the content bar.
    writeSkills([{ skill_id: "phonics_k_u1_short_a", grade: "K", prerequisites: [] }]);
    writeScopeSequence([{ unit_id: "k_u1", grade: "K", skill_ids: ["phonics_k_u1_short_a"] }]);
    writeItems([
      { item_id: "phonics_k_u1_short_a_mat", skill_id: "phonics_k_u1_short_a", text: "mat" },
      { item_id: "phonics_k_u1_short_a_cat", skill_id: "phonics_k_u1_short_a", text: "mat", deprecated: true }
    ]);
    writeAudioManifest([]);
    writeManifest({
      phonics_skills: { v1_target: 12, required_now: 1 },
      heart_words: { v1_target: 50, required_now: 0 },
      decodable_words: { v1_target: 200, required_now: 2 },
      fluency_sentences: { v1_target: 30, required_now: 0 },
      recorded_sound_targets: { v1_target: 44, required_now: 0 },
      grapheme_pattern_mappings: { v1_target: 12, required_now: 0 }
    });

    assert.throws(runValidator, /decodable_words requires at least 2, found 1/);
  });

  it("fails when a skill has a prerequisite that appears in a later scope unit", () => {
    // skill_b (k_u2) lists skill_c (k_u3) as a prerequisite — prereq is later than skill.
    // The first-unit and grade-order checks do not catch this; only the cross-unit check does.
    writeSkills([
      { skill_id: "skill_a", grade: "K", prerequisites: [] },
      { skill_id: "skill_b", grade: "K", prerequisites: ["skill_c"] },
      { skill_id: "skill_c", grade: "K", prerequisites: [] }
    ]);
    writeScopeSequence([
      { unit_id: "k_u1", grade: "K", skill_ids: ["skill_a"] },
      { unit_id: "k_u2", grade: "K", skill_ids: ["skill_b"] },
      { unit_id: "k_u3", grade: "K", skill_ids: ["skill_c"] }
    ]);
    writeItems([]);
    writeManifest({
      phonics_skills: { v1_target: 12, required_now: 0 },
      heart_words: { v1_target: 50, required_now: 0 },
      decodable_words: { v1_target: 200, required_now: 0 },
      fluency_sentences: { v1_target: 30, required_now: 0 },
      recorded_sound_targets: { v1_target: 44, required_now: 0 },
      grapheme_pattern_mappings: { v1_target: 12, required_now: 0 }
    });
    writeAudioManifest([]);

    assert.throws(runValidator, /has prerequisite .+ from a later unit/);
  });

  it("fails when a grade-1 unit appears before a K unit in scope-sequence", () => {
    // The cross-unit prereq check relies on a global scope-array index that is only
    // sound if all K units precede all grade-1 units. Enforce that ordering explicitly:
    // here g1_u1 (grade 1) is listed before k_u1 (grade K), which must be rejected.
    writeSkills([
      { skill_id: "skill_k", grade: "K", prerequisites: [] },
      { skill_id: "skill_1", grade: "1", prerequisites: [] }
    ]);
    writeScopeSequence([
      { unit_id: "g1_u1", grade: "1", skill_ids: ["skill_1"] },
      { unit_id: "k_u1", grade: "K", skill_ids: ["skill_k"] }
    ]);
    writeItems([]);
    writeManifest({
      phonics_skills: { v1_target: 12, required_now: 0 },
      heart_words: { v1_target: 50, required_now: 0 },
      decodable_words: { v1_target: 200, required_now: 0 },
      fluency_sentences: { v1_target: 30, required_now: 0 },
      recorded_sound_targets: { v1_target: 44, required_now: 0 },
      grapheme_pattern_mappings: { v1_target: 12, required_now: 0 }
    });
    writeAudioManifest([]);

    assert.throws(runValidator, /K unit .+ appears after a grade-1 unit/);
  });

  it("rejects an unknown skill grade before grade-order checks run", () => {
    writeSkills([{ skill_id: "skill_unknown", grade: "2", prerequisites: [] }]);
    writeScopeSequence([{ unit_id: "k_u1", grade: "K", skill_ids: ["skill_unknown"] }]);
    writeItems([]);
    writeAudioManifest([]);
    writeManifest({
      phonics_skills: { v1_target: 12, required_now: 0 },
      heart_words: { v1_target: 50, required_now: 0 },
      decodable_words: { v1_target: 200, required_now: 0 },
      fluency_sentences: { v1_target: 30, required_now: 0 },
      recorded_sound_targets: { v1_target: 44, required_now: 0 },
      grapheme_pattern_mappings: { v1_target: 12, required_now: 0 }
    });

    assert.throws(runValidator, /skill skill_unknown has unknown grade 2/);
  });

  it("rejects an unknown scope-unit grade before grade-order checks run", () => {
    writeSkills([{ skill_id: "skill_k", grade: "K", prerequisites: [] }]);
    writeScopeSequence([{ unit_id: "u2", grade: "2", skill_ids: ["skill_k"] }]);
    writeItems([]);
    writeAudioManifest([]);
    writeManifest({
      phonics_skills: { v1_target: 12, required_now: 0 },
      heart_words: { v1_target: 50, required_now: 0 },
      decodable_words: { v1_target: 200, required_now: 0 },
      fluency_sentences: { v1_target: 30, required_now: 0 },
      recorded_sound_targets: { v1_target: 44, required_now: 0 },
      grapheme_pattern_mappings: { v1_target: 12, required_now: 0 }
    });

    assert.throws(runValidator, /scope unit u2 has unknown grade 2/);
  });

  it("accepts a valid K-then-grade-1 scope ordering", () => {
    writeSkills([
      { skill_id: "skill_k", grade: "K", prerequisites: [] },
      { skill_id: "skill_1", grade: "1", prerequisites: [] }
    ]);
    writeScopeSequence([
      { unit_id: "k_u1", grade: "K", skill_ids: ["skill_k"] },
      { unit_id: "g1_u1", grade: "1", skill_ids: ["skill_1"] }
    ]);
    writeItems([]);
    writeAudioManifest([]);
    writeManifest({
      phonics_skills: { v1_target: 12, required_now: 0 },
      heart_words: { v1_target: 50, required_now: 0 },
      decodable_words: { v1_target: 200, required_now: 0 },
      fluency_sentences: { v1_target: 30, required_now: 0 },
      recorded_sound_targets: { v1_target: 44, required_now: 0 },
      grapheme_pattern_mappings: { v1_target: 12, required_now: 0 }
    });

    assert.match(runValidator(), /\[content-validate\] ok:/);
  });
});

// The validator's on-branch immutability check (default content root, non-main
// branch, vs git main) cannot be reached by the subprocess tests above, which
// run against a temp content root. These exercise the extracted carve-out logic
// directly so its v1->v2 migration and non-decrease rules have real coverage.
describe("manifest migration carve-out", () => {
  const v1Main = {
    categories: {
      phonics_skills: { v1_target: 12, required_now: 12 },
      heart_words: { v1_target: 50, required_now: 50 },
      decodable_words: { v1_target: 200, required_now: 200 },
      fluency_sentences: { v1_target: 30, required_now: 30 },
      phoneme_digraph_audio: { v1_target: 56, required_now: 0 }
    }
  };
  const v2Head = {
    categories: {
      phonics_skills: { v1_target: 12, required_now: 12 },
      heart_words: { v1_target: 50, required_now: 50 },
      decodable_words: { v1_target: 200, required_now: 200 },
      fluency_sentences: { v1_target: 30, required_now: 30 },
      recorded_sound_targets: { v1_target: 44, required_now: 0 },
      grapheme_pattern_mappings: { v1_target: 12, required_now: 0 }
    }
  };

  it("permits the exact 56 -> 44 + 12 split", () => {
    assert.equal(checkManifestMigration(v1Main, v2Head), null);
  });

  it("rejects a split that is not exactly 44 and 12", () => {
    const wrong = {
      categories: {
        ...v2Head.categories,
        recorded_sound_targets: { v1_target: 40, required_now: 0 }
      }
    };
    assert.match(checkManifestMigration(v1Main, wrong) ?? "", /may only migrate to recorded_sound_targets \(44\) and grapheme_pattern_mappings \(12\)/);
  });

  it("rejects when the legacy target on main is not 56", () => {
    const oddMain = {
      categories: { ...v1Main.categories, phoneme_digraph_audio: { v1_target: 50, required_now: 0 } }
    };
    assert.match(checkManifestMigration(oddMain, v2Head) ?? "", /expected 56/);
  });

  it("rejects when the migration drops one of the new categories", () => {
    const { grapheme_pattern_mappings: _dropped, ...rest } = v2Head.categories;
    assert.match(checkManifestMigration(v1Main, { categories: rest }) ?? "", /may only migrate/);
  });

  it("once main is v2, applies the normal non-decrease rule and permits an unchanged manifest", () => {
    assert.equal(checkManifestMigration(v2Head, v2Head), null);
  });

  it("once main is v2, rejects lowering a v1_target", () => {
    const lowered = {
      categories: { ...v2Head.categories, recorded_sound_targets: { v1_target: 30, required_now: 0 } }
    };
    assert.match(checkManifestMigration(v2Head, lowered) ?? "", /below main's 44; v1 targets are immutable/);
  });

  it("flags a category present on main but missing on head", () => {
    const { heart_words: _gone, ...rest } = v2Head.categories;
    assert.match(checkManifestMigration(v2Head, { categories: rest }) ?? "", /heart_words present on main is missing on HEAD/);
  });
});

import { execFileSync } from "node:child_process";
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import assert from "node:assert/strict";
import { afterEach, beforeEach, describe, it } from "node:test";

const root = process.cwd();
const productionManifest = readFileSync(join(root, "content/manifest.json"), "utf8");
const productionAudioManifest = readFileSync(join(root, "content/audio/manifest.json"), "utf8");
const productionSkills = readFileSync(join(root, "content/skills.json"), "utf8");
const productionScope = readFileSync(join(root, "content/scope-sequence.json"), "utf8");
const productionItems = readFileSync(join(root, "content/items/seed.json"), "utf8");
let contentRoot = "";
let manifestPath = "";
let audioManifestPath = "";
let skillsPath = "";
let scopePath = "";
let itemsPath = "";
let decodabilityMapPath = "";

const createTempContentRoot = () => {
  const tempContentRoot = mkdtempSync(join(tmpdir(), "content-validate-"));
  mkdirSync(join(tempContentRoot, "items"));
  mkdirSync(join(tempContentRoot, "audio"));
  writeFileSync(join(tempContentRoot, "manifest.json"), productionManifest);
  writeFileSync(join(tempContentRoot, "audio/manifest.json"), productionAudioManifest);
  writeFileSync(join(tempContentRoot, "skills.json"), productionSkills);
  writeFileSync(join(tempContentRoot, "scope-sequence.json"), productionScope);
  writeFileSync(join(tempContentRoot, "items/seed.json"), productionItems);
  return tempContentRoot;
};

const resetTempContentRoot = () => {
  contentRoot = createTempContentRoot();
  manifestPath = join(contentRoot, "manifest.json");
  audioManifestPath = join(contentRoot, "audio/manifest.json");
  skillsPath = join(contentRoot, "skills.json");
  scopePath = join(contentRoot, "scope-sequence.json");
  itemsPath = join(contentRoot, "items/seed.json");
  decodabilityMapPath = join(contentRoot, "decodability-map.json");
};

const removeTempContentRoot = () => {
  rmSync(contentRoot, { recursive: true, force: true });
};

const writeSkills = (skills: unknown[]) => {
  writeFileSync(skillsPath, `${JSON.stringify(skills, null, 2)}\n`);
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

const writeManifest = (categories: Record<string, { v1_target: number; required_now: number }>) => {
  writeFileSync(
    manifestPath,
    `${JSON.stringify(
      {
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

const ttsAudioEntries = [
  { audio_id: "tts_word_mat", tts_fallback: true },
  { audio_id: "tts_word_the", tts_fallback: true },
  { audio_id: "tts_sentence_sam_sat", tts_fallback: true }
];

const validCategories = {
  phonics_skills: { v1_target: 12, required_now: 9 },
  heart_words: { v1_target: 50, required_now: 1 },
  decodable_words: { v1_target: 200, required_now: 1 },
  fluency_sentences: { v1_target: 30, required_now: 1 },
  phoneme_digraph_audio: { v1_target: 56, required_now: 0 }
};

describe("content manifest count gate", () => {
  beforeEach(resetTempContentRoot);
  afterEach(removeTempContentRoot);

  it("can validate an injected content root without using production content files", () => {
    writeSkills([{ skill_id: "phonics_temp", grade: "K", prerequisites: [] }]);
    writeScopeSequence([{ unit_id: "k_temp", grade: "K", skill_ids: ["phonics_temp"] }]);
    writeItems([]);
    writeManifest({
      phonics_skills: { v1_target: 12, required_now: 2 },
      heart_words: { v1_target: 50, required_now: 0 },
      decodable_words: { v1_target: 200, required_now: 0 },
      fluency_sentences: { v1_target: 30, required_now: 0 },
      phoneme_digraph_audio: { v1_target: 56, required_now: 0 }
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
      phoneme_digraph_audio: { v1_target: 56, required_now: 0 }
    });

    assert.throws(runValidator, /phonics_k_u1_bad uses untaught grapheme b/);
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
      phoneme_digraph_audio: { v1_target: 56, required_now: 0 }
    });

    assert.throws(
      runValidator,
      /decodable_words requires at least 200, found 199/
    );
  });

  it("fails when the manifest categories do not exactly match the expected keys", () => {
    const { phonics_skills: _phonicsSkills, ...categoriesWithMissingKey } = validCategories;

    writeManifest({
      ...categoriesWithMissingKey,
      phonics_skill: { v1_target: 12, required_now: 2 }
    });

    assert.throws(
      runValidator,
      /manifest categories must include exactly: phonics_skills, heart_words, decodable_words, fluency_sentences, phoneme_digraph_audio/
    );
  });

  it("counts only real phoneme and digraph assets for audio coverage", () => {
    writeManifest({
      ...validCategories,
      phoneme_digraph_audio: { v1_target: 56, required_now: 1 }
    });
    writeAudioManifest([
      ...ttsAudioEntries,
      { audio_id: "tts_word_cat_recorded", src: "audio/words/cat.mp3" },
      { audio_id: "phoneme_a", tts_fallback: true }
    ]);

    assert.throws(
      runValidator,
      /phoneme_digraph_audio requires at least 1, found 0/
    );

    writeAudioManifest([...ttsAudioEntries, { audio_id: "phoneme_a", src: "audio/phonemes/a.mp3" }]);

    assert.match(runValidator(), /\[content-validate\] ok:/);
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
      phoneme_digraph_audio: { v1_target: 56, required_now: 0 }
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
      phoneme_digraph_audio: { v1_target: 56, required_now: 0 }
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
      phoneme_digraph_audio: { v1_target: 56, required_now: 0 }
    });
    writeAudioManifest([]);

    assert.throws(runValidator, /K unit .+ appears after a grade-1 unit/);
  });
});

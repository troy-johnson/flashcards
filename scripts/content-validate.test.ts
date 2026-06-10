import { execFileSync } from "node:child_process";
import { existsSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import assert from "node:assert/strict";
import { afterEach, describe, it } from "node:test";

const root = process.cwd();
const manifestPath = join(root, "content/manifest.json");
const originalManifest = existsSync(manifestPath) ? readFileSync(manifestPath, "utf8") : null;

const restoreManifest = () => {
  if (originalManifest === null) {
    rmSync(manifestPath, { force: true });
    return;
  }
  writeFileSync(manifestPath, originalManifest);
};

const runValidator = () =>
  execFileSync(process.execPath, ["--import", "tsx", "scripts/content-validate.ts"], {
    cwd: root,
    encoding: "utf8",
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

const validCategories = {
  phonics_skills: { v1_target: 12, required_now: 2 },
  heart_words: { v1_target: 50, required_now: 1 },
  decodable_words: { v1_target: 200, required_now: 1 },
  fluency_sentences: { v1_target: 30, required_now: 1 },
  phoneme_digraph_audio: { v1_target: 56, required_now: 0 }
};

describe("content manifest count gate", () => {
  afterEach(restoreManifest);

  it("fails when authored content is below the manifest minimum", () => {
    writeManifest({
      phonics_skills: { v1_target: 12, required_now: 5 },
      heart_words: { v1_target: 50, required_now: 1 },
      decodable_words: { v1_target: 200, required_now: 1 },
      fluency_sentences: { v1_target: 30, required_now: 1 },
      phoneme_digraph_audio: { v1_target: 56, required_now: 0 }
    });

    assert.throws(
      runValidator,
      /phonics_skills requires at least 5, found 2/
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

  it("passes when authored content meets the manifest minimum", () => {
    writeManifest(validCategories);

    assert.match(runValidator(), /\[content-validate\] ok:/);
  });
});

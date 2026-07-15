import assert from "node:assert/strict";
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, it } from "node:test";
import { computeFileSha256 } from "./audio-schema.ts";
import type { PublicAudioManifest } from "./audio-manifest.ts";

type AudioDistCheckerModule = {
  checkAudioDistAgainstManifest(root: string, manifest: PublicAudioManifest): void;
};

const loadChecker = async (): Promise<AudioDistCheckerModule> => {
  const loaded = await import("./audio-dist-check.ts").catch(() => null);
  assert.ok(loaded, "audio distribution checker must exist");
  return loaded;
};

const withTempRoot = async (fn: (root: string) => Promise<void>) => {
  const root = mkdtempSync(join(tmpdir(), "audio-dist-check-"));
  try {
    await fn(root);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
};

const manifestFor = (audioId: string, filename: string, sha256: string): PublicAudioManifest => ({
  schema_version: 2,
  audio: [{ audio_id: audioId, src: `/audio/generated/${filename}`, sha256 }],
});

describe("audio distribution integrity", () => {
  it("accepts an exact generated distribution", async () => {
    await withTempRoot(async (root) => {
      const checker = await loadChecker();
      const output = join(root, "app/dist/audio/generated/sound_short_a.m4a");
      mkdirSync(join(root, "app/dist/audio/generated"), { recursive: true });
      writeFileSync(output, "approved bytes");

      assert.doesNotThrow(() =>
        checker.checkAudioDistAgainstManifest(
          root,
          manifestFor("sound_short_a", "sound_short_a.m4a", computeFileSha256(output))
        )
      );
    });
  });

  it("runs the distribution check after the app build in CI", () => {
    const packageJson = JSON.parse(readFileSync(join(process.cwd(), "package.json"), "utf8")) as {
      scripts?: Record<string, string>;
    };
    assert.equal(packageJson.scripts?.["audio:dist:check"], "tsx scripts/audio-dist-check.ts");

    const workflow = readFileSync(join(process.cwd(), ".github/workflows/ci.yml"), "utf8");
    const build = workflow.indexOf("- run: pnpm --filter app build");
    const distCheck = workflow.indexOf("- run: pnpm audio:dist:check");
    assert.ok(build >= 0, "CI must build the app before checking its distribution");
    assert.ok(distCheck > build, "CI must check audio distribution integrity after the app build");
  });

  it("rejects a missing generated file", async () => {
    await withTempRoot(async (root) => {
      const checker = await loadChecker();
      assert.throws(
        () => checker.checkAudioDistAgainstManifest(
          root,
          manifestFor("sound_short_a", "sound_short_a.m4a", "0".repeat(64))
        ),
        /sound_short_a: missing dist file/
      );
    });
  });

  it("rejects an extra generated file", async () => {
    await withTempRoot(async (root) => {
      const checker = await loadChecker();
      const generated = join(root, "app/dist/audio/generated");
      mkdirSync(generated, { recursive: true });
      writeFileSync(join(generated, "unexpected.m4a"), "extra bytes");

      assert.throws(
        () => checker.checkAudioDistAgainstManifest(root, { schema_version: 2, audio: [] }),
        /unexpected generated dist file: unexpected\.m4a/
      );
    });
  });

  it("rejects a hash-mismatched generated file", async () => {
    await withTempRoot(async (root) => {
      const checker = await loadChecker();
      const generated = join(root, "app/dist/audio/generated");
      mkdirSync(generated, { recursive: true });
      writeFileSync(join(generated, "sound_short_a.m4a"), "wrong bytes");

      assert.throws(
        () => checker.checkAudioDistAgainstManifest(
          root,
          manifestFor("sound_short_a", "sound_short_a.m4a", "0".repeat(64))
        ),
        /sound_short_a: dist sha256 does not match staged manifest/
      );
    });
  });
});

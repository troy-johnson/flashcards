import { cpSync, mkdirSync, readFileSync, rmSync } from "node:fs";
import { dirname, join, relative, resolve } from "node:path";
import {
  GENERATED_URL_PREFIX,
  computeFileSha256,
  loadAudioSources,
  resolvePlaybackPath,
} from "./audio-schema.ts";
import {
  checkPublicManifest,
  projectStagedManifest,
  type PublicAudioEntry,
  type StagedAudioManifest,
} from "./audio-manifest.ts";

type PublicAudioManifest = {
  schema_version: 2;
  audio: PublicAudioEntry[];
};

const readManifest = (root: string): PublicAudioManifest => {
  return JSON.parse(readFileSync(join(root, "content/audio/manifest.json"), "utf8")) as PublicAudioManifest;
};

const generatedRelativePath = (src: string): string => {
  if (!src.startsWith(GENERATED_URL_PREFIX)) {
    throw new Error(`public audio src must be staged under /audio/generated/: ${src}`);
  }
  const rel = src.slice(GENERATED_URL_PREFIX.length);
  if (rel.length === 0) throw new Error(`public audio src must include a filename: ${src}`);
  const normalized = relative("/", resolve("/", rel));
  if (normalized.startsWith("..")) throw new Error(`public audio src must be a safe generated path: ${src}`);
  return normalized;
};

const stageEntries = (root: string, entries: PublicAudioEntry[]): void => {
  const outputRoot = join(root, "app/public/audio/generated");

  rmSync(outputRoot, { recursive: true, force: true });
  mkdirSync(outputRoot, { recursive: true });

  for (const entry of entries) {
    const rel = generatedRelativePath(entry.src);
    const source = resolvePlaybackPath(join(root, "content"), `/audio/${rel}`);
    if (!source) throw new Error(`${entry.audio_id}: src must be a safe /audio/ path`);
    if (computeFileSha256(source) !== entry.sha256) {
      throw new Error(`${entry.audio_id}: sha256 does not match playback source bytes`);
    }

    const dest = join(outputRoot, rel);
    const relFromOutput = relative(outputRoot, dest);
    if (relFromOutput.startsWith("..")) {
      throw new Error(`${entry.audio_id}: staged path escapes generated directory`);
    }
    mkdirSync(dirname(dest), { recursive: true });
    cpSync(source, dest);
  }
};

export function stageAudioAssets(root = process.cwd()): void {
  const manifest = readManifest(root);
  stageEntries(root, manifest.audio);
}

/**
 * Stage every recorded, checksum-bound candidate for the protected catalog.
 * This deliberately does not change content/audio/manifest.json: that public
 * learner manifest remains restricted to current checksum-bound SLP approvals.
 */
export function stageStagedAudioAssets(root = process.cwd()): void {
  const manifest: StagedAudioManifest = projectStagedManifest(
    loadAudioSources(join(root, "content")).sounds
  );
  stageEntries(root, manifest.audio);
}

// Staging guarded by manifest freshness. Keeping the check in the entrypoint
// (not only in the `audio:stage` npm script's `&&` chain) means running this
// script directly — or any build path that reaches it — cannot publish a stale
// content/audio/manifest.json. stageAudioAssets stays pure for unit tests.
export function stageAudioAssetsChecked(root = process.cwd()): void {
  checkPublicManifest(root);
  stageStagedAudioAssets(root);
}

if (import.meta.url === `file://${process.argv[1]}`) {
  stageAudioAssetsChecked();
}

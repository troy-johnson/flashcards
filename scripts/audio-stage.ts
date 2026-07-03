import { cpSync, mkdirSync, readFileSync, rmSync } from "node:fs";
import { dirname, join, relative, resolve } from "node:path";
import { GENERATED_URL_PREFIX, computeFileSha256, resolvePlaybackPath } from "./audio-schema.ts";

type PublicAudioEntry = {
  audio_id: string;
  src: `/audio/${string}`;
  sha256: string;
};

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

export function stageAudioAssets(root = process.cwd()): void {
  const manifest = readManifest(root);
  const outputRoot = join(root, "app/public/audio/generated");

  rmSync(outputRoot, { recursive: true, force: true });
  mkdirSync(outputRoot, { recursive: true });

  for (const entry of manifest.audio) {
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
}

if (import.meta.url === `file://${process.argv[1]}`) {
  stageAudioAssets();
}

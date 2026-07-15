import { existsSync, readdirSync } from "node:fs";
import { join, relative, resolve, sep } from "node:path";
import { computeFileSha256, loadAudioSources } from "./audio-schema.ts";
import {
  projectStagedManifest,
  type PublicAudioManifest,
} from "./audio-manifest.ts";

const DIST_URL_PREFIX = "/audio/generated/";

const generatedRelativePath = (src: string): string => {
  if (!src.startsWith(DIST_URL_PREFIX)) {
    throw new Error(`staged audio src must be under ${DIST_URL_PREFIX}: ${src}`);
  }
  const path = src.slice(DIST_URL_PREFIX.length);
  const normalized = relative("/", resolve("/", path));
  if (!normalized || normalized.startsWith("..") || resolve("/", path) === "/") {
    throw new Error(`staged audio src must be a safe generated path: ${src}`);
  }
  return normalized;
};

const listFiles = (root: string, current = root): string[] => {
  if (!existsSync(current)) return [];
  const files: string[] = [];
  for (const entry of readdirSync(current, { withFileTypes: true })) {
    const absolute = join(current, entry.name);
    if (entry.isDirectory()) {
      files.push(...listFiles(root, absolute));
    } else if (entry.isFile()) {
      files.push(relative(root, absolute).split(sep).join("/"));
    } else {
      throw new Error(`unsupported generated dist entry: ${relative(root, absolute)}`);
    }
  }
  return files.sort();
};

export function checkAudioDistAgainstManifest(
  root: string,
  manifest: PublicAudioManifest
): void {
  const outputRoot = join(root, "app/dist/audio/generated");
  const expected = new Set<string>();

  for (const entry of manifest.audio) {
    const path = generatedRelativePath(entry.src);
    if (expected.has(path)) throw new Error(`duplicate generated dist path: ${path}`);
    expected.add(path);

    const output = resolve(outputRoot, path);
    const relFromOutput = relative(outputRoot, output);
    if (relFromOutput.startsWith("..") || resolve(outputRoot, relFromOutput) !== output) {
      throw new Error(`${entry.audio_id}: dist path escapes generated directory`);
    }
    if (!existsSync(output)) throw new Error(`${entry.audio_id}: missing dist file ${path}`);
    if (computeFileSha256(output) !== entry.sha256) {
      throw new Error(`${entry.audio_id}: dist sha256 does not match staged manifest`);
    }
  }

  for (const path of listFiles(outputRoot)) {
    if (!expected.has(path)) throw new Error(`unexpected generated dist file: ${path}`);
  }
}

export function checkAudioDist(root = process.cwd()): void {
  const sources = loadAudioSources(join(root, "content"));
  checkAudioDistAgainstManifest(root, projectStagedManifest(sources.sounds));
}

if (import.meta.url === `file://${process.argv[1]}`) {
  checkAudioDist();
}

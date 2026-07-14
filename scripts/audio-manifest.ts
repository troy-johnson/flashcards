import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import {
  computeReviewSubject,
  loadAudioSources,
  playbackUrlToGeneratedUrl,
  resolvePlaybackPath,
  type InstructionalSound,
} from "./audio-schema.ts";

export type PublicAudioEntry = {
  audio_id: string;
  src: `/audio/${string}`;
  sha256: string;
};

export type PublicAudioManifest = {
  schema_version: 2;
  audio: PublicAudioEntry[];
};

// This projection is used only while staging the protected catalog. It has the
// same runtime shape as the public manifest, but includes recorded candidates
// before SLP approval. The learner-facing manifest remains SLP-gated.
export type StagedAudioManifest = PublicAudioManifest;

const isApprovedForLearners = (sound: InstructionalSound): boolean => {
  if (!sound.playback_url || !sound.playback_sha256) return false;
  const currentSubject = computeReviewSubject(sound);
  return sound.reviews.some(
    (review) =>
      review.kind === "slp" &&
      review.status === "approved" &&
      review.subject_sha256 === currentSubject
  );
};

const assertSafePublicUrl = (src: string) => {
  if (!src.startsWith("/audio/")) {
    throw new Error(`playback_url must be origin-rooted under /audio/: ${src}`);
  }
  if (!resolvePlaybackPath("/__audio_manifest_validation__", src)) {
    throw new Error(`playback_url must be a safe /audio/ path: ${src}`);
  }
};

const projectMediaManifest = (
  sounds: InstructionalSound[],
  include: (sound: InstructionalSound) => boolean
): PublicAudioManifest => {
  const seenUrls = new Set<string>();
  const audio = sounds
    .filter(include)
    .sort((a, b) => a.sound_id.localeCompare(b.sound_id))
    .map((sound): PublicAudioEntry => {
      const source = sound.playback_url!;
      assertSafePublicUrl(source);
      const runtimeUrl = playbackUrlToGeneratedUrl(source);
      if (!runtimeUrl) {
        throw new Error(
          `playback_url must be a source /audio/ path (not /audio/generated/): ${source}`
        );
      }
      if (seenUrls.has(runtimeUrl)) throw new Error(`duplicate public audio URL: ${runtimeUrl}`);
      seenUrls.add(runtimeUrl);
      return {
        audio_id: sound.sound_id,
        src: runtimeUrl as `/audio/${string}`,
        sha256: sound.playback_sha256!,
      };
    });

  return { schema_version: 2, audio };
};

export function projectPublicManifest(sounds: InstructionalSound[]): PublicAudioManifest {
  return projectMediaManifest(sounds, isApprovedForLearners);
}

export function projectStagedManifest(sounds: InstructionalSound[]): StagedAudioManifest {
  return projectMediaManifest(
    sounds,
    (sound) => Boolean(sound.playback_url && sound.playback_sha256)
  );
}

export function formatPublicManifest(manifest: PublicAudioManifest): string {
  return `${JSON.stringify(manifest, null, 2)}\n`;
}

export function generatePublicManifest(root = process.cwd()): PublicAudioManifest {
  return projectPublicManifest(loadAudioSources(join(root, "content")).sounds);
}

export function writePublicManifest(root = process.cwd()): void {
  writeFileSync(
    join(root, "content/audio/manifest.json"),
    formatPublicManifest(generatePublicManifest(root))
  );
}

export function checkPublicManifest(root = process.cwd()): void {
  const manifestPath = join(root, "content/audio/manifest.json");
  const expected = formatPublicManifest(generatePublicManifest(root));
  const actual = existsSync(manifestPath) ? readFileSync(manifestPath, "utf8") : "";
  if (actual !== expected) {
    throw new Error("content/audio/manifest.json is stale; run pnpm audio:manifest");
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  if (process.argv.includes("--check")) {
    checkPublicManifest();
  } else {
    writePublicManifest();
  }
}

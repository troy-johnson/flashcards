import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { isAbsolute, join, relative, resolve } from "node:path";

export type ProductionBehavior = "clip" | "sustain" | "glide" | "sequence";
export type ReviewStatus = "approved" | "changes_requested";
export type ReviewKind = "recorder" | "owner" | "slp";

export type ReviewRecord = {
  kind: ReviewKind;
  reviewer: string;
  reviewed_at: string;
  status: ReviewStatus;
  subject_sha256: string;
  notes?: string;
};

export type InstructionalSound = {
  sound_id: string;
  instructional_label: string;
  ipa: string;
  example_word: string;
  phonetic_class: string;
  production_behavior: ProductionBehavior;
  production_notes: string;
  dialect_notes: string;
  recording_guidance: string;
  processing_profile: string;
  master_path?: string;
  master_sha256?: string;
  playback_url?: string;
  playback_sha256?: string;
  reviews: ReviewRecord[];
};

export type GraphemePatternMapping = {
  mapping_id: string;
  grapheme: string;
  sound_ids: string[];
  example_word: string;
  note: string;
};

export type AudioSources = {
  sounds: InstructionalSound[];
  patterns: GraphemePatternMapping[];
};

export function loadAudioSources(root: string): AudioSources {
  const sounds = JSON.parse(readFileSync(join(root, "audio/sounds.json"), "utf8")) as InstructionalSound[];
  const patterns = JSON.parse(readFileSync(join(root, "audio/patterns.json"), "utf8")) as GraphemePatternMapping[];
  return { sounds, patterns };
}

const VALID_BEHAVIORS = new Set<string>(["clip", "sustain", "glide", "sequence"]);

// Source-capture guidance profiles are used in content/audio/sounds.json for
// checksum-bound SLP review subjects.
const SOURCE_CAPTURE_PROCESSING_PROFILES = [
  "standard_vowel",
  "standard_consonant",
  "stop_clip",
  "affricate_clip",
  "glide_consonant"
] as const;

// Executable runtime encode profile versions — the single source of truth for
// these strings. scripts/audio-process.ts keys its profile registry off this
// list (not the other way round: this module must stay importable without
// node:child_process), so the schema allowlist and the encoder cannot drift.
// A version may appear in sounds.json once an approved take has been
// normalized for playback.
export const EXECUTABLE_PROCESSING_PROFILE_VERSIONS = ["rw-isolated-sound-v1"] as const;
export type ExecutableProcessingProfileVersion =
  (typeof EXECUTABLE_PROCESSING_PROFILE_VERSIONS)[number];

const VALID_PROCESSING_PROFILES = new Set<string>([
  ...SOURCE_CAPTURE_PROCESSING_PROFILES,
  ...EXECUTABLE_PROCESSING_PROFILE_VERSIONS
]);

// The 12 canonical grapheme patterns Reader's Way teaches. A mapping whose
// grapheme is not in this set is rejected — the inventory is closed, not
// open-ended. See docs/research/2026-06-21-audio-inventory-and-architecture-research.md.
const CANONICAL_GRAPHEMES = new Set<string>([
  "sh", "ch", "th", "wh", "ck", "ng", "qu", "ll", "ss", "ff", "zz", "ph"
]);

const REQUIRED_SOUND_STRING_FIELDS = [
  "sound_id",
  "instructional_label",
  "ipa",
  "example_word",
  "phonetic_class",
  "production_notes",
  "dialect_notes",
  "recording_guidance",
  "processing_profile"
] as const;
const OPTIONAL_MEDIA_STRING_FIELDS = [
  "master_path",
  "master_sha256",
  "playback_url",
  "playback_sha256"
] as const;
const REQUIRED_PATTERN_STRING_FIELDS = ["mapping_id", "grapheme", "example_word", "note"] as const;

const VALID_REVIEW_KINDS = new Set<string>(["recorder", "owner", "slp"]);
const VALID_REVIEW_STATUSES = new Set<string>(["approved", "changes_requested"]);

const isNonEmptyString = (value: unknown): value is string =>
  typeof value === "string" && value.trim().length > 0;

// Pure structural validation of the canonical audio sources. Returns a list of
// human-readable errors (empty == valid). Defensive against malformed JSON:
// missing/wrong-typed fields produce errors rather than throwing. Cardinality
// (exactly 44 sounds / 12 patterns) is enforced separately in content-validate
// against the manifest v1_targets, since this function also runs over subsets.
export function validateAudioSources(sources: AudioSources): string[] {
  const errors: string[] = [];

  const soundIds = new Set<string>();
  for (const sound of sources.sounds) {
    const row = (sound ?? {}) as Record<string, unknown>;
    const id = typeof row.sound_id === "string" ? row.sound_id : "(missing sound_id)";

    for (const field of REQUIRED_SOUND_STRING_FIELDS) {
      if (!isNonEmptyString(row[field])) {
        errors.push(`${id}: ${field} must be a non-empty string`);
      }
    }
    for (const field of OPTIONAL_MEDIA_STRING_FIELDS) {
      if (row[field] !== undefined && typeof row[field] !== "string") {
        errors.push(`${id}: ${field} must be a string when present`);
      }
    }
    if (!VALID_BEHAVIORS.has(row.production_behavior as string)) {
      errors.push(`${id}: invalid production_behavior "${row.production_behavior}"`);
    }
    if (isNonEmptyString(row.processing_profile) && !VALID_PROCESSING_PROFILES.has(row.processing_profile)) {
      errors.push(`${id}: invalid processing_profile "${row.processing_profile}"`);
    }
    if (!Array.isArray(row.reviews)) {
      errors.push(`${id}: reviews must be an array`);
    } else {
      row.reviews.forEach((review, i) => {
        const rec = (review ?? {}) as Record<string, unknown>;
        if (!VALID_REVIEW_KINDS.has(rec.kind as string)) {
          errors.push(`${id}: reviews[${i}].kind must be one of recorder|owner|slp`);
        }
        if (!VALID_REVIEW_STATUSES.has(rec.status as string)) {
          errors.push(`${id}: reviews[${i}].status must be one of approved|changes_requested`);
        }
        if (!isNonEmptyString(rec.reviewer)) {
          errors.push(`${id}: reviews[${i}].reviewer must be a non-empty string`);
        }
        if (!isNonEmptyString(rec.reviewed_at)) {
          errors.push(`${id}: reviews[${i}].reviewed_at must be a non-empty string`);
        }
        if (!isNonEmptyString(rec.subject_sha256)) {
          errors.push(`${id}: reviews[${i}].subject_sha256 must be a non-empty string`);
        }
        if (rec.notes !== undefined && typeof rec.notes !== "string") {
          errors.push(`${id}: reviews[${i}].notes must be a string when present`);
        }
      });
    }

    if (isNonEmptyString(row.sound_id)) {
      if (soundIds.has(row.sound_id)) errors.push(`duplicate sound_id: ${row.sound_id}`);
      soundIds.add(row.sound_id);
    }
  }

  const mappingIds = new Set<string>();
  for (const pattern of sources.patterns) {
    const row = (pattern ?? {}) as Record<string, unknown>;
    const id = typeof row.mapping_id === "string" ? row.mapping_id : "(missing mapping_id)";

    for (const field of REQUIRED_PATTERN_STRING_FIELDS) {
      if (!isNonEmptyString(row[field])) {
        errors.push(`${id}: ${field} must be a non-empty string`);
      }
    }
    if (isNonEmptyString(row.grapheme) && !CANONICAL_GRAPHEMES.has(row.grapheme)) {
      errors.push(`${id}: unknown grapheme "${row.grapheme}"`);
    }

    if (!Array.isArray(row.sound_ids) || row.sound_ids.length === 0) {
      errors.push(`${id}: sound_ids must be a non-empty array`);
    } else {
      for (const soundId of row.sound_ids) {
        if (!soundIds.has(soundId as string)) {
          errors.push(`${id}: unresolved sound_id reference "${soundId}"`);
        }
      }
    }

    if (isNonEmptyString(row.mapping_id)) {
      if (mappingIds.has(row.mapping_id)) errors.push(`duplicate mapping_id: ${row.mapping_id}`);
      mappingIds.add(row.mapping_id);
    }
  }

  return errors;
}

// Cardinality check, separate from validateAudioSources because that function
// also runs over subsets. Returns errors if the inventory size does not match
// the promised counts (the manifest v1_targets). Pure and directly unit-tested.
export function checkAudioCardinality(
  sources: AudioSources,
  expectedSounds: number,
  expectedPatterns: number
): string[] {
  const errors: string[] = [];
  if (sources.sounds.length !== expectedSounds) {
    errors.push(`expected ${expectedSounds} sounds (recorded_sound_targets v1_target), found ${sources.sounds.length}`);
  }
  if (sources.patterns.length !== expectedPatterns) {
    errors.push(`expected ${expectedPatterns} patterns (grapheme_pattern_mappings v1_target), found ${sources.patterns.length}`);
  }
  return errors;
}

export const PLAYBACK_URL_PREFIX = "/audio/";
export const GENERATED_URL_PREFIX = "/audio/generated/";

// Resolves a source playback_url ("/audio/<rel>") to its source-of-truth file
// under the content audio root (content/audio/playback/<rel>). Returns null if
// the url does not have the expected source shape OR if it would escape the
// playback directory (path traversal, e.g. "/audio/../../etc/passwd").
//
// This takes the SOURCE form only. A staged runtime URL ("/audio/generated/…")
// is a separate concern owned by the staging layer, which derives its own source
// rel; generatedUrlToPlaybackUrl provides the inverse mapping for any caller that
// starts from a runtime URL.
export function resolvePlaybackPath(contentRoot: string, playbackUrl: string): string | null {
  if (!playbackUrl.startsWith(PLAYBACK_URL_PREFIX)) return null;
  const rel = playbackUrl.slice(PLAYBACK_URL_PREFIX.length);
  if (rel.length === 0) return null;
  const base = resolve(join(contentRoot, "audio/playback"));
  const resolved = resolve(base, rel);
  const relFromBase = relative(base, resolved);
  if (relFromBase === "" || relFromBase.startsWith("..") || isAbsolute(relFromBase)) return null;
  return resolved;
}

// Maps a source playback_url ("/audio/<rel>") to its staged runtime URL
// ("/audio/generated/<rel>") — the single place the generated prefix is
// introduced. Rejects a url that is already runtime-shaped so a source path can
// never collapse to "/audio/generated/generated/…". Returns null for non-source
// shapes.
export function playbackUrlToGeneratedUrl(playbackUrl: string): string | null {
  if (!playbackUrl.startsWith(PLAYBACK_URL_PREFIX)) return null;
  if (playbackUrl.startsWith(GENERATED_URL_PREFIX)) return null;
  const rel = playbackUrl.slice(PLAYBACK_URL_PREFIX.length);
  if (rel.length === 0) return null;
  return `${GENERATED_URL_PREFIX}${rel}`;
}

// Inverse of playbackUrlToGeneratedUrl: a staged runtime URL
// ("/audio/generated/<rel>") back to its source playback_url ("/audio/<rel>"),
// which resolvePlaybackPath then maps to the source file. Returns null for
// non-runtime shapes.
export function generatedUrlToPlaybackUrl(generatedUrl: string): string | null {
  if (!generatedUrl.startsWith(GENERATED_URL_PREFIX)) return null;
  const rel = generatedUrl.slice(GENERATED_URL_PREFIX.length);
  if (rel.length === 0) return null;
  return `${PLAYBACK_URL_PREFIX}${rel}`;
}

// Resolves a master_path to its source-of-truth file. The master audio root
// defaults to content/audio/masters but may be relocated (e.g. a protected,
// out-of-repo store) via the masterRoot override. Returns null on traversal.
export function resolveMasterPath(
  contentRoot: string,
  masterPath: string,
  masterRoot?: string
): string | null {
  if (masterPath.length === 0) return null;
  const base = resolve(masterRoot ?? join(contentRoot, "audio/masters"));
  const resolved = resolve(base, masterPath);
  const relFromBase = relative(base, resolved);
  if (relFromBase === "" || relFromBase.startsWith("..") || isAbsolute(relFromBase)) return null;
  return resolved;
}

export function computeFileSha256(path: string): string {
  return createHash("sha256").update(readFileSync(path)).digest("hex");
}

export function computeReviewSubject(sound: InstructionalSound): string {
  const stable = {
    sound_id: sound.sound_id,
    instructional_label: sound.instructional_label,
    ipa: sound.ipa,
    example_word: sound.example_word,
    phonetic_class: sound.phonetic_class,
    production_behavior: sound.production_behavior,
    production_notes: sound.production_notes,
    dialect_notes: sound.dialect_notes,
    recording_guidance: sound.recording_guidance,
    processing_profile: sound.processing_profile,
    master_sha256: sound.master_sha256 ?? null,
    playback_sha256: sound.playback_sha256 ?? null,
  };
  return createHash("sha256").update(JSON.stringify(stable)).digest("hex");
}

/**
 * Review records are append-only. For one subject and review lane, the last
 * record is authoritative: objections revoke approval and later approval
 * records that the objection was resolved.
 */
export function hasCurrentApproval(
  sound: InstructionalSound,
  kind: ReviewKind,
  subjectSha256 = computeReviewSubject(sound)
): boolean {
  const current = sound.reviews.filter(
    (review) => review.kind === kind && review.subject_sha256 === subjectSha256
  );
  return current.at(-1)?.status === "approved";
}

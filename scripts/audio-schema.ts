import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { join } from "node:path";

export type ProductionBehavior = "clip" | "sustain" | "glide" | "sequence";
export type ReviewStatus = "approved" | "changes_requested";

export type ReviewRecord = {
  kind: "recorder" | "owner" | "slp";
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

export function validateAudioSources(sources: AudioSources): string[] {
  const errors: string[] = [];

  const soundIds = new Set<string>();
  for (const sound of sources.sounds) {
    if (soundIds.has(sound.sound_id)) {
      errors.push(`duplicate sound_id: ${sound.sound_id}`);
    }
    soundIds.add(sound.sound_id);

    if (!VALID_BEHAVIORS.has(sound.production_behavior)) {
      errors.push(`${sound.sound_id}: invalid production_behavior "${sound.production_behavior}"`);
    }
    if (typeof sound.dialect_notes !== "string") {
      errors.push(`${sound.sound_id}: dialect_notes must be a string`);
    }
  }

  const mappingIds = new Set<string>();
  for (const pattern of sources.patterns) {
    if (mappingIds.has(pattern.mapping_id)) {
      errors.push(`duplicate mapping_id: ${pattern.mapping_id}`);
    }
    mappingIds.add(pattern.mapping_id);

    for (const soundId of pattern.sound_ids) {
      if (!soundIds.has(soundId)) {
        errors.push(`${pattern.mapping_id}: unresolved sound_id reference "${soundId}"`);
      }
    }
  }

  return errors;
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

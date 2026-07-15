type StableReviewSubjectFields = {
  sound_id: string;
  instructional_label: string;
  ipa: string;
  example_word: string;
  phonetic_class: string;
  production_behavior: "clip" | "sustain" | "glide" | "sequence";
  production_notes: string;
  dialect_notes: string;
  recording_guidance: string;
  processing_profile: string;
};

export type ReviewSubjectSource = StableReviewSubjectFields & {
  master_sha256?: string;
  playback_sha256?: string;
};

export type ReviewSubjectPayload = StableReviewSubjectFields & {
  master_sha256: string | null;
  playback_sha256: string | null;
};

/**
 * Stable, runtime-neutral projection hashed by both Node authoring tools and
 * the Cloudflare Worker catalog. Property order is part of the hash contract.
 */
export function buildReviewSubjectPayload(sound: ReviewSubjectSource): ReviewSubjectPayload {
  return {
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
}

import { Hono } from "hono";
import { json } from "../db/client";
import { getAuthenticatedGuardian } from "../db/session";
import type { Env } from "../types";
import soundsJson from "../../../content/audio/sounds.json";
import patternsJson from "../../../content/audio/patterns.json";

/**
 * Protected review view of an instructional sound (spec 003). Mirrors the
 * canonical record in content/audio/sounds.json including checksum-bound
 * review records — this catalog is the ONLY surface that exposes reviewer
 * metadata; the public runtime manifest never carries it. Types are local
 * because scripts/audio-schema.ts (the authoring-side source) imports node
 * builtins that must not enter the Worker bundle.
 */
export type ProtectedSoundView = {
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
  master_path?: string;
  master_sha256?: string;
  playback_url?: string;
  playback_sha256?: string;
  reviews: {
    kind: "recorder" | "owner" | "slp";
    reviewer: string;
    reviewed_at: string;
    status: "approved" | "changes_requested";
    subject_sha256: string;
    notes?: string;
  }[];
};

export type GraphemePatternMapping = {
  mapping_id: string;
  grapheme: string;
  sound_ids: string[];
  example_word: string;
  note: string;
};

export const audioCatalogRoutes = new Hono<{ Bindings: Env }>();

/**
 * GET /guardian/audio-catalog — admin-only (DIAG_GUARDIAN_EMAIL gate, exactly
 * the diagnostics rule; spec 003 forbids a general admin-role system). Serves
 * canonical metadata only — media bytes are never proxied here.
 */
audioCatalogRoutes.get("/", async (c) => {
  const guardian = await getAuthenticatedGuardian(c);
  if (!guardian) return c.text("unauthorized", 401);
  if (guardian.email !== c.env.DIAG_GUARDIAN_EMAIL) return c.text("forbidden", 403);

  return json({
    sounds: soundsJson as ProtectedSoundView[],
    patterns: patternsJson as GraphemePatternMapping[]
  });
});

import { Hono } from "hono";
import { json } from "../db/client";
import { getAuthenticatedGuardian } from "../db/session";
import { canUseOperatorTools } from "../auth/operator-policy";
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
  /** Browser-served runtime path; source playback_url stays canonical metadata. */
  runtime_playback_url?: string;
  /** True only when the current media/guidance subject has an approved SLP review. */
  slp_approved?: boolean;
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
 * The canonical record stores a source URL under /audio/. The app build stages
 * the corresponding bytes under /audio/generated/, so the protected catalog
 * must receive the runtime path instead of asking the browser to play the
 * source-of-truth path that is not served by the SPA.
 */
export const toRuntimePlaybackUrl = (source?: string): string | undefined => {
  if (!source?.startsWith("/audio/") || source.startsWith("/audio/generated/")) return undefined;
  const relativePath = source.slice("/audio/".length);
  if (
    relativePath.length === 0 ||
    relativePath.split("/").some((segment) => segment.length === 0 || segment === "." || segment === "..")
  ) {
    return undefined;
  }
  return `/audio/generated/${relativePath}`;
};

/**
 * Worker-compatible counterpart to scripts/audio-schema.ts's review subject.
 * The authoring helper uses node:crypto and cannot be imported into the Worker;
 * keeping the stable field order here makes the API's release indicator use the
 * same checksum-bound contract as the learner manifest.
 */
export const computeProtectedReviewSubject = async (sound: ProtectedSoundView): Promise<string> => {
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
  const digest = await crypto.subtle.digest(
    "SHA-256",
    new TextEncoder().encode(JSON.stringify(stable))
  );
  return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, "0")).join("");
};

export const toProtectedSoundView = async (sound: ProtectedSoundView): Promise<ProtectedSoundView> => {
  const runtimePlaybackUrl = sound.playback_sha256
    ? toRuntimePlaybackUrl(sound.playback_url)
    : undefined;
  const currentSubject = await computeProtectedReviewSubject(sound);
  const currentSlpReviews = sound.reviews.filter(
    (review) => review.kind === "slp" && review.subject_sha256 === currentSubject
  );
  const slpApproved = Boolean(
    sound.playback_url &&
      sound.playback_sha256 &&
      currentSlpReviews.at(-1)?.status === "approved"
  );
  return {
    ...sound,
    ...(runtimePlaybackUrl ? { runtime_playback_url: runtimePlaybackUrl } : {}),
    slp_approved: slpApproved,
  };
};

/**
 * GET /guardian/audio-catalog — admin-only (DIAG_GUARDIAN_EMAIL gate, exactly
 * the diagnostics rule; spec 003 forbids a general admin-role system). Serves
 * canonical metadata only — media bytes are never proxied here.
 */
audioCatalogRoutes.get("/", async (c) => {
  const guardian = await getAuthenticatedGuardian(c);
  if (!guardian) return c.text("unauthorized", 401);
  if (!canUseOperatorTools(c.env, guardian)) return c.text("forbidden", 403);

  return json({
    sounds: await Promise.all((soundsJson as ProtectedSoundView[]).map(toProtectedSoundView)),
    patterns: patternsJson as GraphemePatternMapping[]
  });
});

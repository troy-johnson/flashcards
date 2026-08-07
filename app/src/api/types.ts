export type Guardian = {
  id: string;
  email: string;
  display_name: string | null;
};

export type GuardianCapabilities = {
  operator_tools: boolean;
};

export type AuthMeResponse = {
  guardian: Guardian;
  capabilities: GuardianCapabilities;
};

export type Student = {
  id: string;
  guardian_id?: string;
  display_name: string;
  grade: "K" | "1";
  birth_month: string | null;
  prefs_json: Record<string, unknown>;
  created_at: string;
  archived_at: string | null;
};

export type StudentProgressSkill = {
  skill_id: string;
  display_name: string;
  guardian_description: string;
  attempts: number;
  correct: number;
};

export type StudentProgressResponse = {
  progress: {
    total_attempts: number;
    correct: number;
    skills: StudentProgressSkill[];
  };
};

/** Instructional drill mode carried on each plan card (002i). */
export type CardKind = "pa" | "phonics" | "heart" | "fluency";

export type PracticeCard = {
  skill_id: string;
  item_id: string;
  text: string;
  /** Absent on plans persisted before 002i — render those as phonics. */
  kind?: CardKind;
  /** PA: expected blended/segmented answer, surfaced to the guardian. */
  answer?: string;
  /** PA: exact adult-facing words authored in instructional content. */
  guardian_script?: string;
  /** PA: plain-language description of the child's task. */
  student_task?: string;
  /** Heart words: decodable parts. */
  regular_parts?: string[];
  /** Heart words: parts that must be remembered ("the heart"). */
  irregular_parts?: string[];
  /** TTS pronunciation override — spoken form when it differs from `text` (003a). */
  speech_text?: string;
};

export type PracticeSession = {
  id: string;
  student_id: string;
  plan: { cards: PracticeCard[] };
};

export type AttemptResult = "correct" | "incorrect" | "skipped";

export type AttemptInput = {
  practice_session_id: string;
  skill_id: string;
  item_id: string;
  result: AttemptResult;
  duration_ms: number;
  shown_at: string;
};

/** Protected audio-catalog payload (003a Task 6/8) — admin-only review surface. */
export type AudioCatalogReview = {
  kind: "recorder" | "owner" | "slp";
  reviewer: string;
  reviewed_at: string;
  status: "approved" | "changes_requested";
  subject_sha256: string;
  notes?: string;
};

export type AudioCatalogSound = {
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
  /** Staged browser path used by the protected catalog for recorded candidates. */
  runtime_playback_url?: string;
  /** Server-computed current checksum-bound SLP release status. */
  slp_approved?: boolean;
  reviews: AudioCatalogReview[];
};

export type AudioCatalogPattern = {
  mapping_id: string;
  grapheme: string;
  sound_ids: string[];
  example_word: string;
  note: string;
};

export type AudioCatalogResponse = {
  sounds: AudioCatalogSound[];
  patterns: AudioCatalogPattern[];
};

export type DiagnosticSummaryRow = {
  student_id: string;
  skill_id: string;
  item_id: string;
  result: AttemptResult;
  attempts: number;
};

export interface SessionSummaryRow {
  student_id: string;
  started: number;
  completed: number;
  avg_duration_ms: number | null;
}

export interface ExitMarkerHouseholdRow {
  guardian_id: string;
  guardian_email: string;
  completed_sessions: number;
  first_completed_at: string;
  last_completed_at: string;
}

export interface ExitMarkerStudentRow {
  guardian_id: string;
  guardian_email: string;
  student_id: string;
  student_name: string;
  completed_sessions: number;
  first_completed_at: string;
  last_completed_at: string;
}

export interface ExitMarkers {
  households: ExitMarkerHouseholdRow[];
  students: ExitMarkerStudentRow[];
}

export interface FrictionRow {
  student_id: string;
  skill_id: string;
  item_id: string;
  misses: number;
}

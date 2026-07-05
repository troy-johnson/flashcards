export type Guardian = {
  id: string;
  email: string;
  display_name: string | null;
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

export interface FrictionRow {
  student_id: string;
  skill_id: string;
  item_id: string;
  misses: number;
}

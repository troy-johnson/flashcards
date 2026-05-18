export type GuardianRow = {
  id: string;
  email: string;
  role: "guardian";
  display_name: string | null;
  created_at: string;
  last_seen_at: string | null;
};

export type AuthTokenRow = {
  token_hash: string;
  guardian_id: string;
  expires_at: string;
  consumed_at: string | null;
};

export type SessionRow = {
  id: string;
  guardian_id: string;
  expires_at: string;
  created_at: string;
};

export type StudentRow = {
  id: string;
  guardian_id: string;
  classroom_id: string | null;
  display_name: string;
  grade: "K" | "1";
  birth_month: string | null;
  prefs_json: string;
  created_at: string;
  archived_at: string | null;
};

export type MasteryLevel = 0 | 1 | 2 | 3 | 4;

export type SkillMasteryRow = {
  student_id: string;
  skill_id: string;
  level: MasteryLevel;
  streak: number;
  ease: number;
  due_at: string | null;
  last_seen_at: string | null;
};

export type ItemMasteryRow = SkillMasteryRow & {
  item_id: string;
};

export type PracticeSessionRow = {
  id: string;
  student_id: string;
  plan_json: string;
  started_at: string;
  completed_at: string | null;
  bonus_count: number;
};

export type AttemptResult = "correct" | "incorrect" | "skipped";

export type AttemptRow = {
  id: string;
  practice_session_id: string;
  student_id: string;
  skill_id: string;
  item_id: string;
  result: AttemptResult;
  scoring_source: "guardian_tap";
  mic_transcript: string | null;
  mic_confidence: number | null;
  duration_ms: number;
  shown_at: string;
  scored_at: string;
};

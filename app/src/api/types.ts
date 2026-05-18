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
  prefs_json: string;
  created_at: string;
  archived_at: string | null;
};

export type PracticeCard = {
  skill_id: string;
  item_id: string;
  text: string;
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

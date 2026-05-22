import { env } from "cloudflare:test";

const foundationSql = `
CREATE TABLE guardian (id TEXT PRIMARY KEY, email TEXT NOT NULL UNIQUE, role TEXT NOT NULL DEFAULT 'guardian' CHECK (role = 'guardian'), display_name TEXT, created_at TEXT NOT NULL, last_seen_at TEXT);
CREATE TABLE auth_token (token_hash TEXT PRIMARY KEY, guardian_id TEXT NOT NULL REFERENCES guardian(id), expires_at TEXT NOT NULL, consumed_at TEXT);
CREATE TABLE session (id TEXT PRIMARY KEY, guardian_id TEXT NOT NULL REFERENCES guardian(id), expires_at TEXT NOT NULL, created_at TEXT NOT NULL);
CREATE TABLE student (id TEXT PRIMARY KEY, guardian_id TEXT NOT NULL REFERENCES guardian(id), classroom_id TEXT, display_name TEXT NOT NULL, grade TEXT NOT NULL CHECK (grade IN ('K', '1')), birth_month TEXT, prefs_json TEXT NOT NULL DEFAULT '{}', created_at TEXT NOT NULL, archived_at TEXT);
CREATE TABLE skill_mastery (student_id TEXT NOT NULL REFERENCES student(id), skill_id TEXT NOT NULL, level INTEGER NOT NULL DEFAULT 0 CHECK (level BETWEEN 0 AND 4), streak INTEGER NOT NULL DEFAULT 0, ease REAL NOT NULL DEFAULT 2.5, due_at TEXT, last_seen_at TEXT, PRIMARY KEY (student_id, skill_id));
CREATE TABLE item_mastery (student_id TEXT NOT NULL REFERENCES student(id), item_id TEXT NOT NULL, skill_id TEXT NOT NULL, level INTEGER NOT NULL DEFAULT 0 CHECK (level BETWEEN 0 AND 4), streak INTEGER NOT NULL DEFAULT 0, ease REAL NOT NULL DEFAULT 2.5, due_at TEXT, last_seen_at TEXT, PRIMARY KEY (student_id, item_id));
CREATE TABLE practice_session (id TEXT PRIMARY KEY, student_id TEXT NOT NULL REFERENCES student(id), plan_json TEXT NOT NULL, started_at TEXT NOT NULL, completed_at TEXT, bonus_count INTEGER NOT NULL DEFAULT 0);
CREATE TABLE attempt (id TEXT PRIMARY KEY, practice_session_id TEXT NOT NULL REFERENCES practice_session(id), student_id TEXT NOT NULL REFERENCES student(id), skill_id TEXT NOT NULL, item_id TEXT NOT NULL, result TEXT NOT NULL CHECK (result IN ('correct', 'incorrect', 'skipped')), scoring_source TEXT NOT NULL CHECK (scoring_source = 'guardian_tap'), mic_transcript TEXT, mic_confidence REAL, duration_ms INTEGER NOT NULL, shown_at TEXT NOT NULL, scored_at TEXT NOT NULL);
CREATE INDEX idx_student_guardian ON student(guardian_id);
CREATE INDEX idx_attempt_student ON attempt(student_id, scored_at);
CREATE INDEX idx_attempt_item ON attempt(item_id, scored_at);
`;

export const resetFoundationDb = async () => {
  await env.DB.exec("DROP TABLE IF EXISTS attempt; DROP TABLE IF EXISTS practice_session; DROP TABLE IF EXISTS item_mastery; DROP TABLE IF EXISTS skill_mastery; DROP TABLE IF EXISTS student; DROP TABLE IF EXISTS session; DROP TABLE IF EXISTS auth_token; DROP TABLE IF EXISTS guardian;");
  for (const stmt of foundationSql.split(/;\s*\n/).map((s) => s.trim()).filter(Boolean)) {
    await env.DB.prepare(stmt).run();
  }
};

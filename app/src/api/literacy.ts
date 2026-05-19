import { apiFetch } from "./client";
import type { AttemptInput, DiagnosticSummaryRow, Guardian, PracticeSession, Student } from "./types";

export const signIn = (email: string): Promise<void> =>
  apiFetch<void>("/auth/start", { method: "POST", body: JSON.stringify({ email }) });

export const consumeMagicLink = (token: string): Promise<void> =>
  apiFetch<void>(`/auth/consume?token=${encodeURIComponent(token)}`);

export const getCurrentGuardian = (): Promise<{ guardian: Guardian }> =>
  apiFetch<{ guardian: Guardian }>("/auth/me");

export const logout = (): Promise<void> =>
  apiFetch<void>("/auth/logout", { method: "POST" });

export const listStudents = (): Promise<{ students: Student[] }> =>
  apiFetch<{ students: Student[] }>("/students");

export const createStudent = (student: { display_name: string; grade: "K" | "1"; birth_month?: string }): Promise<{ student: Student }> =>
  apiFetch<{ student: Student }>("/students", { method: "POST", body: JSON.stringify(student) });

export const getStudent = (studentId: string): Promise<{ student: Student }> =>
  apiFetch<{ student: Student }>(`/students/${studentId}`);

export const startPractice = (studentId: string): Promise<{ practice_session: PracticeSession }> =>
  apiFetch<{ practice_session: PracticeSession }>(`/practice/${studentId}/start`, { method: "POST" });

export const scoreAttempt = (studentId: string, input: AttemptInput): Promise<{ attempt: { id: string; scoring_source: "guardian_tap" } }> =>
  apiFetch<{ attempt: { id: string; scoring_source: "guardian_tap" } }>(`/practice/${studentId}/attempt`, {
    method: "POST",
    body: JSON.stringify(input)
  });

export const getGuardianDiag = (): Promise<{ guardian: Guardian; summary: DiagnosticSummaryRow[] }> =>
  apiFetch<{ guardian: Guardian; summary: DiagnosticSummaryRow[] }>("/guardian/diag");

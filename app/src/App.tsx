import { FormEvent, useEffect, useMemo, useState } from "react";
import {
  consumeMagicLink,
  createStudent,
  getCurrentGuardian,
  getGuardianDiag,
  getStudent,
  listStudents,
  logout,
  scoreAttempt,
  signIn,
  startPractice
} from "./api/literacy";
import type { AttemptResult, DiagnosticSummaryRow, Guardian, Student } from "./api/types";
import { PhonicsCard } from "./components/cards/PhonicsCard";
import { advancePractice, currentCard, loadPractice, savePractice, type ActivePractice } from "./drill/session";
import "./App.css";

type FetchStatus = "loading" | "ready" | "error";

const navigate = (path: string): void => {
  window.history.pushState({}, "", path);
  window.dispatchEvent(new PopStateEvent("popstate"));
};

function usePath(): string {
  const [path, setPath] = useState(window.location.pathname);
  useEffect(() => {
    const onPop = () => setPath(window.location.pathname);
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, []);
  return path;
}

function GuardianNav({ guardian }: { guardian: Guardian | null }) {
  const onLogout = async (event: FormEvent) => {
    event.preventDefault();
    try { await logout(); } catch { /* ignore */ }
    navigate("/");
  };
  if (!guardian) return null;
  return (
    <nav className="guardian-nav" aria-label="Guardian navigation">
      <a href="/guardian">Students</a>
      <a href="/guardian/diag">Diagnostics</a>
      <form onSubmit={onLogout}><button type="submit">Sign out</button></form>
    </nav>
  );
}

function LandingRoute() {
  return (
    <main className="page-shell">
      <section className="panel hero-panel">
        <p className="eyebrow">Literacy practice</p>
        <h1>Short, calm reading practice with your student.</h1>
        <p>Sign in to set up a student and start today&apos;s guardian-tap drill.</p>
        <a className="primary-link" href="/signin">Sign in</a>
      </section>
    </main>
  );
}

function SignInRoute() {
  const [status, setStatus] = useState<"idle" | "sent" | "error">("idle");

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    const form = event.currentTarget as HTMLFormElement;
    const submittedEmail = String(new FormData(form).get("email") ?? "");
    try {
      await signIn(submittedEmail);
      setStatus("sent");
    } catch {
      setStatus("error");
    }
  };

  return (
    <main className="page-shell">
      <section className="panel narrow-panel">
        <h1>Sign in</h1>
        <p>Enter your email and we&apos;ll send a magic link.</p>
        <form onSubmit={submit} className="stack">
          <label>
            Email
            <input name="email" type="email" required />
          </label>
          <button type="submit">Send magic link</button>
        </form>
        {status === "sent" && <p role="status">Check your email for the magic link.</p>}
        {status === "error" && <p role="alert">We could not send that magic link. Try again.</p>}
      </section>
    </main>
  );
}

function AuthConsumeRoute() {
  const [status, setStatus] = useState<"loading" | "error">("loading");

  useEffect(() => {
    const token = new URLSearchParams(window.location.search).get("token");
    if (!token) {
      setStatus("error");
      return;
    }
    let active = true;
    consumeMagicLink(token)
      .then(() => {
        if (!active) return;
        navigate("/guardian");
      })
      .catch(() => active && setStatus("error"));
    return () => {
      active = false;
    };
  }, []);

  return (
    <main className="page-shell">
      <section className="panel narrow-panel">
        <h1>Signing you in…</h1>
        {status === "loading" && <p>Finishing sign-in. One moment.</p>}
        {status === "error" && (
          <>
            <p role="alert">That magic link is invalid or expired.</p>
            <p><a className="primary-link" href="/signin">Request a new magic link</a></p>
          </>
        )}
      </section>
    </main>
  );
}

function GuardianRoute() {
  const [students, setStudents] = useState<Student[]>([]);
  const [status, setStatus] = useState<FetchStatus>("loading");

  useEffect(() => {
    let active = true;
    listStudents()
      .then(({ students }) => {
        if (!active) return;
        setStudents(students);
        setStatus("ready");
      })
      .catch(() => active && setStatus("error"));
    return () => {
      active = false;
    };
  }, []);

  return (
    <main className="page-shell">
      <section className="panel">
        <h1>Guardian dashboard</h1>
        <p className="muted">Students you&apos;ve added show up here. Open one to start practice or view progress.</p>
        <div className="actions">
          <a className="primary-link" href="/guardian/add-student">Add a student</a>
          <a href="/guardian/diag">View diagnostics</a>
        </div>
        {status === "loading" && <p>Loading students…</p>}
        {status === "error" && <p role="alert">Could not load students. Try refreshing.</p>}
        {status === "ready" && students.length === 0 && (
          <p className="empty">No students yet. Add your first student to get started.</p>
        )}
        {status === "ready" && students.length > 0 && (
          <ul className="card-list">
            {students.map((student) => (
              <li key={student.id}>
                <a href={`/guardian/${student.id}`}>{student.display_name}</a>
                <span>Grade {student.grade}</span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
  );
}

function AddStudentRoute() {
  const [created, setCreated] = useState<Student | null>(null);
  const [status, setStatus] = useState<"idle" | "submitting" | "error">("idle");

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    const form = event.currentTarget as HTMLFormElement;
    const submittedName = String(new FormData(form).get("display_name") ?? "");
    const submittedGrade = String(new FormData(form).get("grade") ?? "K") as "K" | "1";
    setStatus("submitting");
    try {
      const { student } = await createStudent({ display_name: submittedName, grade: submittedGrade });
      setCreated(student);
      setStatus("idle");
    } catch {
      setStatus("error");
    }
  };

  return (
    <main className="page-shell">
      <section className="panel narrow-panel">
        <h1>Add a student</h1>
        <form onSubmit={submit} className="stack">
          <label>
            Student first name
            <input name="display_name" required />
          </label>
          <label>
            Grade
            <select name="grade" defaultValue="K">
              <option value="K">K</option>
              <option value="1">1</option>
            </select>
          </label>
          <button type="submit" disabled={status === "submitting"}>Create student</button>
        </form>
        {status === "error" && <p role="alert">Could not create student. Try again.</p>}
        {created && (
          <p role="status">
            {created.display_name} is ready for practice. <a href={`/guardian/${created.id}`}>Open dashboard</a>
          </p>
        )}
      </section>
    </main>
  );
}

type StudentProgress = {
  totalAttempts: number;
  correct: number;
  perSkill: { skill_id: string; attempts: number; correct: number }[];
};

const summarizeForStudent = (rows: DiagnosticSummaryRow[], studentId: string): StudentProgress => {
  const studentRows = rows.filter((row) => row.student_id === studentId);
  let totalAttempts = 0;
  let correct = 0;
  const skillMap = new Map<string, { attempts: number; correct: number }>();
  for (const row of studentRows) {
    totalAttempts += row.attempts;
    if (row.result === "correct") correct += row.attempts;
    const skill = skillMap.get(row.skill_id) ?? { attempts: 0, correct: 0 };
    skill.attempts += row.attempts;
    if (row.result === "correct") skill.correct += row.attempts;
    skillMap.set(row.skill_id, skill);
  }
  const perSkill = Array.from(skillMap.entries())
    .map(([skill_id, s]) => ({ skill_id, ...s }))
    .sort((a, b) => a.skill_id.localeCompare(b.skill_id));
  return { totalAttempts, correct, perSkill };
};

function StudentDashboardRoute({ studentId }: { studentId: string }) {
  const [student, setStudent] = useState<Student | null>(null);
  const [progress, setProgress] = useState<StudentProgress | null>(null);
  const [status, setStatus] = useState<FetchStatus>("loading");

  useEffect(() => {
    let active = true;
    Promise.all([getStudent(studentId), getGuardianDiag().catch(() => ({ summary: [] as DiagnosticSummaryRow[] }))])
      .then(([{ student }, diag]) => {
        if (!active) return;
        setStudent(student);
        setProgress(summarizeForStudent(diag.summary, studentId));
        setStatus("ready");
      })
      .catch(() => active && setStatus("error"));
    return () => {
      active = false;
    };
  }, [studentId]);

  const accuracyPct = progress && progress.totalAttempts > 0
    ? Math.round((progress.correct / progress.totalAttempts) * 100)
    : null;

  return (
    <main className="page-shell">
      <section className="panel">
        <h1>{student ? `${student.display_name}'s progress` : "Student progress"}</h1>
        {status === "loading" && <p>Loading progress…</p>}
        {status === "error" && <p role="alert">Could not load student progress.</p>}
        {status === "ready" && progress && (
          <>
            <div className="actions">
              <a className="primary-link" href={`/play/${studentId}`}>Start practice</a>
              <a href={`/guardian/${studentId}/settings`}>Settings</a>
            </div>
            <h2>Overall</h2>
            {progress.totalAttempts === 0 ? (
              <p className="empty">No attempts yet. Start today&apos;s practice to begin tracking.</p>
            ) : (
              <p>
                {progress.correct} of {progress.totalAttempts} correct
                {accuracyPct !== null ? ` (${accuracyPct}%)` : ""}.
              </p>
            )}
            {progress.perSkill.length > 0 && (
              <>
                <h2>By skill</h2>
                <ul className="card-list">
                  {progress.perSkill.map((skill) => (
                    <li key={skill.skill_id}>
                      <span>{skill.skill_id}</span>
                      <span>{skill.correct}/{skill.attempts}</span>
                    </li>
                  ))}
                </ul>
              </>
            )}
          </>
        )}
      </section>
    </main>
  );
}

function StudentSettingsRoute({ studentId }: { studentId: string }) {
  return (
    <main className="page-shell">
      <section className="panel">
        <h1>Student settings</h1>
        <p>Mic practice is off for this foundation slice.</p>
        <a href={`/guardian/${studentId}`}>Back to progress</a>
      </section>
    </main>
  );
}

function GuardianDiagRoute() {
  const [data, setData] = useState<{ guardian: Guardian; summary: DiagnosticSummaryRow[] } | null>(null);
  const [status, setStatus] = useState<FetchStatus>("loading");

  useEffect(() => {
    let active = true;
    getGuardianDiag()
      .then((res) => {
        if (!active) return;
        setData(res);
        setStatus("ready");
      })
      .catch(() => active && setStatus("error"));
    return () => {
      active = false;
    };
  }, []);

  return (
    <main className="page-shell">
      <section className="panel">
        <h1>Diagnostics</h1>
        <p className="muted">Read-only attempt summary across your students. Available only to the designated diagnostics guardian.</p>
        {status === "loading" && <p>Loading diagnostics…</p>}
        {status === "error" && <p role="alert">Could not load diagnostics. You may not have access on this account.</p>}
        {status === "ready" && data && (
          data.summary.length === 0 ? (
            <p className="empty">No attempts recorded yet.</p>
          ) : (
            <table className="diag-table">
              <thead>
                <tr><th>Student</th><th>Skill</th><th>Item</th><th>Result</th><th>Attempts</th></tr>
              </thead>
              <tbody>
                {data.summary.map((row, i) => (
                  <tr key={`${row.student_id}:${row.skill_id}:${row.item_id}:${row.result}:${i}`}>
                    <td>{row.student_id}</td>
                    <td>{row.skill_id}</td>
                    <td>{row.item_id}</td>
                    <td>{row.result}</td>
                    <td>{row.attempts}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )
        )}
        <p><a href="/guardian">Back to dashboard</a></p>
      </section>
    </main>
  );
}

function PlayStartRoute({ studentId }: { studentId: string }) {
  const [practice, setPractice] = useState<ActivePractice | null>(() => loadPractice(studentId));
  const [status, setStatus] = useState<FetchStatus>(practice ? "ready" : "loading");

  useEffect(() => {
    if (practice) return;
    let active = true;
    startPractice(studentId)
      .then(({ practice_session }) => {
        if (!active) return;
        const next = { session: practice_session, index: 0, shown_at: new Date().toISOString() };
        savePractice(studentId, next);
        setPractice(next);
        setStatus("ready");
      })
      .catch(() => active && setStatus("error"));
    return () => {
      active = false;
    };
  }, [practice, studentId]);

  return (
    <main className="page-shell student-mode">
      <section className="panel hero-panel">
        <h1>Today: {practice?.session.plan.cards.length ?? 0} things</h1>
        <p>Read each word. Your guardian taps how it went.</p>
        {status === "loading" && <p>Getting today&apos;s cards…</p>}
        {status === "error" && <p role="alert">Could not start practice. <a href={`/guardian/${studentId}`}>Back</a></p>}
        {status === "ready" && practice && practice.session.plan.cards.length === 0 && (
          <p className="empty">No cards available for today.</p>
        )}
        {status === "ready" && practice && practice.session.plan.cards.length > 0 && (
          <button type="button" onClick={() => navigate(`/play/${studentId}/drill`)}>Start</button>
        )}
      </section>
    </main>
  );
}

function DrillRoute({ studentId }: { studentId: string }) {
  const [practice, setPractice] = useState<ActivePractice | null>(() => loadPractice(studentId));
  const [busy, setBusy] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const card = practice ? currentCard(practice) : null;

  useEffect(() => {
    if (!practice || !card) navigate(`/play/${studentId}`);
  }, [card, practice, studentId]);

  const onScore = async (result: AttemptResult) => {
    if (!practice || !card || busy) return;
    setBusy(true);
    setSubmitError(null);
    try {
      await scoreAttempt(studentId, {
        practice_session_id: practice.session.id,
        skill_id: card.skill_id,
        item_id: card.item_id,
        result,
        duration_ms: Math.max(0, Date.now() - Date.parse(practice.shown_at)),
        shown_at: practice.shown_at
      });
    } catch {
      setSubmitError("Could not save that tap. Try again.");
      setBusy(false);
      return;
    }
    const next = advancePractice(studentId, practice);
    if (!next) {
      navigate(`/play/${studentId}/done`);
      return;
    }
    setPractice(next);
    setBusy(false);
  };

  if (!card) return null;

  return (
    <main className="page-shell student-mode">
      <PhonicsCard key={`${card.skill_id}:${card.item_id}`} card={card} onScore={onScore} />
      {submitError && <p role="alert">{submitError}</p>}
    </main>
  );
}

function DoneRoute({ studentId }: { studentId: string }) {
  return (
    <main className="page-shell student-mode">
      <section className="panel hero-panel">
        <h1>You’re done</h1>
        <p>Nice reading today. You can do a calm bonus round if your guardian says yes.</p>
        <a className="primary-link" href={`/guardian/${studentId}`}>Back to progress</a>
      </section>
    </main>
  );
}

function App() {
  const path = usePath();
  const segments = useMemo(() => path.split("/").filter(Boolean), [path]);
  const [guardian, setGuardian] = useState<Guardian | null>(null);

  useEffect(() => {
    let active = true;
    getCurrentGuardian()
      .then(({ guardian }) => active && setGuardian(guardian))
      .catch(() => active && setGuardian(null));
    return () => {
      active = false;
    };
  }, [path]);

  let route;
  if (path === "/signin") route = <SignInRoute />;
  else if (path === "/auth/consume") route = <AuthConsumeRoute />;
  else if (path === "/guardian") route = <GuardianRoute />;
  else if (path === "/guardian/add-student") route = <AddStudentRoute />;
  else if (path === "/guardian/diag") route = <GuardianDiagRoute />;
  else if (segments[0] === "guardian" && segments[1] && segments[2] === "settings") route = <StudentSettingsRoute studentId={segments[1]} />;
  else if (segments[0] === "guardian" && segments[1]) route = <StudentDashboardRoute studentId={segments[1]} />;
  else if (segments[0] === "play" && segments[1] && segments[2] === "drill") route = <DrillRoute studentId={segments[1]} />;
  else if (segments[0] === "play" && segments[1] && segments[2] === "done") route = <DoneRoute studentId={segments[1]} />;
  else if (segments[0] === "play" && segments[1]) route = <PlayStartRoute studentId={segments[1]} />;
  else {
    if (path !== "/") navigate("/");
    route = <LandingRoute />;
  }

  const isStudentMode = segments[0] === "play";
  const isPublicRoute = path === "/" || path === "/signin" || path === "/auth/consume";
  const showNav = !isStudentMode && !isPublicRoute;
  return (
    <>
      {showNav && <GuardianNav guardian={guardian} />}
      {route}
    </>
  );
}

export default App;

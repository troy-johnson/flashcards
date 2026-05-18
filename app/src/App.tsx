import { FormEvent, useEffect, useMemo, useState } from "react";
import { createStudent, getStudent, listStudents, scoreAttempt, signIn, startPractice } from "./api/literacy";
import type { AttemptResult, Student } from "./api/types";
import { PhonicsCard } from "./components/cards/PhonicsCard";
import { advancePractice, currentCard, loadPractice, savePractice, type ActivePractice } from "./drill/session";
import "./App.css";

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

function GuardianRoute() {
  const [students, setStudents] = useState<Student[]>([]);
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");

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
        <a className="primary-link" href="/guardian/add-student">Add a student</a>
        {status === "loading" && <p>Loading students…</p>}
        {status === "error" && <p role="alert">Could not load students.</p>}
        {status === "ready" && (
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

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    const form = event.currentTarget as HTMLFormElement;
    const submittedName = String(new FormData(form).get("display_name") ?? "");
    const submittedGrade = String(new FormData(form).get("grade") ?? "K") as "K" | "1";
    const { student } = await createStudent({ display_name: submittedName, grade: submittedGrade });
    setCreated(student);
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
          <button type="submit">Create student</button>
        </form>
        {created && <p role="status">{created.display_name} is ready for practice.</p>}
      </section>
    </main>
  );
}

function StudentDashboardRoute({ studentId }: { studentId: string }) {
  const [student, setStudent] = useState<Student | null>(null);
  useEffect(() => {
    getStudent(studentId).then(({ student }) => setStudent(student));
  }, [studentId]);

  return (
    <main className="page-shell">
      <section className="panel">
        <h1>{student ? `${student.display_name}'s progress` : "Student progress"}</h1>
        <p>Today&apos;s preview loop uses one text-only Phonics card and guardian tap scoring.</p>
        <a className="primary-link" href={`/play/${studentId}`}>Start practice</a>
        <a href={`/guardian/${studentId}/settings`}>Settings</a>
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

function PlayStartRoute({ studentId }: { studentId: string }) {
  const [practice, setPractice] = useState<ActivePractice | null>(() => loadPractice(studentId));
  const [status, setStatus] = useState<"loading" | "ready" | "error">(practice ? "ready" : "loading");

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
        {status === "error" && <p role="alert">Could not start practice.</p>}
        {status === "ready" && <button type="button" onClick={() => navigate(`/play/${studentId}/drill`)}>Start</button>}
      </section>
    </main>
  );
}

function DrillRoute({ studentId }: { studentId: string }) {
  const [practice, setPractice] = useState<ActivePractice | null>(() => loadPractice(studentId));
  const [busy, setBusy] = useState(false);

  const card = practice ? currentCard(practice) : null;

  useEffect(() => {
    if (!practice || !card) navigate(`/play/${studentId}`);
  }, [card, practice, studentId]);

  const onScore = async (result: AttemptResult) => {
    if (!practice || !card || busy) return;
    setBusy(true);
    await scoreAttempt(studentId, {
      practice_session_id: practice.session.id,
      skill_id: card.skill_id,
      item_id: card.item_id,
      result,
      duration_ms: Math.max(0, Date.now() - Date.parse(practice.shown_at)),
      shown_at: practice.shown_at
    });
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
      <PhonicsCard card={card} onScore={onScore} />
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

  if (path === "/signin") return <SignInRoute />;
  if (path === "/guardian") return <GuardianRoute />;
  if (path === "/guardian/add-student") return <AddStudentRoute />;
  if (segments[0] === "guardian" && segments[1] && segments[2] === "settings") return <StudentSettingsRoute studentId={segments[1]} />;
  if (segments[0] === "guardian" && segments[1]) return <StudentDashboardRoute studentId={segments[1]} />;
  if (segments[0] === "play" && segments[1] && segments[2] === "drill") return <DrillRoute studentId={segments[1]} />;
  if (segments[0] === "play" && segments[1] && segments[2] === "done") return <DoneRoute studentId={segments[1]} />;
  if (segments[0] === "play" && segments[1]) return <PlayStartRoute studentId={segments[1]} />;
  if (path !== "/") navigate("/");
  return <LandingRoute />;
}

export default App;

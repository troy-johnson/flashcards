import { FormEvent, useEffect, useMemo, useRef, useState } from "react";
import {
  completePractice,
  consumeMagicLink,
  createStudent,
  getCurrentGuardian,
  getGuardianDiag,
  getStudent,
  getStudentProgress,
  listStudents,
  logout,
  scoreAttempt,
  signIn,
  startPractice
} from "./api/literacy";
import type { AttemptResult, AuthMeResponse, DiagnosticSummaryRow, ExitMarkers, FrictionRow, Guardian, SessionSummaryRow, Student, StudentProgressResponse } from "./api/types";
import { landing, onboarding, privacyPolicyDraft, productName, support, termsOfUseDraft } from "copy";
import { DrillCard } from "./components/cards/DrillCard";
import { AudioCatalogRoute } from "./routes/AudioCatalogRoute";
import { advancePractice, currentCard, loadPractice, savePractice, type ActivePractice } from "./drill/session";
import "./App.css";

type FetchStatus = "loading" | "ready" | "error";

type NavigationState = { createdName?: string };

const navigate = (path: string, state: NavigationState = {}): void => {
  window.history.pushState(state, "", path);
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

function GuardianNav({ guardian, operatorTools }: { guardian: Guardian | null; operatorTools: boolean }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuButtonRef = useRef<HTMLButtonElement>(null);
  const firstActionRef = useRef<HTMLAnchorElement>(null);

  useEffect(() => {
    if (!menuOpen) return;
    firstActionRef.current?.focus();
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      setMenuOpen(false);
      menuButtonRef.current?.focus();
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [menuOpen]);

  const toggleMenu = () => {
    if (menuOpen) {
      setMenuOpen(false);
      menuButtonRef.current?.focus();
      return;
    }
    setMenuOpen(true);
  };

  const closeForNavigation = () => setMenuOpen(false);

  const onLogout = async (event: FormEvent) => {
    event.preventDefault();
    setMenuOpen(false);
    try { await logout(); } catch { /* ignore */ }
    navigate("/");
  };
  if (!guardian) return null;
  return (
    <header className="guardian-header">
      <div className="guardian-header-inner">
        <a className="guardian-brand" href="/guardian">{productName}</a>
        <nav className="guardian-nav" aria-label="Guardian navigation">
          <button
            ref={menuButtonRef}
            className="guardian-menu-button"
            type="button"
            aria-controls="guardian-nav-actions"
            aria-expanded={menuOpen}
            onClick={toggleMenu}
          >
            Menu
          </button>
          <div
            id="guardian-nav-actions"
            className={`guardian-nav-actions${menuOpen ? " is-open" : ""}`}
          >
            <a ref={firstActionRef} href="/guardian" onClick={closeForNavigation}>Students</a>
            {operatorTools && <a href="/guardian/diag" onClick={closeForNavigation}>Diagnostics</a>}
            {operatorTools && <a href="/guardian/audio-catalog" onClick={closeForNavigation}>Audio catalog</a>}
            <a href={`mailto:${support.email}`} onClick={closeForNavigation}>Contact support</a>
            <form onSubmit={onLogout}><button type="submit">Sign out</button></form>
          </div>
        </nav>
      </div>
    </header>
  );
}

function LandingRoute() {
  return (
    <main className="page-shell landing-shell">
      <div className="landing">
        <section className="panel hero-panel">
          <p className="eyebrow">{landing.eyebrow}</p>
          <h1>{landing.headline}</h1>
          <p className="landing-lede">{landing.subtitle}</p>
          <a className="primary-link" href="/signin">{landing.signInCta}</a>
        </section>

        <section className="panel landing-story">
          <h2>{landing.storyHeading}</h2>
          <p>{landing.audience}</p>
          <p>{landing.practice}</p>
          <p>{landing.instruction}</p>
        </section>

        <section className="panel landing-privacy">
          <h2>{landing.privacyHeading}</h2>
          <p>{landing.privacy}</p>
          <p>{landing.pilot}</p>
        </section>

        <section className="panel landing-steps">
          <h2>{landing.stepsHeading}</h2>
          <ol>
            {landing.steps.map((step) => (
              <li key={step.title}>
                <strong>{step.title}</strong> {step.body}
              </li>
            ))}
          </ol>
        </section>

        <section className="panel landing-not">
          <p>
            {landing.antiGamification}
          </p>
        </section>

        <section className="landing-cta">
          <p className="muted">{landing.ctaPrompt}</p>
          <a className="primary-link" href={`mailto:${support.email}`}>{landing.contactCta}</a>
        </section>

        <footer className="landing-footer">
          <a href="/privacy">{landing.privacyLink}</a>
          <a href="/terms">{landing.termsLink}</a>
        </footer>
      </div>
    </main>
  );
}

type LegalDocument = typeof privacyPolicyDraft | typeof termsOfUseDraft;

function LegalRoute({ document }: { document: LegalDocument }) {
  return (
    <main className="page-shell">
      <article className="panel legal-document">
        <p className="eyebrow">{document.status}</p>
        <h1>{document.title}</h1>
        <p>{document.introduction}</p>
        {document.sections.map((section) => (
          <section key={section.heading}>
            <h2>{section.heading}</h2>
            {section.paragraphs.map((paragraph) => (
              <p key={paragraph}>{paragraph}</p>
            ))}
          </section>
        ))}
        <p>
          Questions, deletion requests, and other data requests: {" "}
          <a href={`mailto:${support.email}`}>{support.email}</a>
        </p>
      </article>
    </main>
  );
}

function PrivacyRoute() {
  return <LegalRoute document={privacyPolicyDraft} />;
}

function TermsRoute() {
  return <LegalRoute document={termsOfUseDraft} />;
}

function SignInRoute() {
  const [status, setStatus] = useState<"idle" | "sent" | "error">("idle");
  const [devLink, setDevLink] = useState<string | null>(null);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    const form = event.currentTarget as HTMLFormElement;
    const submittedEmail = String(new FormData(form).get("email") ?? "");
    try {
      const res = await signIn(submittedEmail);
      setDevLink(res.devMagicLink ?? null);
      setStatus("sent");
    } catch {
      setDevLink(null);
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
        {status === "sent" && !devLink && <p role="status">Check your email for the magic link.</p>}
        {status === "sent" && devLink && (
          <div role="status" className="dev-magic-link">
            <p className="eyebrow">Dev mode</p>
            <p>Email isn&apos;t wired in this environment. Open this link to sign in:</p>
            <a href={devLink}>{devLink}</a>
          </div>
        )}
        {status === "error" && <p role="alert">We could not send that magic link. Try again.</p>}
      </section>
    </main>
  );
}

const consumeInFlight = new Map<string, Promise<void>>();

function AuthConsumeRoute() {
  const [status, setStatus] = useState<"loading" | "error">("loading");

  useEffect(() => {
    const token = new URLSearchParams(window.location.search).get("token");
    if (!token) {
      setStatus("error");
      return;
    }
    let active = true;
    let pending = consumeInFlight.get(token);
    if (!pending) {
      pending = consumeMagicLink(token);
      consumeInFlight.set(token, pending);
    }
    pending
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

function GuardianRoute({ operatorTools }: { operatorTools: boolean }) {
  const [students, setStudents] = useState<Student[]>([]);
  const [status, setStatus] = useState<FetchStatus>("loading");
  const createdName = typeof window.history.state?.createdName === "string"
    ? window.history.state.createdName
    : null;

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
        {createdName && <p role="status">{createdName} was added to your students.</p>}
        <div className="actions">
          <a className="primary-link" href="/guardian/add-student">Add a student</a>
          {operatorTools && <a href="/guardian/diag">View diagnostics</a>}
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
  const [status, setStatus] = useState<"idle" | "submitting" | "error">("idle");

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    const form = event.currentTarget as HTMLFormElement;
    const submittedName = String(new FormData(form).get("display_name") ?? "");
    const submittedGrade = String(new FormData(form).get("grade") ?? "K") as "K" | "1";
    setStatus("submitting");
    try {
      const { student } = await createStudent({ display_name: submittedName, grade: submittedGrade });
      navigate("/guardian", { createdName: student.display_name });
    } catch {
      setStatus("error");
    }
  };

  return (
    <main className="page-shell">
      <section className="panel narrow-panel">
        <h1>{onboarding.headline}</h1>
        <p className="muted">{onboarding.subtitle}</p>
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
      </section>
    </main>
  );
}

function StudentDashboardRoute({ studentId }: { studentId: string }) {
  const [student, setStudent] = useState<Student | null>(null);
  const [progress, setProgress] = useState<StudentProgressResponse["progress"] | null>(null);
  const [status, setStatus] = useState<FetchStatus>("loading");

  useEffect(() => {
    let active = true;
    Promise.all([getStudent(studentId), getStudentProgress(studentId)])
      .then(([{ student }, { progress }]) => {
        if (!active) return;
        setStudent(student);
        setProgress(progress);
        setStatus("ready");
      })
      .catch(() => active && setStatus("error"));
    return () => {
      active = false;
    };
  }, [studentId]);

  const accuracyPct = progress && progress.total_attempts > 0
    ? Math.round((progress.correct / progress.total_attempts) * 100)
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
            {progress.total_attempts === 0 ? (
              <p className="empty">No attempts yet. Start today&apos;s practice to begin tracking.</p>
            ) : (
              <p>
                {progress.correct} of {progress.total_attempts} correct
                {accuracyPct !== null ? ` (${accuracyPct}%)` : ""}.
              </p>
            )}
            {progress.skills.length > 0 && (
              <>
                <h2>By skill</h2>
                <div className="progress-skill-list">
                  {progress.skills.map((skill) => (
                    <details className="progress-skill-card" key={skill.skill_id}>
                      <summary>
                        <span className="progress-skill-summary-grid">
                          <span className="progress-skill-name">{skill.display_name}</span>
                          <span className="progress-skill-score">
                            {skill.correct}/{skill.attempts}
                          </span>
                        </span>
                      </summary>
                      <p className="progress-skill-description">
                        {skill.guardian_description}
                      </p>
                    </details>
                  ))}
                </div>
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

const formatDiagnosticDate = (value: string): string =>
  new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", year: "numeric" }).format(new Date(value));

function GuardianDiagRoute() {
  const [data, setData] = useState<{ guardian: Guardian; summary: DiagnosticSummaryRow[]; sessions: SessionSummaryRow[]; friction: FrictionRow[]; exit_markers: ExitMarkers } | null>(null);
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
          <>
            <h2>Pilot exit markers</h2>
            <p className="muted">Completed sessions across pilot households and students. Use the first and last completion dates to assess sustained use.</p>
            {data.exit_markers.households.length === 0 ? (
              <p className="empty">No completed pilot sessions yet.</p>
            ) : (
              <table className="diag-table">
                <thead>
                  <tr><th>Household</th><th>Completed</th><th>First completion</th><th>Last completion</th></tr>
                </thead>
                <tbody>
                  {data.exit_markers.households.map((household) => (
                    <tr key={household.guardian_id}>
                      <td>{household.guardian_email}</td>
                      <td>{household.completed_sessions}</td>
                      <td>{formatDiagnosticDate(household.first_completed_at)}</td>
                      <td>{formatDiagnosticDate(household.last_completed_at)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
            {data.exit_markers.students.length > 0 && (
              <table className="diag-table">
                <thead>
                  <tr><th>Student</th><th>Household</th><th>Completed</th><th>First completion</th><th>Last completion</th></tr>
                </thead>
                <tbody>
                  {data.exit_markers.students.map((student) => (
                    <tr key={student.student_id}>
                      <td>{student.student_name}</td>
                      <td>{student.guardian_email}</td>
                      <td>{student.completed_sessions}</td>
                      <td>{formatDiagnosticDate(student.first_completed_at)}</td>
                      <td>{formatDiagnosticDate(student.last_completed_at)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
            <h2>Sessions</h2>
            {data.sessions.length === 0 ? (
              <p className="empty">No practice sessions yet.</p>
            ) : (
              <table className="diag-table">
                <thead>
                  <tr><th>Student</th><th>Started</th><th>Completed</th><th>Avg duration</th></tr>
                </thead>
                <tbody>
                  {data.sessions.map((s) => (
                    <tr key={s.student_id}>
                      <td>{s.student_id}</td>
                      <td>{s.started}</td>
                      <td>{s.completed}</td>
                      <td>{s.avg_duration_ms === null ? "—" : `${Math.round(s.avg_duration_ms / 1000)}s`}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
            {data.friction.length > 0 && (
              <>
                <h2>Top friction</h2>
                <table className="diag-table">
                  <thead>
                    <tr><th>Student</th><th>Skill</th><th>Item</th><th>Misses</th></tr>
                  </thead>
                  <tbody>
                    {data.friction.map((f, i) => (
                      <tr key={`${f.student_id}:${f.skill_id}:${f.item_id}:${i}`}>
                        <td>{f.student_id}</td>
                        <td>{f.skill_id}</td>
                        <td>{f.item_id}</td>
                        <td>{f.misses}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </>
            )}
            <h2>Attempts</h2>
            {data.summary.length === 0 ? (
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
            )}
          </>
        )}
        <p><a href="/guardian">Back to dashboard</a></p>
      </section>
    </main>
  );
}

function PracticeExit({ studentId, disabled = false }: { studentId: string; disabled?: boolean }) {
  return (
    <button
      type="button"
      className="practice-exit"
      data-practice-exit
      disabled={disabled}
      onClick={() => navigate(`/guardian/${studentId}`)}
    >
      Exit practice
    </button>
  );
}

function PlayStartRoute({ studentId }: { studentId: string }) {
  const [practice, setPractice] = useState<ActivePractice | null>(() => loadPractice(studentId));
  const [status, setStatus] = useState<FetchStatus>(practice ? "ready" : "loading");
  const [terminalReason, setTerminalReason] = useState<"review_complete_no_active_content" | null>(null);

  useEffect(() => {
    if (practice) return;
    let active = true;
    startPractice(studentId)
      .then(({ practice_session, terminal_reason }) => {
        if (!active) return;
        const next = { session: practice_session, index: 0, shown_at: new Date().toISOString() };
        if (!terminal_reason) savePractice(studentId, next);
        setPractice(next);
        setTerminalReason(terminal_reason ?? null);
        setStatus("ready");
      })
      .catch(() => active && setStatus("error"));
    return () => {
      active = false;
    };
  }, [practice, studentId]);

  const caughtUp = terminalReason === "review_complete_no_active_content";

  return (
    <main className="page-shell student-mode">
      <section className="panel hero-panel">
        <h1>{caughtUp ? "All caught up" : `Today: ${practice?.session.plan.cards.length ?? 0} things`}</h1>
        {!caughtUp && <p>Read each word. Your guardian taps how it went.</p>}
        {status === "loading" && <p>Getting today&apos;s cards…</p>}
        {status === "error" && <p className="drill-alert" role="alert">Could not start practice. <a href={`/guardian/${studentId}`}>Back</a></p>}
        {status === "ready" && practice && caughtUp && (
          <>
            <p className="empty">You&apos;ve finished the available learning path, so there&apos;s nothing to practice today.</p>
            <a className="primary-link" href={`/guardian/${studentId}`}>Back to progress</a>
          </>
        )}
        {status === "ready" && practice && !caughtUp && practice.session.plan.cards.length === 0 && (
          <p className="empty">No cards available for today.</p>
        )}
        {status === "ready" && practice && !caughtUp && practice.session.plan.cards.length > 0 && (
          <>
            <button type="button" onClick={() => navigate(`/play/${studentId}/drill`)}>Start</button>
            <PracticeExit studentId={studentId} />
          </>
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
    } catch (err) {
      setSubmitError("Could not save that tap. Try again.");
      setBusy(false);
      throw err;
    }
    const next = advancePractice(studentId, practice);
    if (!next) {
      try {
        await completePractice(studentId, practice.session.id);
      } catch {
        /* completion is best-effort telemetry; never block the child's finish screen */
      }
      navigate(`/play/${studentId}/done`);
      return;
    }
    setPractice(next);
    setBusy(false);
  };

  if (!card) return null;

  return (
    <main className="page-shell student-mode">
      <div className="practice-surface">
        <PracticeExit studentId={studentId} disabled={busy} />
        <DrillCard key={`${card.skill_id}:${card.item_id}`} card={card} onScore={onScore} />
        {submitError && <p className="drill-alert" role="alert">{submitError}</p>}
      </div>
    </main>
  );
}

function DoneRoute({ studentId }: { studentId: string }) {
  return (
    <main className="page-shell student-mode">
      <section className="panel hero-panel done-panel">
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
  const [auth, setAuth] = useState<AuthMeResponse | null>(null);

  useEffect(() => {
    let active = true;
    getCurrentGuardian()
      .then((response) => active && setAuth(response))
      .catch(() => active && setAuth(null));
    return () => {
      active = false;
    };
  }, [path]);

  let route;
  if (path === "/signin") route = <SignInRoute />;
  else if (path === "/auth/consume") route = <AuthConsumeRoute />;
  else if (path === "/privacy") route = <PrivacyRoute />;
  else if (path === "/terms") route = <TermsRoute />;
  else if (path === "/guardian") route = <GuardianRoute operatorTools={auth?.capabilities?.operator_tools === true} />;
  else if (path === "/guardian/add-student") route = <AddStudentRoute />;
  else if (path === "/guardian/diag") route = <GuardianDiagRoute />;
  else if (path === "/guardian/audio-catalog") route = <AudioCatalogRoute />;
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
  const isPublicRoute = path === "/" || path === "/signin" || path === "/auth/consume" || path === "/privacy" || path === "/terms";
  const showNav = !isStudentMode && !isPublicRoute;
  const guardian = auth?.guardian ?? null;
  const operatorTools = auth?.capabilities?.operator_tools === true;
  return (
    showNav ? (
      <div className="guardian-layout">
        <GuardianNav guardian={guardian} operatorTools={operatorTools} />
        {route}
      </div>
    ) : route
  );
}

export default App;

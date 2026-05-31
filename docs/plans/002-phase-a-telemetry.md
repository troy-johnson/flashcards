# Reader's Way Telemetry Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Record practice-session completion and let the operator read restrained learning-routine telemetry by extending the existing gated `diag` endpoint — sessions started/completed, completion, average duration, and top friction items.

**Architecture:** Reuse existing `practice_session` and `attempt` tables (no migration). Add a `POST /practice/:studentId/complete` endpoint that writes `completed_at` (currently never set), wire the app to call it when a drill finishes, and grow `GET /guardian/diag` with additive `sessions` and `friction` aggregates. No analytics platform; the JSON endpoint is the reporting surface (Spec 002 D11, FR31).

**Tech Stack:** Hono, Cloudflare D1 (SQLite), Vitest (`@cloudflare/vitest-pool-workers`), React.

**Resolves:** Spec 002 planning nit 3 (FR30–FR32, D11, AC15).

---

### Task 1: Add the complete-session endpoint

**Files:**
- Modify: `api/src/routes/practice.ts`
- Test: `api/src/routes/telemetry.test.ts` (new)

- [ ] **Step 1: Write the failing test**

Create `api/src/routes/telemetry.test.ts`:

```ts
import { beforeEach, describe, expect, it } from "vitest";
import { env, SELF } from "cloudflare:test";
import { resetFoundationDb } from "../test/reset-db";

const seed = async () => {
  await resetFoundationDb();
  const now = new Date().toISOString();
  const future = new Date(Date.now() + 60_000).toISOString();
  await env.DB.prepare("INSERT INTO guardian (id, email, role, created_at) VALUES (?, ?, 'guardian', ?)").bind("g_diag", "local-guardian@example.com", now).run();
  await env.DB.prepare("INSERT INTO guardian (id, email, role, created_at) VALUES (?, ?, 'guardian', ?)").bind("g_other", "other@example.com", now).run();
  await env.DB.prepare("INSERT INTO session (id, guardian_id, expires_at, created_at) VALUES (?, ?, ?, ?)").bind("s_diag", "g_diag", future, now).run();
  await env.DB.prepare("INSERT INTO session (id, guardian_id, expires_at, created_at) VALUES (?, ?, ?, ?)").bind("s_other", "g_other", future, now).run();
  await env.DB.prepare("INSERT INTO student (id, guardian_id, display_name, grade, created_at) VALUES (?, ?, ?, ?, ?)").bind("student1", "g_diag", "Ada", "K", now).run();
};

describe("complete-session endpoint", () => {
  beforeEach(seed);

  it("writes completed_at and is idempotent", async () => {
    const start = await SELF.fetch("https://api.test/practice/student1/start", { method: "POST", headers: { cookie: "session=s_diag" } });
    const started = await start.json<{ practice_session: { id: string } }>();
    const sessionId = started.practice_session.id;

    const first = await SELF.fetch("https://api.test/practice/student1/complete", {
      method: "POST",
      headers: { "content-type": "application/json", cookie: "session=s_diag" },
      body: JSON.stringify({ practice_session_id: sessionId })
    });
    expect(first.status).toBe(200);
    const firstBody = await first.json<{ practice_session: { completed_at: string } }>();
    expect(firstBody.practice_session.completed_at).toBeTruthy();

    const row = await env.DB.prepare("SELECT completed_at FROM practice_session WHERE id = ?").bind(sessionId).first<{ completed_at: string | null }>();
    expect(row?.completed_at).toBe(firstBody.practice_session.completed_at);

    const second = await SELF.fetch("https://api.test/practice/student1/complete", {
      method: "POST",
      headers: { "content-type": "application/json", cookie: "session=s_diag" },
      body: JSON.stringify({ practice_session_id: sessionId })
    });
    const secondBody = await second.json<{ practice_session: { completed_at: string } }>();
    expect(secondBody.practice_session.completed_at).toBe(firstBody.practice_session.completed_at);
  });

  it("rejects completion of a session the caller does not own", async () => {
    const start = await SELF.fetch("https://api.test/practice/student1/start", { method: "POST", headers: { cookie: "session=s_diag" } });
    const started = await start.json<{ practice_session: { id: string } }>();
    const forbidden = await SELF.fetch("https://api.test/practice/student1/complete", {
      method: "POST",
      headers: { "content-type": "application/json", cookie: "session=s_other" },
      body: JSON.stringify({ practice_session_id: started.practice_session.id })
    });
    expect(forbidden.status).toBe(404);
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `pnpm --filter api exec vitest run src/routes/telemetry.test.ts`
Expected: FAIL — the `/complete` route returns 404 (no such route) so the first assertion `expect(first.status).toBe(200)` fails.

- [ ] **Step 3: Implement the complete endpoint**

In `api/src/routes/practice.ts`, add this handler immediately after the existing `practiceRoutes.post("/:studentId/start", ...)` block (it reuses the `ownsStudent` helper and `json` already imported):

```ts
practiceRoutes.post("/:studentId/complete", async (c) => {
  const guardian = c.get("guardian");
  const studentId = c.req.param("studentId");
  if (!(await ownsStudent(c.env, guardian.id, studentId))) return c.text("not found", 404);
  const body = await c.req.json().catch(() => null);
  const sessionId = body?.practice_session_id;
  if (typeof sessionId !== "string" || sessionId.length === 0) return c.text("invalid", 400);
  const row = await c.env.DB.prepare("SELECT id, completed_at FROM practice_session WHERE id = ? AND student_id = ?")
    .bind(sessionId, studentId).first<{ id: string; completed_at: string | null }>();
  if (!row) return c.text("practice session not found", 404);
  if (row.completed_at) return json({ practice_session: { id: sessionId, completed_at: row.completed_at } });
  const completedAt = new Date().toISOString();
  await c.env.DB.prepare("UPDATE practice_session SET completed_at = ? WHERE id = ?").bind(completedAt, sessionId).run();
  return json({ practice_session: { id: sessionId, completed_at: completedAt } });
});
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `pnpm --filter api exec vitest run src/routes/telemetry.test.ts`
Expected: PASS (both tests).

- [ ] **Step 5: Commit**

```bash
git add api/src/routes/practice.ts api/src/routes/telemetry.test.ts
git commit -m "feat(api): record practice-session completion"
```

---

### Task 2: Extend the diag endpoint with session and friction aggregates

**Files:**
- Modify: `api/src/routes/diag.ts`
- Test: `api/src/routes/telemetry.test.ts` (add a describe block)

- [ ] **Step 1: Write the failing test**

Append this `describe` block to `api/src/routes/telemetry.test.ts`:

```ts
describe("diag telemetry aggregates", () => {
  beforeEach(seed);

  it("reports sessions started/completed and top friction items", async () => {
    const startedAt = new Date(Date.now() - 5 * 60_000).toISOString();
    const completedAt = new Date(Date.now() - 4 * 60_000).toISOString();
    // One completed session, one still open.
    await env.DB.prepare("INSERT INTO practice_session (id, student_id, plan_json, started_at, completed_at) VALUES (?, ?, '{}', ?, ?)").bind("ps_done", "student1", startedAt, completedAt).run();
    await env.DB.prepare("INSERT INTO practice_session (id, student_id, plan_json, started_at) VALUES (?, ?, '{}', ?)").bind("ps_open", "student1", startedAt).run();
    // Friction: two misses on the same item.
    const ins = "INSERT INTO attempt (id, practice_session_id, student_id, skill_id, item_id, result, scoring_source, duration_ms, shown_at, scored_at) VALUES (?, ?, ?, ?, ?, ?, 'guardian_tap', 1000, ?, ?)";
    await env.DB.prepare(ins).bind("a1", "ps_done", "student1", "phonics_k_u1_short_a", "word_cat", "incorrect", startedAt, completedAt).run();
    await env.DB.prepare(ins).bind("a2", "ps_done", "student1", "phonics_k_u1_short_a", "word_cat", "skipped", startedAt, completedAt).run();
    await env.DB.prepare(ins).bind("a3", "ps_done", "student1", "phonics_k_u1_short_a", "word_map", "correct", startedAt, completedAt).run();

    const res = await SELF.fetch("https://api.test/guardian/diag", { headers: { cookie: "session=s_diag" } });
    expect(res.status).toBe(200);
    const body = await res.json<{
      sessions: { student_id: string; started: number; completed: number; avg_duration_ms: number | null }[];
      friction: { student_id: string; skill_id: string; item_id: string; misses: number }[];
    }>();

    const student1Sessions = body.sessions.find((s) => s.student_id === "student1");
    expect(student1Sessions).toMatchObject({ started: 2, completed: 1 });
    expect(student1Sessions!.avg_duration_ms).toBeGreaterThan(0);

    const topFriction = body.friction[0]!;
    expect(topFriction).toMatchObject({ item_id: "word_cat", misses: 2 });
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `pnpm --filter api exec vitest run src/routes/telemetry.test.ts`
Expected: FAIL — `body.sessions` is undefined (diag does not return it yet), so `body.sessions.find` throws.

- [ ] **Step 3: Implement the aggregates**

Replace the body of the handler in `api/src/routes/diag.ts` (keep the imports and the auth/gate lines). The handler becomes:

```ts
diagRoutes.get("/", async (c) => {
  const guardian = await getAuthenticatedGuardian(c);
  if (!guardian) return c.text("unauthorized", 401);
  if (guardian.email !== c.env.DIAG_GUARDIAN_EMAIL) return c.text("forbidden", 403);

  const { results: summary } = await c.env.DB.prepare(
    `SELECT a.student_id, a.skill_id, a.item_id, a.result, COUNT(*) AS attempts
       FROM attempt a
       JOIN student s ON s.id = a.student_id
      WHERE s.guardian_id = ?
      GROUP BY a.student_id, a.skill_id, a.item_id, a.result
      ORDER BY a.student_id, a.skill_id, a.item_id, a.result`
  ).bind(guardian.id).all<{ student_id: string; skill_id: string; item_id: string; result: string; attempts: number }>();

  const { results: sessions } = await c.env.DB.prepare(
    `SELECT p.student_id,
            COUNT(*) AS started,
            SUM(CASE WHEN p.completed_at IS NOT NULL THEN 1 ELSE 0 END) AS completed,
            AVG(CASE WHEN p.completed_at IS NOT NULL
                     THEN (julianday(p.completed_at) - julianday(p.started_at)) * 86400000
                     END) AS avg_duration_ms
       FROM practice_session p
       JOIN student s ON s.id = p.student_id
      WHERE s.guardian_id = ?
      GROUP BY p.student_id
      ORDER BY p.student_id`
  ).bind(guardian.id).all<{ student_id: string; started: number; completed: number; avg_duration_ms: number | null }>();

  const { results: friction } = await c.env.DB.prepare(
    `SELECT a.student_id, a.skill_id, a.item_id, COUNT(*) AS misses
       FROM attempt a
       JOIN student s ON s.id = a.student_id
      WHERE s.guardian_id = ? AND a.result IN ('incorrect', 'skipped')
      GROUP BY a.student_id, a.skill_id, a.item_id
      ORDER BY misses DESC, a.student_id, a.skill_id, a.item_id
      LIMIT 10`
  ).bind(guardian.id).all<{ student_id: string; skill_id: string; item_id: string; misses: number }>();

  return json({ guardian: { id: guardian.id, email: guardian.email }, summary, sessions, friction });
});
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `pnpm --filter api exec vitest run src/routes/telemetry.test.ts`
Expected: PASS (all telemetry tests).

- [ ] **Step 5: Run the full api suite to confirm no regression**

Run: `pnpm --filter api test`
Expected: PASS (existing practice/auth tests still pass; the diag response is additive so the existing `gates diagnostics` test in `practice.test.ts` is unaffected).

- [ ] **Step 6: Commit**

```bash
git add api/src/routes/diag.ts api/src/routes/telemetry.test.ts
git commit -m "feat(api): add session and friction aggregates to diag"
```

---

### Task 3: Call complete from the app when a drill finishes

**Files:**
- Modify: `app/src/api/literacy.ts`
- Modify: `app/src/App.tsx` (DrillRoute)
- Test: `app/src/routes/play.test.tsx` (add a case if the file's harness supports it; otherwise rely on Task 4 typecheck)

- [ ] **Step 1: Add the client function**

In `app/src/api/literacy.ts`, add after `scoreAttempt`:

```ts
export const completePractice = (studentId: string, practiceSessionId: string): Promise<{ practice_session: { id: string; completed_at: string } }> =>
  apiFetch<{ practice_session: { id: string; completed_at: string } }>(`/practice/${studentId}/complete`, {
    method: "POST",
    body: JSON.stringify({ practice_session_id: practiceSessionId })
  });
```

- [ ] **Step 2: Call it when the last card is scored**

In `app/src/App.tsx`, add `completePractice` to the existing import from `./api/literacy` (insert it in the alphabetized import list, e.g. after `consumeMagicLink,`):

```tsx
  completePractice,
```

Then in `DrillRoute.onScore`, change the end-of-session branch from:

```tsx
    const next = advancePractice(studentId, practice);
    if (!next) {
      navigate(`/play/${studentId}/done`);
      return;
    }
```

to:

```tsx
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
```

- [ ] **Step 3: Typecheck the app**

Run: `pnpm --filter app typecheck`
Expected: PASS.

- [ ] **Step 4: Run the app test suite**

Run: `pnpm --filter app test`
Expected: PASS (existing route tests, including `play.test.tsx`, still pass — completion is awaited inside a try/catch and does not change navigation behavior).

- [ ] **Step 5: Commit**

```bash
git add app/src/api/literacy.ts app/src/App.tsx
git commit -m "feat(app): mark practice session complete on finish"
```

---

### Task 4: Surface the telemetry aggregates in the diagnostics view

**Files:**
- Modify: `app/src/api/types.ts`
- Modify: `app/src/api/literacy.ts`
- Modify: `app/src/App.tsx` (GuardianDiagRoute)

- [ ] **Step 1: Add response types**

In `app/src/api/types.ts`, add (near the existing `DiagnosticSummaryRow` type — Read the file first to match the exact existing names/exports):

```ts
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
```

- [ ] **Step 2: Widen the diag client return type**

In `app/src/api/literacy.ts`, update the `getGuardianDiag` signature and the imported types. Change the import line to include the new types:

```ts
import type { AttemptInput, DiagnosticSummaryRow, FrictionRow, Guardian, PracticeSession, SessionSummaryRow, Student } from "./types";
```

and change `getGuardianDiag` to:

```ts
export const getGuardianDiag = (): Promise<{ guardian: Guardian; summary: DiagnosticSummaryRow[]; sessions: SessionSummaryRow[]; friction: FrictionRow[] }> =>
  apiFetch<{ guardian: Guardian; summary: DiagnosticSummaryRow[]; sessions: SessionSummaryRow[]; friction: FrictionRow[] }>("/guardian/diag");
```

- [ ] **Step 3: Make the existing `summary`-only consumer tolerant of the wider type**

`StudentDashboardRoute` calls `getGuardianDiag().catch(() => ({ summary: [] as DiagnosticSummaryRow[] }))`. Widen that fallback so the types stay compatible. In `app/src/App.tsx`, change:

```tsx
    Promise.all([getStudent(studentId), getGuardianDiag().catch(() => ({ summary: [] as DiagnosticSummaryRow[] }))])
```

to:

```tsx
    Promise.all([getStudent(studentId), getGuardianDiag().catch(() => ({ summary: [] as DiagnosticSummaryRow[], sessions: [], friction: [] }))])
```

- [ ] **Step 4: Render the aggregates in `GuardianDiagRoute`**

In `app/src/App.tsx`, update `GuardianDiagRoute`'s state type and import. Change the import type line for the route's `useState` (the file imports types at top — add `SessionSummaryRow, FrictionRow` to the existing `import type { ... } from "./api/types";`):

```tsx
import type { AttemptResult, DiagnosticSummaryRow, FrictionRow, Guardian, SessionSummaryRow, Student } from "./api/types";
```

Change the `GuardianDiagRoute` state declaration from:

```tsx
  const [data, setData] = useState<{ guardian: Guardian; summary: DiagnosticSummaryRow[] } | null>(null);
```

to:

```tsx
  const [data, setData] = useState<{ guardian: Guardian; summary: DiagnosticSummaryRow[]; sessions: SessionSummaryRow[]; friction: FrictionRow[] } | null>(null);
```

Then, inside the `status === "ready" && data && (` block, immediately before the existing `data.summary.length === 0 ? (` expression, render the session/friction summary. Wrap the existing summary table and the new blocks in a fragment. Replace:

```tsx
        {status === "ready" && data && (
          data.summary.length === 0 ? (
```

with:

```tsx
        {status === "ready" && data && (
          <>
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
```

Then close the added fragment: the existing block ends with

```tsx
          )
        )}
```

(the `)` closing the `data.summary.length === 0 ? (...) : (...)` ternary, then `)}` closing the `status === "ready" && data && (`). Change that to:

```tsx
            )}
          </>
        )}
```

(i.e. the ternary's outer parentheses become `)}` for the attempts block, and the `</>` closes the fragment opened above).

> Note for the implementer: this JSX restructure is fiddly — after editing, rely on Step 5's typecheck/build to confirm the fragment is balanced. If the build reports a JSX nesting error, re-Read `GuardianDiagRoute` and verify every opened tag/fragment/ternary is closed exactly once.

- [ ] **Step 5: Typecheck and build**

Run: `pnpm --filter app typecheck`
Expected: PASS.

Run: `pnpm --filter app build`
Expected: Vite build succeeds.

- [ ] **Step 6: Run the app test suite**

Run: `pnpm --filter app test`
Expected: PASS.

- [ ] **Step 7: Commit**

```bash
git add app/src/api/types.ts app/src/api/literacy.ts app/src/App.tsx
git commit -m "feat(app): show session and friction telemetry in diagnostics"
```

---

### Task 5: Full-workspace verification

**Files:** none (verification only)

- [ ] **Step 1: Run the whole workspace gate**

Run: `pnpm -r typecheck && pnpm -r test`
Expected: typecheck and all tests pass in `app` and `api`.

- [ ] **Step 2: Commit (empty marker if nothing changed)**

```bash
git commit -m "chore: verify telemetry across workspace" --allow-empty
```

---

## Self-review notes

- **FR30** (track sessions started/completed, duration, drill completion, retry/accuracy, progress, friction) — `sessions` aggregate (started/completed/avg_duration_ms) + existing `summary` (per-skill/item correct vs total) + `friction` (top misses). Completion now recorded via Task 1.
- **FR31** (no broad surveillance clickstream) — only session-level and per-item aggregates; no per-event tracking added.
- **FR32** (answer: are families using it / where stuck / progressing) — sessions (using it), friction (stuck), summary (progressing).
- **AC15** (records sessions started/completed, completion/progress summaries, friction without clickstream) — covered by Tasks 1–2; surfaced in Task 4.
- **No migration needed** — `practice_session.completed_at` and `attempt` already exist in `0001_foundation.sql`.
- **Backwards compatibility** — diag response is additive (`sessions`, `friction` added; `summary` unchanged), so the existing `StudentDashboardRoute` consumer keeps working (fallback widened in Task 4 Step 3).

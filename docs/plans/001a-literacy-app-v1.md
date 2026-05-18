# Plan 001a — Literacy App v1 First Previewable Foundation

**Spec:** [`docs/specs/001-literacy-app-v1-design.md`](../specs/001-literacy-app-v1-design.md)  
**Status:** revision after adversarial rejection  
**Date:** 2026-05-17  
**Branch:** `plan/001a-literacy-app-v1`  
**Execution mode:** batch by wave; each wave requires approval before implementation starts  
**Wave mode:** enabled; tasks may run in parallel within a wave only when marked eligible

## 1. Scope

This plan covers the first previewable foundation slice for Literacy App v1.0. It does not attempt to finish the full v1.0 shippable content bar. It creates the technical and process foundation needed for later plans to expand content, tune the scheduler, complete audio/PWA readiness, and prepare launch.

### Goals

1. Produce the first end-to-end guardian-tap practice loop within the scope envelope below: magic-link sign-in (dev-log issuer), student profile, fixture-driven daily plan, one Phonics card type with text-only presentation, guardian-tap result, persisted attempt, and guardian-visible progress.
2. Establish mandatory PR checklist gates for child-facing UX, scheduler, content, preview, D1 migrations, and telemetry, annotated `[CI]` vs `[reviewer]` so accountability is explicit.
3. Schedule the first content QA pass before content can become a dependency for scheduler tuning.
4. Establish the minimal telemetry baseline before scheduler tuning starts.
5. Define required D1 migrations before the first previewable slice.
6. Record recurring obligations as cadence rather than single-owner tasks.

### Scope envelope (what 001a ships vs. defers)

| Area | 001a ships | Deferred to (see §13) |
| --- | --- | --- |
| Drill modes | one Phonics card with guardian-tap controls | PA, Heart Words, Fluency cards → 001e |
| Plan generator | deterministic fixture-driven `plan_json` from seed content | SRS scheduler, mastery state machine, skill graduation, 60/25/15 mix, interleaving → 001c |
| Audio | none (text-only Phonics card) | R2 binding, `audio/manifest.json` author, preloading, TTS fallback → 001d |
| Magic-link issuer | `dev-log` (logs URL to Worker console) | Real Resend or Cloudflare Email Routing issuer → 001f |
| UI stack | Vite default + react-ts; no Tailwind, Lexend, react-router, Zustand, or TanStack Query yet | PWA toolchain (`vite-plugin-pwa`), Tailwind, Lexend, react-router, Zustand, TanStack Query, `/content/VERSION` → 001b |
| Schema | full v1.0 foundation schema applied | none — schema is forward-only from 001a onward |
| Auth | magic-link end-to-end with HttpOnly Secure SameSite=Lax cookie + single-use token + expiry tests | password/social auth → never (out of v1.0 entirely) |

### Non-goals

- Full v1.0 content bar completion.
- Mic-based auto-scoring; v1.0 remains guardian-tap only.
- Teacher/classroom UI, roster code, classroom affordances, or Grade 2 content.
- State standards crosswalk or per-state filtering.
- D1-backed content editing; content remains repo JSON.
- Complete recorded audio for all words/sentences.
- Capacitor/native app wrapper.

## 2. Acceptance coverage

| Spec requirement | 001a coverage |
| --- | --- |
| Guardian/student naming from day one | D1 schema, route naming, API model naming, and UI data types use `guardian` and `student`. |
| Guardian-tap scoring only | Drill API accepts `scoring_source = guardian_tap`; mic code is not created in this plan. |
| Attempt log as source of truth | `attempt` table is created before preview and receives each scored card. |
| First daily plan committed | `practice_session.plan_json` stores the generated plan for the preview loop. |
| Content as repo JSON | Seed content lives under `/content/`; D1 contains no content tables. |
| First previewable child-facing loop | `/play/:studentId/drill` renders one Phonics card (text-only) and persists guardian taps. PA, Heart, Fluency cards deferred to 001e. |
| Preview gate for child-facing changes | PR template requires preview URL exercise for `app/src/drill/`, `app/src/components/cards/`, and `/content/`. |
| Content validation as release gate | `scripts/content-validate.ts` validates IDs, references, audio manifest references, first-unit prerequisites, grade-band prereq sanity, ID immutability vs `main` snapshot, and `deprecated: true` enforcement. |
| Minimal scheduler telemetry | `/guardian/diag` reads attempts and practice sessions before scheduler tuning begins. |
| D1 forward-only posture | First migrations are additive; rollback notes require forward-fix for schema mistakes. |
| Scope discipline | Plan explicitly excludes mic, classroom, state filters, D1 content editing, and launch content completion. |

### Follow-up question coverage

| Follow-up question | Plan section |
| --- | --- |
| First milestone producing an end-to-end guardian-tap practice loop | §1 Goals, §9 Wave 3, §9 Wave 4 |
| Mandatory PR checklist gates | §5 |
| First content QA pass timing | §6 |
| Minimal telemetry baseline before scheduler tuning | §7 |
| Required D1 migrations before the first previewable slice | §4 |

## 3. File surface

### Created

| Path | Responsibility |
| --- | --- |
| `package.json` | Workspace scripts for install, dev, lint, typecheck, test, content validation, migrations, and replay. |
| `pnpm-workspace.yaml` | Workspace package discovery for `app` and `api`. |
| `tsconfig.base.json` | Shared strict TypeScript defaults. |
| `.github/pull_request_template.md` | Mandatory PR checklist gates annotated `[CI]` vs `[reviewer]`. |
| `.github/workflows/ci.yml` | CI job that runs the `[CI]` gates on every PR. |
| `scripts/check-sentinel.sh` | CI grep gate that fails if the sentinel D1 UUID appears in the PR diff against `main`. |
| `app/` | React + Vite + TypeScript SPA. |
| `app/package.json` | App workspace scripts (`dev`, `lint`, `typecheck`, `test`) so root `pnpm dev` resolves. |
| `app/tsconfig.json` | App-specific strict TypeScript config extending `tsconfig.base.json`. |
| `api/` | Cloudflare Workers + Hono API. |
| `api/package.json` | API workspace scripts and dependencies for Wrangler, Hono, Vitest, and Cloudflare worker-pool tests. |
| `api/tsconfig.json` | API-specific strict TypeScript config extending `tsconfig.base.json` and worker types. |
| `api/vitest.config.ts` | Vitest config using `@cloudflare/vitest-pool-workers` so auth route tests resolve `cloudflare:test`. |
| `api/wrangler.toml` | Worker, D1 binding, preview environment, and diagnostic email variable placeholders. |
| `api/migrations/0001_foundation.sql` | Guardian, auth, session, student, mastery, practice session, and attempt tables. |
| `api/src/index.ts` | Worker/Hono entrypoint and route mounting. |
| `api/src/types.ts` | Shared Worker binding and auth context types. |
| `api/src/db/client.ts` | D1 query helpers. |
| `api/src/db/schema.ts` | TypeScript row types matching the foundation migration. |
| `api/src/db/session.ts` | Session cookie lookup, creation, expiration, and clearing helpers. |
| `api/src/email/magic-link.ts` | Magic-link issuer abstraction with `dev-log` issuer for preview/local. |
| `api/src/routes/auth.ts` | Magic-link auth start/consume/me/logout endpoints and session cookie behavior. |
| `api/src/routes/students.ts` | Guardian-owned student CRUD for the preview loop. |
| `api/src/routes/practice.ts` | Daily plan creation and guardian-tap attempt persistence. |
| `api/src/routes/diag.ts` | Guardian diagnostic summary gated by configured email. |
| `api/src/routes/auth.test.ts` | Vitest scaffold exercising single-use, expiry, cookie attrs, `/auth/me`, logout. |
| `content/` | Seed repo JSON content and scheduler config. |
| `scripts/content-validate.ts` | Content gate. |
| `scripts/replay-attempts.ts` | Scheduler replay scaffold. |
| `docs/plans/001a-literacy-app-v1.md` | This implementation plan. |

### Modified

| Path | Responsibility |
| --- | --- |
| `docs/plans/INDEX.md` | Add plan entry. |
| `docs/state/workflow-state.md` | Mark plan drafted and point to active artifact. |
| `.gitignore` | Add generated dependency/build/local environment paths if absent. |
| `README.md` | Replace static-site-only instructions with workspace dev/preview notes. |

### Deleted

| Path | Reason |
| --- | --- |
| `index.html` | Spec says no coexistence; first implementation PR replaces static prototype. |
| `app.js` | Spec says no coexistence; first implementation PR replaces static prototype. |
| `styles.css` | Spec says no coexistence; first implementation PR replaces static prototype. |

### Protected path check

No protected file path from the Axon protected-path list is directly in scope. Auth code is in `api/src/routes/auth.ts`, not `auth/config`, and no `.env*`, secrets, keys, credentials, Terraform state, or Kubernetes secret files are planned.

## 4. Required D1 migrations before first previewable slice

The first previewable slice cannot start without `api/migrations/0001_foundation.sql` applied to the preview D1 database. The migration must create `guardian`, `auth_token`, `session`, `student`, `skill_mastery`, `item_mastery`, `practice_session`, and `attempt`.

Migration rules:

- Use `guardian` and `student` naming immediately.
- Include nullable `student.classroom_id`; do not create classroom tables or classroom UI.
- Store content references as JSON IDs; do not create content tables.
- Include `attempt.mic_transcript` and `attempt.mic_confidence` fields for schema forward compatibility, but keep values null in 001a because mic scoring is out of scope.
- Treat D1 migrations as forward-only. If preview reveals a migration defect, fix with a new migration rather than editing already-applied production migrations.

## 5. Mandatory PR checklist gates

Every implementation PR after this plan must include a checklist with these gates. Each gate is tagged `[CI]` (verified automatically by `.github/workflows/ci.yml`) or `[reviewer]` (verified by a human reviewer signing off):

- [ ] `[CI]` `pnpm lint` passes.
- [ ] `[CI]` `pnpm typecheck` passes.
- [ ] `[CI]` `pnpm test` passes (a no-test PR fails CI and requires `[reviewer]` rationale to override).
- [ ] `[CI]` `pnpm content:validate` passes (always — script is cheap and idempotent).
- [ ] `[CI]` `scripts/check-sentinel.sh` confirms the sentinel D1 UUID `00000000-0000-4000-8000-000000000001` does not appear in the diff against `main`.
- [ ] `[reviewer]` D1 migration list is explicit when `api/migrations/` changes.
- [ ] `[reviewer]` Preview URL is attached when child-facing UX, scheduler, or content changes.
- [ ] `[reviewer]` Preview exercise notes are attached for changes under `app/src/drill/`, `app/src/components/cards/`, or `/content/`.
- [ ] `[reviewer]` `/guardian/diag` impact is stated when scheduler, mastery, practice session, or attempt logging changes.
- [ ] `[reviewer]` Scope-creep check confirms no mic scoring, classroom UI, state filtering, D1 content editing, Grade 2, vocab, or comprehension work entered v1.0 foundation scope.

## 6. First content QA pass timing

The first content QA pass occurs after seed content validates and before any scheduler tuning task begins. The pass reviews only the seed slice required for the first preview loop: one phonemic-awareness skill, one phonics/decoding skill, one heart-word batch with regular/irregular tags, one fluency sentence band, and audio manifest references or explicit TTS fallback status.

Exit criteria:

- `pnpm content:validate` passes.
- Every seed item has a stable `item_id`.
- Every seed skill has a stable `skill_id`.
- First-unit prerequisites are clean.
- No scheduler tuning work begins until QA findings are fixed or logged as accepted seed limitations.

## 7. Minimal telemetry baseline before scheduler tuning

Scheduler tuning is blocked until the foundation slice captures and displays:

- `practice_session.plan_json` for each started daily plan;
- one `attempt` row per guardian-tap result;
- `attempt.result` with `correct`, `incorrect`, or `skipped`;
- `attempt.scoring_source = guardian_tap`;
- `attempt.duration_ms`, `shown_at`, and `scored_at`;
- `/guardian/diag` summary of attempts by student, skill, item, and result;
- replay script smoke output showing that attempt rows can be loaded and passed through a candidate scheduler config.

## 8. Recurring obligations cadence

| Cadence | Obligation | Starts |
| --- | --- | --- |
| Every child-facing PR | Preview pass on the PR URL with notes in PR checklist. | First PR touching drill/cards/content. |
| Every content PR | Content QA pass plus `pnpm content:validate`. | First `/content/` PR. |
| Weekly during pilot | Manual two-tester `/guardian/diag` review for scheduler pathologies and bad content. | After first two testers have usable preview data. |
| Every scheduler change | Run `scripts/replay-attempts.ts` against existing attempts before shipping. | After first pilot attempts exist in preview D1; until then the script reports the no-fixtures message and the gate is informational. |

## 9. Wave execution plan

Implementation will be approved one wave at a time. Within a wave, tasks marked parallel-eligible can run concurrently if they do not touch the same file scope.

### Wave 1 — Workspace scaffold

#### Task 1.1 — Author workspace package scripts

- **Wave:** 1
- **File scope:** `package.json`, `pnpm-workspace.yaml`, `tsconfig.base.json`
- **Dependency group:** none
- **Parallel eligibility:** no; this task creates scripts used by later waves
- **Required reviewer:** plan owner
- **Worktree dispatch notes:** run in the primary worktree before any parallel work starts

Payload to author:

```json
{
  "name": "flashcards-literacy-app",
  "private": true,
  "packageManager": "pnpm@9.15.0",
  "scripts": {
    "dev": "pnpm --parallel --filter app --filter api dev",
    "lint": "pnpm --recursive lint",
    "typecheck": "pnpm --recursive typecheck",
    "test": "pnpm --recursive test",
    "content:validate": "tsx scripts/content-validate.ts",
    "replay:attempts": "tsx scripts/replay-attempts.ts",
    "db:migrations:list": "wrangler d1 migrations list literacy_preview --config api/wrangler.toml"
  },
  "devDependencies": {
    "tsx": "^4.19.2",
    "typescript": "^5.7.2"
  }
}
```

```yaml
packages:
  - app
  - api
```

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "Bundler",
    "strict": true,
    "noUncheckedIndexedAccess": true,
    "exactOptionalPropertyTypes": true,
    "skipLibCheck": true
  }
}
```

Command:

```sh
pnpm --version && pnpm db:migrations:list
```

Expected output: pnpm reports a version; migration-list may fail only because the D1 database has not been provisioned yet, not because the script is missing.

#### Task 1.2 — Scaffold app and API directories

- **Wave:** 1
- **File scope:** `app/`, `api/`
- **Dependency group:** Task 1.1
- **Parallel eligibility:** no
- **Required reviewer:** plan owner
- **Worktree dispatch notes:** same worktree as Task 1.1

Commands:

```sh
pnpm create vite app --template react-ts
mkdir -p api/src/routes api/src/db api/src/email api/migrations scripts content/items content/audio .github/workflows
```

Minimum `app/package.json` payload (the Vite scaffold's default scripts are sufficient; this payload makes the contract explicit and locks the test runner):

```json
{
  "name": "app",
  "private": true,
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview",
    "lint": "tsc --noEmit",
    "typecheck": "tsc --noEmit",
    "test": "vitest run"
  },
  "devDependencies": {
    "vitest": "^2.1.8",
    "@vitest/ui": "^2.1.8",
    "jsdom": "^25.0.1"
  }
}
```

Minimum `api/package.json` payload:

```json
{
  "name": "api",
  "private": true,
  "type": "module",
  "scripts": {
    "dev": "wrangler dev --config wrangler.toml",
    "lint": "tsc --noEmit",
    "typecheck": "tsc --noEmit",
    "test": "vitest run"
  },
  "dependencies": {
    "@hono/zod-validator": "^0.4.2",
    "hono": "^4.6.16",
    "ulid": "^2.3.0",
    "zod": "^3.24.1"
  },
  "devDependencies": {
    "@cloudflare/vitest-pool-workers": "^0.5.41",
    "@cloudflare/workers-types": "^4.20241230.0",
    "vitest": "^2.1.8",
    "wrangler": "^3.99.0"
  }
}
```

Minimum `app/tsconfig.json` payload:

```json
{
  "extends": "../tsconfig.base.json",
  "compilerOptions": {
    "jsx": "react-jsx",
    "types": ["vite/client", "vitest/globals"]
  },
  "include": ["src"]
}
```

Minimum `api/tsconfig.json` payload:

```json
{
  "extends": "../tsconfig.base.json",
  "compilerOptions": {
    "types": ["@cloudflare/workers-types", "vitest/globals"]
  },
  "include": ["src", "vitest.config.ts"]
}
```

Minimum `api/vitest.config.ts` payload:

```ts
import { defineWorkersConfig } from "@cloudflare/vitest-pool-workers/config";

export default defineWorkersConfig({
  test: {
    poolOptions: {
      workers: {
        wrangler: { configPath: "./wrangler.toml" }
      }
    }
  }
});
```

Expected output: `app/`, `api/`, `scripts/`, and `content/` foundation directories exist.

#### Task 1.3 — Replace static prototype with workspace install

- **Wave:** 1
- **File scope:** `index.html`, `app.js`, `styles.css`, lockfile, package manifests
- **Dependency group:** Task 1.2
- **Parallel eligibility:** no
- **Required reviewer:** plan owner
- **Worktree dispatch notes:** same worktree; do not leave legacy static files beside the new app

Command:

```sh
rm index.html app.js styles.css
pnpm install
```

Expected output: legacy files are absent and `pnpm-lock.yaml` installs successfully.

#### Task 1.4 — Author CI workflow and sentinel-check gate

- **Wave:** 1
- **File scope:** `.github/workflows/ci.yml`, `scripts/check-sentinel.sh`
- **Dependency group:** Task 1.3
- **Parallel eligibility:** no
- **Required reviewer:** plan owner
- **Worktree dispatch notes:** must land before Task 2.1 introduces the sentinel UUID

Payload to author — `scripts/check-sentinel.sh`:

```sh
#!/usr/bin/env bash
set -euo pipefail
SENTINEL="00000000-0000-4000-8000-000000000001"
BASE_REF="${BASE_REF:-origin/main}"
# Fetch base ref only if we're in a CI shallow clone; ignore failure for local runs.
git fetch --no-tags --depth=1 origin main >/dev/null 2>&1 || true
if git diff "$BASE_REF"...HEAD -- . | grep -F "$SENTINEL" >/dev/null; then
  echo "[check-sentinel] sentinel D1 UUID present in diff against $BASE_REF; replace with the real preview D1 UUID before merging" >&2
  exit 1
fi
echo "[check-sentinel] ok: sentinel D1 UUID not present in diff against $BASE_REF"
```

Payload to author — `.github/workflows/ci.yml`:

```yaml
name: ci
on:
  pull_request:
    branches: [main]
  push:
    branches: [main]
concurrency:
  group: ci-${{ github.ref }}
  cancel-in-progress: true
jobs:
  verify:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
        with:
          fetch-depth: 0
      - uses: pnpm/action-setup@v4
        with:
          version: 9.15.0
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: pnpm
      - run: pnpm install --frozen-lockfile
      - run: pnpm lint
      - run: pnpm typecheck
      - run: pnpm test
      - run: pnpm content:validate
      - run: bash scripts/check-sentinel.sh
        env:
          BASE_REF: origin/${{ github.base_ref || 'main' }}
```

Command:

```sh
chmod +x scripts/check-sentinel.sh && bash scripts/check-sentinel.sh
```

Expected output: on a branch with no sentinel UUID in its diff against `main`, the script prints the ok message and exits 0. After Task 2.1 introduces the sentinel UUID, the script exits 1 until the implementation PR replaces it with the real preview D1 UUID.

### Wave 2 — Foundation schema and seed content

#### Task 2.1 — Author Cloudflare Worker configuration

- **Wave:** 2
- **File scope:** `api/wrangler.toml`
- **Dependency group:** Wave 1
- **Parallel eligibility:** yes; independent of content validator work
- **Required reviewer:** security-aware reviewer because auth/session and D1 binding names are introduced
- **Worktree dispatch notes:** may run in a separate worktree if Task 2.3 owns only `/content/`

Payload to author:

```toml
name = "literacy-api"
main = "src/index.ts"
compatibility_date = "2026-05-17"

[vars]
APP_ORIGIN = "http://localhost:5173"
DIAG_GUARDIAN_EMAIL = "local-guardian@example.com"
AUTH_EMAIL_ISSUER = "dev-log"

[[d1_databases]]
binding = "DB"
database_name = "literacy_preview"
database_id = "00000000-0000-4000-8000-000000000001"

[env.preview.vars]
APP_ORIGIN = "https://literacy-app-preview.pages.dev"
DIAG_GUARDIAN_EMAIL = "pilot-guardian@example.com"
AUTH_EMAIL_ISSUER = "dev-log"

[[env.preview.d1_databases]]
binding = "DB"
database_name = "literacy_preview"
database_id = "00000000-0000-4000-8000-000000000001"
```

Before applying migrations to a real Cloudflare preview environment, replace the sentinel UUID `00000000-0000-4000-8000-000000000001` with the actual UUID returned by `wrangler d1 create literacy_preview`; the sentinel must not appear in the implementation PR's final diff.

Command:

```sh
pnpm db:migrations:list
```

Expected output: the command reaches Wrangler with a configured `api/wrangler.toml`; final implementation diff contains the actual preview D1 UUID, not the sentinel UUID.

#### Task 2.2 — Add D1 foundation migration

- **Wave:** 2
- **File scope:** `api/migrations/0001_foundation.sql`, `api/src/db/schema.ts`
- **Dependency group:** Task 2.1
- **Parallel eligibility:** no; migration verification depends on the Worker config
- **Required reviewer:** data/schema reviewer
- **Worktree dispatch notes:** same worktree as Task 2.1

Payload to author:

```sql
CREATE TABLE guardian (
  id TEXT PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  role TEXT NOT NULL DEFAULT 'guardian' CHECK (role = 'guardian'),
  display_name TEXT,
  created_at TEXT NOT NULL,
  last_seen_at TEXT
);

CREATE TABLE auth_token (
  token_hash TEXT PRIMARY KEY,
  guardian_id TEXT NOT NULL REFERENCES guardian(id),
  expires_at TEXT NOT NULL,
  consumed_at TEXT
);

CREATE TABLE session (
  id TEXT PRIMARY KEY,
  guardian_id TEXT NOT NULL REFERENCES guardian(id),
  expires_at TEXT NOT NULL,
  created_at TEXT NOT NULL
);

CREATE TABLE student (
  id TEXT PRIMARY KEY,
  guardian_id TEXT NOT NULL REFERENCES guardian(id),
  classroom_id TEXT,
  display_name TEXT NOT NULL,
  grade TEXT NOT NULL CHECK (grade IN ('K', '1')),
  birth_month TEXT,
  prefs_json TEXT NOT NULL DEFAULT '{}',
  created_at TEXT NOT NULL,
  archived_at TEXT
);

CREATE TABLE skill_mastery (
  student_id TEXT NOT NULL REFERENCES student(id),
  skill_id TEXT NOT NULL,
  level INTEGER NOT NULL DEFAULT 0 CHECK (level BETWEEN 0 AND 4),
  streak INTEGER NOT NULL DEFAULT 0,
  ease REAL NOT NULL DEFAULT 2.5,
  due_at TEXT,
  last_seen_at TEXT,
  PRIMARY KEY (student_id, skill_id)
);

CREATE TABLE item_mastery (
  student_id TEXT NOT NULL REFERENCES student(id),
  item_id TEXT NOT NULL,
  skill_id TEXT NOT NULL,
  level INTEGER NOT NULL DEFAULT 0 CHECK (level BETWEEN 0 AND 4),
  streak INTEGER NOT NULL DEFAULT 0,
  ease REAL NOT NULL DEFAULT 2.5,
  due_at TEXT,
  last_seen_at TEXT,
  PRIMARY KEY (student_id, item_id)
);

CREATE TABLE practice_session (
  id TEXT PRIMARY KEY,
  student_id TEXT NOT NULL REFERENCES student(id),
  plan_json TEXT NOT NULL,
  started_at TEXT NOT NULL,
  completed_at TEXT,
  bonus_count INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE attempt (
  id TEXT PRIMARY KEY,
  practice_session_id TEXT NOT NULL REFERENCES practice_session(id),
  student_id TEXT NOT NULL REFERENCES student(id),
  skill_id TEXT NOT NULL,
  item_id TEXT NOT NULL,
  result TEXT NOT NULL CHECK (result IN ('correct', 'incorrect', 'skipped')),
  scoring_source TEXT NOT NULL CHECK (scoring_source = 'guardian_tap'),
  mic_transcript TEXT,
  mic_confidence REAL,
  duration_ms INTEGER NOT NULL,
  shown_at TEXT NOT NULL,
  scored_at TEXT NOT NULL
);

CREATE INDEX idx_student_guardian ON student(guardian_id);
CREATE INDEX idx_attempt_student ON attempt(student_id, scored_at);
CREATE INDEX idx_attempt_item ON attempt(item_id, scored_at);
```

Command:

```sh
pnpm db:migrations:list
```

Expected output: migration list includes `0001_foundation.sql` once the preview D1 ID is configured.

#### Task 2.3 — Add content validation script before seed content depends on it

- **Wave:** 2
- **File scope:** `scripts/content-validate.ts`
- **Dependency group:** Wave 1
- **Parallel eligibility:** yes; can run before seed content is complete and report expected fixture failures
- **Required reviewer:** content/tooling reviewer
- **Worktree dispatch notes:** may run in a separate worktree from D1 tasks

Minimum validation payload (implements every rule named in plan §2 and spec §9):

```ts
import { readFileSync } from "node:fs";
import { execSync } from "node:child_process";
import { join } from "node:path";

const root = process.cwd();
const readJson = <T>(path: string): T => JSON.parse(readFileSync(join(root, path), "utf8"));
const readJsonFromGit = <T>(ref: string, path: string): T | null => {
  try {
    return JSON.parse(execSync(`git show ${ref}:${path}`, { stdio: ["ignore", "pipe", "ignore"] }).toString());
  } catch {
    return null; // file did not exist at ref (first commit introducing it) — immutability check is a no-op for that file
  }
};
const fail = (message: string): never => {
  throw new Error(`[content-validate] ${message}`);
};

const GRADE_ORDER: Record<string, number> = { K: 0, "1": 1 };

type Skill = { skill_id: string; grade: "K" | "1"; prerequisites?: string[]; deprecated?: boolean };
type Item = { item_id: string; skill_id: string; audio_id?: string; deprecated?: boolean };
type ScopeUnit = { unit_id: string; grade: "K" | "1"; skill_ids: string[] };

const skills = readJson<Skill[]>("content/skills.json");
const items = readJson<Item[]>("content/items/seed.json");
const scope = readJson<ScopeUnit[]>("content/scope-sequence.json");
const audio = readJson<{ audio: { audio_id: string; tts_fallback?: boolean }[] }>("content/audio/manifest.json");

// 1. Duplicate-ID check.
const unique = (label: string, values: string[]) => {
  const seen = new Set<string>();
  for (const value of values) {
    if (seen.has(value)) fail(`duplicate ${label}: ${value}`);
    seen.add(value);
  }
};
unique("skill_id", skills.map((s) => s.skill_id));
unique("item_id", items.map((i) => i.item_id));
unique("audio_id", audio.audio.map((a) => a.audio_id));

// 2. Reference integrity (items → skills, items → audio, units → skills).
const skillsById = new Map(skills.map((s) => [s.skill_id, s]));
const audioIds = new Set(audio.audio.map((a) => a.audio_id));
for (const item of items) {
  if (!skillsById.has(item.skill_id)) fail(`item ${item.item_id} references missing skill ${item.skill_id}`);
  if (item.audio_id && !audioIds.has(item.audio_id)) fail(`item ${item.item_id} references missing audio ${item.audio_id}`);
}
for (const unit of scope) {
  for (const skillId of unit.skill_ids) {
    if (!skillsById.has(skillId)) fail(`unit ${unit.unit_id} references missing skill ${skillId}`);
  }
}

// 3. First-unit prereq closure (already covered in v1).
const firstUnits = new Map<string, ScopeUnit>();
for (const unit of scope) if (!firstUnits.has(unit.grade)) firstUnits.set(unit.grade, unit);
for (const unit of firstUnits.values()) {
  const unitSkills = new Set(unit.skill_ids);
  for (const skillId of unit.skill_ids) {
    const skill = skillsById.get(skillId);
    for (const prereq of skill?.prerequisites ?? []) {
      if (!unitSkills.has(prereq)) fail(`first unit ${unit.unit_id} has unmet prerequisite ${prereq}`);
    }
  }
}

// 4. Grade-band prereq sanity — a prereq's grade must be ≤ the dependent skill's grade.
for (const skill of skills) {
  for (const prereqId of skill.prerequisites ?? []) {
    const prereq = skillsById.get(prereqId);
    if (!prereq) fail(`skill ${skill.skill_id} prereq ${prereqId} is not a defined skill`);
    if (GRADE_ORDER[prereq.grade] > GRADE_ORDER[skill.grade]) {
      fail(`skill ${skill.skill_id} (grade ${skill.grade}) has prereq ${prereqId} from later grade ${prereq.grade}`);
    }
  }
}

// 5. ID immutability vs main — every non-deprecated skill_id/item_id present on main must still be present on HEAD.
//    A removed ID is allowed only if its main-snapshot entry was already marked deprecated:true.
//    Skipped when running on main itself or when the file did not exist on main.
const currentBranch = execSync("git rev-parse --abbrev-ref HEAD", { stdio: ["ignore", "pipe", "ignore"] }).toString().trim();
if (currentBranch !== "main") {
  const checkImmutability = <T extends { deprecated?: boolean }>(
    label: string,
    path: string,
    keyOf: (row: T) => string,
    current: T[]
  ) => {
    const previous = readJsonFromGit<T[]>("origin/main", path) ?? readJsonFromGit<T[]>("main", path);
    if (!previous) return; // file is new on this branch
    const currentIds = new Set(current.map(keyOf));
    for (const row of previous) {
      const id = keyOf(row);
      if (row.deprecated) continue;
      if (!currentIds.has(id)) fail(`${label} ${id} present on main is missing on HEAD without deprecation; IDs are immutable post-ship`);
    }
  };
  checkImmutability<Skill>("skill_id", "content/skills.json", (s) => s.skill_id, skills);
  checkImmutability<Item>("item_id", "content/items/seed.json", (i) => i.item_id, items);
}

// 6. Deprecation enforcement — items must not reference a deprecated skill.
for (const item of items) {
  const skill = skillsById.get(item.skill_id);
  if (skill?.deprecated && !item.deprecated) fail(`item ${item.item_id} references deprecated skill ${item.skill_id}; deprecate the item too`);
}

console.log(`[content-validate] ok: ${skills.length} skills, ${items.length} items, ${audio.audio.length} audio entries`);
```

Command:

```sh
pnpm content:validate
```

Expected output before Task 2.4: either exits 0 against existing seed files or fails only because seed files have not been authored yet. It must not fail because the script is missing.

#### Task 2.4 — Add seed content and scheduler config

- **Wave:** 2
- **File scope:** `content/`
- **Dependency group:** Task 2.3
- **Parallel eligibility:** no; validator must exist first
- **Required reviewer:** content QA reviewer
- **Worktree dispatch notes:** do not start scheduler tuning from this seed; it exists only for first-loop preview

Minimum content payloads:

```json
[
  { "skill_id": "pa_k_u1_blend_two_sound", "grade": "K", "prerequisites": [] },
  { "skill_id": "phonics_k_u1_short_a", "grade": "K", "prerequisites": [] },
  { "skill_id": "heart_k_u1_batch_01", "grade": "K", "prerequisites": [] },
  { "skill_id": "fluency_k_u1_cvc_sentences", "grade": "K", "prerequisites": ["phonics_k_u1_short_a"] }
]
```

```json
[
  { "unit_id": "k_u1_seed", "grade": "K", "skill_ids": ["pa_k_u1_blend_two_sound", "phonics_k_u1_short_a", "heart_k_u1_batch_01", "fluency_k_u1_cvc_sentences"] }
]
```

```json
{
  "mic_default_enabled": false,
  "daily_plan": { "K": 16, "1": 22 },
  "mix": { "active": 0.6, "review": 0.25, "missed": 0.15 }
}
```

Command:

```sh
pnpm content:validate
```

Expected output: validator exits 0, seed references resolve, and mic default remains false.

### Wave 3 — API preview loop

#### Task 3.1 — Implement Worker/Hono entrypoint and shared bindings

- **Wave:** 3
- **File scope:** `api/src/index.ts`, `api/src/db/client.ts`, `api/src/types.ts`
- **Dependency group:** Wave 2
- **Parallel eligibility:** no
- **Required reviewer:** API reviewer
- **Worktree dispatch notes:** create the shared API types before route tasks

Entrypoint contract:

```ts
export type Env = {
  DB: D1Database;
  APP_ORIGIN: string;
  DIAG_GUARDIAN_EMAIL: string;
  AUTH_EMAIL_ISSUER: "dev-log"; // 001f widens to "dev-log" | "resend" | "cloudflare-email-routing"
};
```

```ts
import { Hono } from "hono";
import { cors } from "hono/cors";
import { authRoutes } from "./routes/auth";
import { studentRoutes } from "./routes/students";
import { practiceRoutes } from "./routes/practice";
import { diagRoutes } from "./routes/diag";
import type { Env } from "./types";

const app = new Hono<{ Bindings: Env }>();
app.use("*", cors({ origin: (origin, c) => c.env.APP_ORIGIN, credentials: true }));
app.route("/auth", authRoutes);
app.route("/students", studentRoutes);
app.route("/practice", practiceRoutes);
app.route("/guardian/diag", diagRoutes);
export default app;
```

Command:

```sh
pnpm --filter api typecheck
```

Expected output: API TypeScript compiles with route modules stubbed or implemented.

#### Task 3.2 — Implement magic-link auth explicitly

- **Wave:** 3
- **File scope:** `api/src/routes/auth.ts`, `api/src/routes/auth.test.ts`, `api/src/db/session.ts`, `api/src/email/magic-link.ts`
- **Dependency group:** Task 3.1
- **Parallel eligibility:** no; student/practice routes depend on authenticated guardian context
- **Required reviewer:** security-aware reviewer
- **Worktree dispatch notes:** do not implement password auth or social auth

Route contract to implement:

```ts
POST /auth/start      body { email: string }
GET  /auth/consume    query { token: string } -> Set-Cookie session=<id>; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=2592000
GET  /auth/me         -> { guardian: { id, email, display_name } } or 401
POST /auth/logout     -> clears session cookie (Max-Age=0)
```

Required behavior:

```ts
// 1. Normalize email to lowercase and create guardian row if absent.
// 2. Generate random token; store SHA-256 token_hash with 15 minute expiry.
// 3. In dev-log issuer mode, log exactly `[magic-link] ${url}` instead of sending email.
// 4. Consume token exactly once, create session ULID (30-day expiry), set HttpOnly Secure SameSite=Lax cookie with Max-Age=2592000.
// 5. Reject expired, missing, or already-consumed tokens with 401.
// 6. Never expose token_hash or session IDs in JSON responses.
// 7. /auth/logout deletes session row and sets Max-Age=0 cookie.
```

Session helper payload — `api/src/db/session.ts`:

```ts
import { ulid } from "ulid";
import type { Env } from "../types";

export const SESSION_COOKIE = "session";
const SESSION_TTL_MS = 30 * 24 * 60 * 60 * 1000;

export type GuardianRow = { id: string; email: string; display_name: string | null };

export const setSessionCookie = (sessionId: string): string =>
  `${SESSION_COOKIE}=${sessionId}; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=${SESSION_TTL_MS / 1000}`;

export const clearSessionCookie = (): string =>
  `${SESSION_COOKIE}=; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=0`;

export const parseSessionCookie = (header: string | null): string | null => {
  if (!header) return null;
  const match = header.split(/;\s*/).find((part) => part.startsWith(`${SESSION_COOKIE}=`));
  return match ? match.slice(SESSION_COOKIE.length + 1) || null : null;
};

export const createSession = async (env: Env, guardianId: string): Promise<string> => {
  const id = ulid();
  const now = new Date().toISOString();
  const expiresAt = new Date(Date.now() + SESSION_TTL_MS).toISOString();
  await env.DB.prepare(
    "INSERT INTO session (id, guardian_id, expires_at, created_at) VALUES (?, ?, ?, ?)"
  ).bind(id, guardianId, expiresAt, now).run();
  return id;
};

export const loadGuardianBySession = async (env: Env, sessionId: string): Promise<GuardianRow | null> => {
  const row = await env.DB.prepare(
    `SELECT g.id, g.email, g.display_name FROM session s
       JOIN guardian g ON g.id = s.guardian_id
      WHERE s.id = ? AND s.expires_at > ?`
  ).bind(sessionId, new Date().toISOString()).first<GuardianRow>();
  return row ?? null;
};

export const deleteSession = async (env: Env, sessionId: string): Promise<void> => {
  await env.DB.prepare("DELETE FROM session WHERE id = ?").bind(sessionId).run();
};
```

Dev-log issuer payload — `api/src/email/magic-link.ts`:

```ts
import type { Env } from "../types";

export const issueMagicLink = async (env: Env, email: string, token: string): Promise<void> => {
  const url = `${env.APP_ORIGIN}/auth/consume?token=${encodeURIComponent(token)}`;
  if (env.AUTH_EMAIL_ISSUER === "dev-log") {
    console.log(`[magic-link] ${url}`);
    return;
  }
  throw new Error(`email issuer ${env.AUTH_EMAIL_ISSUER} is deferred from 001a`);
};
```

Test scaffold payload — `api/src/routes/auth.test.ts` (runs with `@cloudflare/vitest-pool-workers` against a Miniflare-managed D1 binding; the pool config goes in `api/vitest.config.ts` and is authored alongside this test file):

```ts
import { describe, it, expect, beforeEach } from "vitest";
import { env, SELF } from "cloudflare:test";

const applyMigrations = async () => {
  const sql = await (await fetch(new URL("../migrations/0001_foundation.sql", import.meta.url))).text();
  for (const stmt of sql.split(/;\s*\n/).map((s) => s.trim()).filter(Boolean)) {
    await env.DB.prepare(stmt).run();
  }
};

const extractToken = (logs: string[]): string => {
  const line = logs.find((entry) => entry.startsWith("[magic-link] "));
  if (!line) throw new Error("no magic link logged");
  return new URL(line.slice("[magic-link] ".length)).searchParams.get("token")!;
};

describe("auth", () => {
  beforeEach(async () => {
    await env.DB.exec("DROP TABLE IF EXISTS attempt; DROP TABLE IF EXISTS practice_session; DROP TABLE IF EXISTS item_mastery; DROP TABLE IF EXISTS skill_mastery; DROP TABLE IF EXISTS student; DROP TABLE IF EXISTS session; DROP TABLE IF EXISTS auth_token; DROP TABLE IF EXISTS guardian;");
    await applyMigrations();
  });

  it("issues a magic link and consumes it exactly once", async () => {
    const logs: string[] = [];
    const originalLog = console.log;
    console.log = (...args) => { logs.push(args.join(" ")); originalLog(...args); };
    try {
      const start = await SELF.fetch("https://api.test/auth/start", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ email: "Guardian@Example.com" })
      });
      expect(start.status).toBe(204);
      const token = extractToken(logs);

      const consume = await SELF.fetch(`https://api.test/auth/consume?token=${token}`);
      expect(consume.status).toBe(204);
      const cookie = consume.headers.get("set-cookie")!;
      expect(cookie).toContain("HttpOnly");
      expect(cookie).toContain("Secure");
      expect(cookie).toContain("SameSite=Lax");
      expect(cookie).toMatch(/Max-Age=\d+/);

      const replay = await SELF.fetch(`https://api.test/auth/consume?token=${token}`);
      expect(replay.status).toBe(401);
    } finally {
      console.log = originalLog;
    }
  });

  it("rejects an expired token", async () => {
    await env.DB.prepare("INSERT INTO guardian (id, email, role, created_at) VALUES (?, ?, 'guardian', ?)")
      .bind("g_expired", "expired@example.com", new Date().toISOString()).run();
    const longAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
    await env.DB.prepare("INSERT INTO auth_token (token_hash, guardian_id, expires_at) VALUES (?, ?, ?)")
      .bind("HASH_OF_expired", "g_expired", longAgo).run();
    const consume = await SELF.fetch(`https://api.test/auth/consume?token=expired`);
    expect(consume.status).toBe(401);
  });

  it("/auth/me returns 401 without a valid session and the guardian otherwise", async () => {
    const unauth = await SELF.fetch("https://api.test/auth/me");
    expect(unauth.status).toBe(401);

    await env.DB.prepare("INSERT INTO guardian (id, email, role, created_at) VALUES (?, ?, 'guardian', ?)")
      .bind("g_me", "me@example.com", new Date().toISOString()).run();
    const future = new Date(Date.now() + 60_000).toISOString();
    await env.DB.prepare("INSERT INTO session (id, guardian_id, expires_at, created_at) VALUES (?, ?, ?, ?)")
      .bind("sess_me", "g_me", future, new Date().toISOString()).run();
    const me = await SELF.fetch("https://api.test/auth/me", { headers: { cookie: "session=sess_me" } });
    expect(me.status).toBe(200);
    const body = await me.json<{ guardian: { email: string } }>();
    expect(body.guardian.email).toBe("me@example.com");
  });

  it("/auth/logout clears the cookie and removes the session row", async () => {
    await env.DB.prepare("INSERT INTO guardian (id, email, role, created_at) VALUES (?, ?, 'guardian', ?)")
      .bind("g_out", "out@example.com", new Date().toISOString()).run();
    const future = new Date(Date.now() + 60_000).toISOString();
    await env.DB.prepare("INSERT INTO session (id, guardian_id, expires_at, created_at) VALUES (?, ?, ?, ?)")
      .bind("sess_out", "g_out", future, new Date().toISOString()).run();
    const logout = await SELF.fetch("https://api.test/auth/logout", {
      method: "POST",
      headers: { cookie: "session=sess_out" }
    });
    expect(logout.status).toBe(204);
    expect(logout.headers.get("set-cookie")!).toContain("Max-Age=0");
    const row = await env.DB.prepare("SELECT id FROM session WHERE id = ?").bind("sess_out").first();
    expect(row).toBeNull();
  });
});
```

Command:

```sh
pnpm --filter api test -- auth
```

Expected output: all four test cases pass. Cookie attributes (`HttpOnly`, `Secure`, `SameSite=Lax`, `Max-Age`) are asserted; single-use semantics, expiry rejection, `/auth/me` gating, and logout cookie/row teardown are each exercised.

#### Task 3.3 — Implement guardian-owned student endpoints

- **Wave:** 3
- **File scope:** `api/src/routes/students.ts`
- **Dependency group:** Task 3.2
- **Parallel eligibility:** yes with Task 3.4 after auth helper exists
- **Required reviewer:** API reviewer
- **Worktree dispatch notes:** ensure every query filters by authenticated `guardian_id`

Route contract:

```ts
GET  /students        -> { students: Student[] }
POST /students        body { display_name: string; grade: "K" | "1"; birth_month?: string }
GET  /students/:id    -> { student: Student }
PATCH /students/:id   body { display_name?, grade?, prefs_json? }
```

Command:

```sh
pnpm --filter api test -- students
```

Expected output: tests prove a guardian cannot read or mutate another guardian's student.

#### Task 3.4 — Implement practice and diagnostic endpoints

- **Wave:** 3
- **File scope:** `api/src/routes/practice.ts`, `api/src/routes/diag.ts`
- **Dependency group:** Task 3.2
- **Parallel eligibility:** yes with Task 3.3 until shared DB helpers collide
- **Required reviewer:** API + data reviewer
- **Worktree dispatch notes:** no mic scoring branch; only guardian-tap source is accepted

Route contract:

```ts
POST /practice/:studentId/start
  -> creates practice_session with plan_json from seed content

POST /practice/:studentId/attempt
  body { practice_session_id, skill_id, item_id, result: "correct" | "incorrect" | "skipped", duration_ms, shown_at }
  -> inserts attempt with scoring_source = "guardian_tap", scored_at = now

GET /guardian/diag
  -> allowed only when authenticated guardian email equals DIAG_GUARDIAN_EMAIL
```

Command:

```sh
pnpm --filter api test -- practice diag
```

Expected output: tests persist `practice_session.plan_json`, insert one append-only `attempt` per tap, reject non-guardian-tap scoring sources, and enforce diagnostic gate.

### Wave 4 — App preview loop

#### Task 4.1 — Implement typed app API client and auth state

- **Wave:** 4
- **File scope:** `app/src/api/`, `app/src/state/`
- **Dependency group:** Wave 3
- **Parallel eligibility:** no; route work depends on client shape
- **Required reviewer:** app reviewer
- **Worktree dispatch notes:** keep cookie credentials enabled for every API request

Client contract:

```ts
export const apiFetch = <T>(path: string, init?: RequestInit): Promise<T> =>
  fetch(`${import.meta.env.VITE_API_ORIGIN}${path}`, {
    ...init,
    credentials: "include",
    headers: { "content-type": "application/json", ...init?.headers }
  }).then(async (response) => {
    if (!response.ok) throw new Error(await response.text());
    return response.json() as Promise<T>;
  });
```

Command:

```sh
pnpm --filter app typecheck
```

Expected output: App TypeScript compiles with typed auth, student, practice, and diag calls.

#### Task 4.2 — Implement sign-in and guardian dashboard routes

- **Wave:** 4
- **File scope:** `app/src/routes/signin.tsx`, `app/src/routes/guardian*.tsx`
- **Dependency group:** Task 4.1
- **Parallel eligibility:** yes with Task 4.3 after API client exists
- **Required reviewer:** app reviewer
- **Worktree dispatch notes:** route labels must use guardian/student naming, not parent/child/classroom

Routes to create:

```txt
/
/signin
/guardian
/guardian/add-student
/guardian/:studentId
/guardian/:studentId/settings
```

Command:

```sh
pnpm --filter app test -- guardian signin
```

Expected output: route tests cover magic-link request, authenticated dashboard rendering, add-student, and owned student navigation.

#### Task 4.3 — Implement drill card, daily practice, and done routes

- **Wave:** 4
- **File scope:** `app/src/components/cards/`, `app/src/routes/play*.tsx`, `app/src/drill/`
- **Dependency group:** Task 4.1, Task 4.2
- **Parallel eligibility:** no; child-facing preview gate applies
- **Required reviewer:** child-facing UX reviewer
- **Worktree dispatch notes:** no harsh failure feedback, no streak/coin/avatar reward mechanics, no mic affordance

Drill contract:

```txt
/play/:studentId       starts or resumes daily plan
/play/:studentId/drill shows one large card and guardian tap controls: Correct, Try again, Skip
/play/:studentId/done  shows calm completion and optional bonus entry
```

Command:

```sh
pnpm --filter app test -- drill play
```

Expected output: route test starts a plan, scores a card via guardian tap, advances to the next card, persists progress through API mock, and reaches done state.

### Wave 5 — Gates, preview, and documentation

#### Task 5.1 — Add mandatory PR template gates

- **Wave:** 5
- **File scope:** `.github/pull_request_template.md`
- **Dependency group:** Wave 4
- **Parallel eligibility:** yes with Task 5.2
- **Required reviewer:** plan owner
- **Worktree dispatch notes:** keep checklist explicit; no optional child-facing preview gate

Payload to author (mirrors plan §5; `[CI]` items are enforced by `.github/workflows/ci.yml` from Task 1.4):

```md
## Verification

- [ ] `[CI]` `pnpm lint` passes.
- [ ] `[CI]` `pnpm typecheck` passes.
- [ ] `[CI]` `pnpm test` passes (a no-test PR fails CI; reviewer must accept rationale to override).
- [ ] `[CI]` `pnpm content:validate` passes.
- [ ] `[CI]` `scripts/check-sentinel.sh` confirms the sentinel D1 UUID `00000000-0000-4000-8000-000000000001` does not appear in the diff against `main`.
- [ ] `[reviewer]` D1 migration list is explicit when `api/migrations/` changes.
- [ ] `[reviewer]` Preview URL is attached when child-facing UX, scheduler, or content changes.
- [ ] `[reviewer]` Preview exercise notes are attached for changes under `app/src/drill/`, `app/src/components/cards/`, or `/content/`.
- [ ] `[reviewer]` `/guardian/diag` impact is stated when scheduler, mastery, practice session, or attempt logging changes.
- [ ] `[reviewer]` Scope-creep check confirms no mic scoring, classroom UI, state filtering, D1 content editing, Grade 2, vocab, or comprehension work entered v1.0 foundation scope.
```

Command:

```sh
test -f .github/pull_request_template.md && grep -q '\[CI\]' .github/pull_request_template.md && grep -q '\[reviewer\]' .github/pull_request_template.md
```

Expected output: PR template exists and contains both `[CI]` and `[reviewer]` annotations.

#### Task 5.2 — Add replay-attempts scaffold

- **Wave:** 5
- **File scope:** `scripts/replay-attempts.ts`
- **Dependency group:** Wave 4
- **Parallel eligibility:** yes with Task 5.1
- **Required reviewer:** scheduler/tooling reviewer
- **Worktree dispatch notes:** this is a smoke scaffold, not scheduler tuning

Minimum payload:

```ts
console.log("[replay-attempts] loaded 0 fixture attempts; scheduler tuning is blocked until preview attempts exist");
```

Command:

```sh
pnpm replay:attempts
```

Expected output: command exits 0 and prints the explicit no-fixtures message. **This is not a release gate in 001a** — replay only becomes a gate after the cadence in §8 says it does (after first pilot attempts exist). Including it in the Wave 5.4 verification chain would make the gate decorative because it cannot fail on an empty D1.

#### Task 5.3 — Update README dev and preview instructions

- **Wave:** 5
- **File scope:** `README.md`
- **Dependency group:** Wave 4
- **Parallel eligibility:** yes with Task 5.1 and Task 5.2
- **Required reviewer:** docs reviewer
- **Worktree dispatch notes:** remove static GitHub Pages-only instructions as the primary path

Required sections (verbatim or close paraphrase — Task 5.3 verification greps for each heading):

```md
## Development

- `pnpm install`
- `pnpm dev`
- `pnpm lint && pnpm typecheck && pnpm test`
- `pnpm content:validate`
- `pnpm replay:attempts` (informational until pilot attempts exist; see plan §8 cadence)

## Preview checklist

Attach the preview URL and exercise guardian sign-in, student creation, drill scoring, done page, and `/guardian/diag` when applicable.
```

Command:

```sh
grep -q "^## Development$" README.md && grep -q "^## Preview checklist$" README.md && grep -q "pnpm content:validate" README.md
```

Expected output: command exits 0; both headings and the `pnpm content:validate` reference are present in README. A bare `git diff` is not sufficient verification because diff existence does not prove section presence.

#### Task 5.4 — Run full verification and preview smoke pass

- **Wave:** 5
- **File scope:** whole repo
- **Dependency group:** Task 5.1, Task 5.2, Task 5.3
- **Parallel eligibility:** no
- **Required reviewer:** plan owner plus adversarial PR/QA reviewer if implementation touches trigger paths
- **Worktree dispatch notes:** run only after all previous tasks merge in one worktree

Command:

```sh
pnpm lint && pnpm typecheck && pnpm test && pnpm content:validate && bash scripts/check-sentinel.sh
```

`pnpm replay:attempts` is deliberately **not** in this gate — see Task 5.2's expected output and plan §8 cadence.

Manual smoke script:

```txt
1. Request magic link at /signin.
2. Consume magic link and verify /guardian loads.
3. Add one K student.
4. Start /play/:studentId and score one correct, one incorrect, and one skip.
5. Verify /play/:studentId/done appears at plan completion.
6. Verify /guardian/:studentId shows progress from attempts.
7. With DIAG_GUARDIAN_EMAIL set to the signed-in guardian, verify /guardian/diag summarizes attempts.
```

Expected output: all commands exit 0; preview/local equivalent smoke notes are recorded in the implementation PR.

## 10. TDD and verification approach

- API work starts with route-level tests for session bootstrap, student creation, practice plan creation, attempt persistence, and diag authorization.
- App work starts with component/route tests for guardian dashboard, drill card controls, scoring flow, and done state.
- Content validation is implemented before seed content is allowed to support the app loop.
- Scheduler logic starts deterministic and fixture-driven; stochastic tuning is explicitly deferred until telemetry exists.
- Verification command for the completed foundation slice:

```sh
pnpm lint && pnpm typecheck && pnpm test && pnpm content:validate && bash scripts/check-sentinel.sh
```

`pnpm replay:attempts` is intentionally excluded from this chain. It is a smoke scaffold against an empty D1 in 001a and would make the chain decorative; it becomes a gate per plan §8 cadence after pilot attempts exist.

## 11. Adversarial review decisions

### Plan review

**Decision:** adversarial plan review required before implementation approval.  
**Rationale:** this plan replaces the current app architecture, introduces D1 schema, auth/session surfaces, child-facing practice UX, content validation, and Cloudflare preview gates. The work is architecture-sensitive, detail-sensitive, and contains privacy-adjacent future-proofing fields even though mic scoring is out of scope.

**Review packet:** [`docs/plans/001a-literacy-app-v1-adversarial-review.md`](001a-literacy-app-v1-adversarial-review.md).  
**Round 1 disposition:** rejected. **Round 2 disposition:** BLOCKED (criticals fixed; importants/coverage gaps + new issues remain). **Round 3 disposition:** APPROVED WITH NITS; engineer can start Wave 1 immediately. Nits 1, 2, and 5 are patched in this plan; nits 3 and 4 are carried as procedural/minor risks in the review packet.

### Downstream PR/QA review marker

**Required:** yes.  
**Trigger:** implementation PRs from this plan require adversarial PR/QA review before ship-sync if they touch auth/session, D1 migrations, child-facing drill UX, scheduler/mastery logic, content validation, or telemetry/diag behavior.

## 12. Approval checkpoint

This plan is not approved for implementation until the user confirms:

1. the 001a split is correct;
2. wave execution remains batch-by-wave;
3. adversarial plan review is completed;
4. the first implementation wave may start.

## 13. Deferred to follow-up plans

Every spec requirement that 001a does not ship is itemized here with the successor plan ID that will own it. These pointers are normative: the named successor plan must exist before 001a-derived implementation merges that would otherwise leave a gap unowned.

| Plan ID | Owns | Spec sections | Notes |
| --- | --- | --- | --- |
| `001b` — Frontend stack & PWA | PWA toolchain via `vite-plugin-pwa`, Tailwind, Lexend, react-router, Zustand, TanStack Query, `/content/VERSION` + cache invalidation | §2 frontend stack; §4 VERSION; §10 v1.0 PWA-installable bar | Must land before child-facing UX changes that depend on routing or PWA install. |
| `001c` — Scheduler & mastery | `app/src/drill/scheduler.ts`, `app/src/drill/mastery.ts`, per-item SRS state machine, skill graduation rule, 60/25/15 active/review/missed mix, interleaving, real `scripts/replay-attempts.ts` implementation | §6 scheduler; §6 mastery; §6 daily-plan composition | 001a ships only a deterministic fixture-driven `plan_json` generator. 001c replaces it. |
| `001d` — Audio & R2 | `content/audio/manifest.json` authored content, R2 bucket + binding in `wrangler.toml`, `app/src/drill/audio.ts` preloader, TTS fallback wiring | §4 manifest; §8 audio; §9 R2 binding | Phonics card in 001a is text-only until 001d lands; spec §8 preloading at plan generation is then enforced. |
| `001e` — PA, Heart, Fluency cards | `app/src/components/cards/PhonemicAwarenessCard.tsx`, `HeartWordCard.tsx`, `FluencyCard.tsx`, plus mode-specific guardian-tap affordances | §5 drill modes (PA, Heart, Fluency) | 001a ships only the Phonics card. Until 001e, the plan generator filters non-Phonics items out of the daily plan. |
| `001f` — Real magic-link issuer | `api/src/email/resend.ts` and/or `api/src/email/cloudflare-email-routing.ts`, widen `Env.AUTH_EMAIL_ISSUER` enum, secret bindings, deliverability verification | §2 magic-link via Resend or CF Email Routing | 001a ships only the `dev-log` issuer (logs URL to Worker console). 001f makes pilot guardians able to sign in without console access. |

Dependency note: 001b is the only follow-up that must land before any pilot tester uses the preview, because the Vite default scaffold without PWA install can still load on mobile Safari/Chrome. 001c, 001d, 001e, 001f can land in any order; each independently lifts a documented limitation without breaking 001a's foundation.

# Project Instructions for AI Agents

Reader's Way — an early-literacy practice app. pnpm monorepo on Cloudflare Workers + React.
This is the single source of truth for agent instructions; `CLAUDE.md` imports it.

## 🚦 Merge & PR Policy (hard gate)

**Do NOT merge a pull request without explicit user confirmation for that specific PR.**

- Opening a PR, pushing a branch, and watching CI are fine without asking.
- Merging is a **separate, explicit step**: after CI is green, stop and report (PR #, checks, what changed), then wait for the user to say "merge" for *that* PR.
- The user often wants a window for manual or independent/adversarial review — never collapse it by auto-merging.
- Applies to every path: `gh pr merge`, the GitHub UI, fast-forward, squash, or direct pushes. A general "ship it" earlier in a session does **not** authorize merging later PRs.

## Git workflow

- `main` is protected; all changes land via PRs. Branch with a `plan/<id>-slug` or `docs/<slug>` name.
- **Conservative by default:** don't commit or push unless asked. When asked, branch → commit → push → open PR, then stop at the merge gate above.
- End commit messages with: `Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>`.

## Issue tracking — bd (beads)

Use **bd** for all task tracking (not markdown TODOs). Run **`bd prime`** at the start of operational work — it injects the full command reference and project memories each session, so they aren't duplicated here. Common loop: `bd ready` → `bd show <id>` → `bd update <id> --claim` → `bd close <id> --reason="…"`.

**Local-first, single-writer (repo policy):**
- `.beads/issues.jsonl` + `.beads/config.yaml` are the committed source of truth; the binary Dolt db is gitignored (rehydrate with `bd init --from-jsonl`). `export.auto=true` keeps the JSONL current.
- **Never run `bd dolt push`** and never `bd init` a second workspace. Going multi-machine is a deliberate, explicit switch — not a default.
- bd tracks *active work*; `docs/specs`, `docs/plans`, `docs/adrs`, `docs/research` remain the source of truth for behavior and decisions.

## Build, test, run

```bash
pnpm install
pnpm dev                 # api (wrangler) + app (vite) in parallel
pnpm -r typecheck        # tsc --noEmit across workspaces
pnpm -r test             # vitest run across workspaces
pnpm content:validate    # validate content/ against schema + manifest
pnpm db:migrations:list  # D1 migrations for literacy_preview
```

Scope to one package with `pnpm --filter api …` / `--filter app …`.

## Architecture

pnpm workspace (`pnpm@9.15.0`), three packages:

- **`api/`** — Hono on Cloudflare Workers, D1 (SQLite). Routes in `api/src/routes/`, the practice scheduler in `api/src/scheduler/`, magic-link auth/email in `api/src/email/` + `routes/auth.ts`. `wrangler.toml` config.
- **`app/`** — React 19 + Vite SPA (guardian + practice UI).
- **`packages/copy/`** — TypeScript-only shared brand/UI/email copy, imported as `copy` by both `api` and `app`. Brand strings live here, never in `content/`.
- **`content/`** — instructional content as validated JSON data (`skills.json`, `scope-sequence.json`, `items/`, `audio/`); `scripts/content-validate.ts` is the gate.

## Conventions

- **TDD is the default for code** (RED → GREEN → REFACTOR with per-stage checkpoint commits). No production code before an observed failing test.
- **api tests** run in the `@cloudflare/vitest-pool-workers` workerd isolate: import `env` / `SELF` from `cloudflare:test`. `vi.stubGlobal("fetch")` does **not** patch fetch in that pool, and the hand-written `cloudflare-test.d.ts` exports only `env`/`SELF` (no `fetchMock`) — **dependency-inject** `fetch` instead.
- **app tests** use Vitest + jsdom with raw `createRoot` + `act` (no `@testing-library`).
- Content is data: extend the JSON files and let `content:validate` enforce integrity; no brand chrome in `content/`.

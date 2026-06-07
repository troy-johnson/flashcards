# Project Instructions for AI Agents

This file provides instructions and context for AI coding agents working on this project.

## 🚦 Merge & PR Policy (hard gate)

**Do NOT merge a pull request without explicit user confirmation for that specific PR.**

- Opening a PR, pushing a branch, and watching CI are fine without asking.
- **Merging is a separate, explicit step.** After CI is green, **stop and report** — list the PR, its checks, and what changed — then wait for the user to say "merge" (or equivalent) for that PR. Approval to open or work on a PR is **not** approval to merge it.
- The user often wants a window for **manual review or an independent/adversarial review** before merge. Never collapse that window by auto-merging.
- This applies to every merge path: `gh pr merge`, the GitHub UI, fast-forward, squash, or direct pushes to a protected branch. `main` is protected; merges land via reviewed PRs.
- A general "ship it" or standing instruction earlier in a session does **not** authorize merging later PRs — confirm per PR.

<!-- BEGIN BEADS INTEGRATION v:1 profile:minimal hash:970c3bf2 -->
## Beads Issue Tracker

This project uses **bd (beads)** for issue tracking. Run `bd prime` to see full workflow context and commands.

### Quick Reference

```bash
bd ready              # Find available work
bd show <id>          # View issue details
bd update <id> --claim  # Claim work
bd close <id>         # Complete work
```

### Rules

- Use `bd` for ALL task tracking — do NOT use TodoWrite, TaskCreate, or markdown TODO lists
- Run `bd prime` for detailed command reference and session close protocol
- Use `bd remember` for persistent knowledge — do NOT use MEMORY.md files

**Architecture in one line:** issues live in a local Dolt DB; sync uses `refs/dolt/data` on your git remote; `.beads/issues.jsonl` is a passive export. See https://github.com/gastownhall/beads/blob/main/docs/SYNC_CONCEPTS.md for details and anti-patterns.

## Agent Context Profiles

The managed Beads block is task-tracking guidance, not permission to override repository, user, or orchestrator instructions.

- **Conservative (default)**: Use `bd` for task tracking. Do not run git commits, git pushes, or Dolt remote sync unless explicitly asked. At handoff, report changed files, validation, and suggested next commands.
- **Minimal**: Keep tool instruction files as pointers to `bd prime`; use the same conservative git policy unless active instructions say otherwise.
- **Team-maintainer**: Only when the repository explicitly opts in, agents may close beads, run quality gates, commit, and push as part of session close. A current "do not commit" or "do not push" instruction still wins.

## Session Completion

This protocol applies when ending a Beads implementation workflow. It is subordinate to explicit user, repository, and orchestrator instructions.

1. **File issues for remaining work** - Create beads for anything that needs follow-up
2. **Run quality gates** (if code changed) - Tests, linters, builds
3. **Update issue status** - Close finished work, update in-progress items
4. **Handle git/sync by active profile**:
   ```bash
   # Conservative/minimal/default: report status and proposed commands; wait for approval.
   git status

   # Team-maintainer opt-in only, unless current instructions forbid it:
   git pull --rebase
   bd dolt push
   git push
   git status
   ```
5. **Hand off** - Summarize changes, validation, issue status, and any blocked sync/commit/push step

**Critical rules:**
- Explicit user or orchestrator instructions override this Beads block.
- Do not commit or push without clear authority from the active profile or the current user request.
- If a required sync or push is blocked, stop and report the exact command and error.
<!-- END BEADS INTEGRATION -->

## Beads — repo policy (overrides the generated block above)

This repo runs Beads **local-first, single-writer**. Where this conflicts with the
generated integration block above, this section wins.

- **Do NOT run `bd dolt push`** in any profile — including the team-maintainer session-close
  recipe above. The binary Dolt db is gitignored and local-only; `.beads/issues.jsonl` +
  `.beads/config.yaml` are the committed source of truth (`export.auto=true` keeps the JSONL
  current). Do NOT `bd init` a second workspace.
- Beads (`bd`) is the operational source of truth for active work; canonical technical docs
  (`docs/specs`, `docs/plans`, `docs/adrs`, `docs/research`) remain the source of truth for
  behavior and decisions.
- Going multi-machine requires an explicit, deliberate switch to Dolt remote sync — not a default.


## Build & Test

_Add your build and test commands here_

```bash
# Example:
# npm install
# npm test
```

## Architecture Overview

_Add a brief overview of your project architecture_

## Conventions & Patterns

_Add your project-specific conventions here_

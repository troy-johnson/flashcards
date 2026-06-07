# Multi-Harness Handoff Workflow

Reader's Way work happens across Claude Code, OpenCode, and Codex — on any device, via remote control. All three have full `bd` access and share one local Dolt workspace. This document describes how to hand off between sessions and harnesses without losing context, for any kind of work (planning, implementation, reviews, brainstorming).

## Entry point: `bd prime`

Run `bd prime` at the start of every session. It injects the full command reference, current project memories, and open-work state into context.

- **Claude Code / Codex:** fires automatically via each harness's built-in `SessionStart` hook (configured in `.claude/settings.json` and `.codex/hooks.json` respectively — installed by `bd init`, not by Axon).
- **OpenCode:** run manually before starting work.

## Getting current status

```bash
bd prime                        # full context: memories + command ref + open work
bd ready                        # unblocked work queue
bd list --status=in_progress    # anything mid-flight
bd memories                     # all cross-session context
bd show <id>                    # detail on a specific bead
```

## Tracking all work types

Beads tracks every kind of work — not just implementation — so status is queryable across harnesses and sessions:

| Work type | bd bead | Content lives in |
|---|---|---|
| Implementation | feature / task with acceptance criteria | Code + `docs/plans/` |
| Planning / spec work | task ("Draft plan 002e") | `docs/plans/`, `docs/specs/` |
| Adversarial / independent review | task ("Review 002d–002h") | `.agents/snapshots/` |
| Brainstorm / research | task or notes on parent epic | `docs/research/` or bead `--notes` |
| Decision / ADR | task ("Write ADR-002") | `docs/adrs/` |
| Deployment / ops | task ("Flip resend issuer") | `docs/state/deployment-setup.md` |

The bead is the *pointer* — status, dependencies, owner, notes. The doc file is the *content*. Work that exists only in a bead description or only in a doc file is incomplete.

## Outgoing checklist (before switching harness or ending session)

```bash
# 1. Update bead status
bd close <id> --reason="what was done"
bd update <id> --notes="where you left off, what's next, any blockers"

# 2. Save non-obvious context to a memory
bd memories handoff              # check existing keys first; update in place
bd remember --key <slug> "key decisions, gotchas, next action"

# 3. Quality gates (if code changed)
pnpm -r typecheck && pnpm -r test

# 4. Commit and push (if authorised — see merge gate in AGENTS.md)
git status
git push
```

## Incoming checklist (picking up work)

```bash
git pull --ff-only    # get latest code
bd prime              # load session context
bd ready              # see what's unblocked
bd list --status=in_progress   # see what's mid-flight
bd show <id>          # read the active bead
bd memories handoff   # check for any notes left by the previous session
```

## Memory discipline

`bd remember` is the cross-session, cross-harness knowledge layer — structured context for intent and decisions, not content.

- **Save:** non-obvious decisions, test gotchas, review findings that shaped a plan, anything you'd have to re-derive from scratch.
- **Don't save:** file paths / function names (read the code), git history (`git log`), things already written in plan docs or ADRs.
- **Update in place:** `bd remember --key <existing-key> "revised content"` — one key per topic, not a growing log.
- **Retire stale memories:** `bd forget <key>` once the work ships.

## Review handoff

When one session writes a plan or implementation and another reviews it:

1. **Outgoing reviewer:** write the packet to `.agents/snapshots/<name>-<date>.md`; note the path in a memory.
2. **Incoming implementer:** read the snapshot, triage findings (accepted / rejected with rationale / deferred), apply revisions, append disposition to the packet.
3. **Both:** update the plan's "Review revisions" section so accepted findings are visible inline.

See `.agents/snapshots/` for worked examples.

## Repo policy (all harnesses)

- **Merge gate:** never merge a PR without explicit per-PR user confirmation — stop after CI green and report. See `AGENTS.md`.
- **No `bd dolt push`:** local-first, single-writer. `.beads/issues.jsonl` + `.beads/config.yaml` are the committed source; the Dolt db is local and gitignored.
- **No second `bd init`:** one workspace at `.beads/`.

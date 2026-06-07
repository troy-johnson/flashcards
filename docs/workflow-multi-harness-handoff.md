# Multi-Harness Beads Handoff Workflow

This project uses `bd` (Beads) to coordinate work across two AI harnesses — **Claude Code** and **OpenCode** — sharing a single local workspace. This document describes how to hand off between them without losing context.

## Why this works

All agents share:
- **The same Dolt db** at `.beads/` — issue state is live for whichever harness is active.
- **The same `AGENTS.md`** — Claude Code loads it via `CLAUDE.md → @AGENTS.md`; OpenCode reads `AGENTS.md` directly.
- **`bd prime`** — auto-called by hooks in Claude Code and Codex on session start; must be run manually in OpenCode. Injects the full command reference and current project memories into context.

State that lives in the db (issue status, dependencies, notes, memories) is immediately visible to the next harness. There is no sync step between local sessions.

## Handoff checklist (outgoing agent)

Run these before saying "done" or switching harnesses:

```bash
# 1. Close or update beads
bd close <id> --reason="what was done"   # if complete
bd update <id> --notes="where you left off, what's next"  # if mid-flight

# 2. Save anything non-obvious to a memory
bd remember --key <slug> "key decisions, caveats, or next-action context"
# Use bd memories <keyword> to check existing keys first; update in place.

# 3. Quality gates (if code changed)
pnpm -r typecheck && pnpm -r test

# 4. Commit changed files (if authorised to commit)
git status   # check working tree
# Stage only relevant files — not .beads/*.jsonl (gitignored db) unless bd export happened

# 5. Export beads state to the committed JSONL
# export.auto=true keeps .beads/issues.jsonl current on every write;
# if in doubt: bd doctor to confirm no drift

# 6. Report to the user: changed files, open PR or branch, beads status
```

## Handoff checklist (incoming agent)

When picking up work from another harness or after a context gap:

```bash
# 1. Pull latest code (if the other harness committed and pushed)
git pull --ff-only

# 2. Load project context
bd prime        # full command reference + memories injected into session
bd ready        # see available work
bd list --status=in_progress   # see anything mid-flight

# 3. Read the active bead
bd show <id>    # description, notes, dependencies, who left what

# 4. Check memories for any handoff notes
bd memories handoff   # or search by topic
```

## Memory discipline

`bd remember` is the persistence layer across both harnesses. Treat it like structured commit messages for intent:

- **Save:** non-obvious decisions, key caveats, gotchas, "next step is X", review findings that shaped the plan.
- **Don't save:** file paths / function names (read the code), git history (use `git log`), things already in plan docs.
- **Update in place:** `bd remember --key <existing-key> "revised content"` — one key per topic, not growing append logs.
- **Discard:** `bd forget <key>` when the work is shipped and the memory is stale.

## Adversarial / independent review handoff

When one harness writes a plan or implementation and another (or a subagent) does the review:

1. Outgoing agent: write the review packet to `.agents/snapshots/<name>-<date>.md` and note the path in the handoff memory.
2. Incoming agent: read the snapshot, triage findings, apply revisions, record disposition in the same file.
3. Both: update the relevant plan's "Review revisions" section so the accepted findings are visible inline.

See `.agents/snapshots/` for worked examples.

## Repo policy reminders

- **Never `bd dolt push`** — this repo is local-first, single-writer. The JSONL is interchange; multi-machine sync is a deliberate, explicit opt-in.
- **Never `bd init` a second workspace** — there is one workspace at `.beads/`.
- Merge gates and commit authority follow the `AGENTS.md` rules, regardless of which harness is active.

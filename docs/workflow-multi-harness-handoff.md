# Multi-Harness Handoff Workflow

Reader's Way work happens across many surfaces: Claude Code, Claude desktop, Claude mobile, OpenCode, Codex (CLI, desktop, mobile). Regardless of where you pick up, `bd` (Beads) is the source of current working status — for planning, implementation, reviews, and brainstorming equally.

## Harness capabilities

| Harness | Runs `bd` | `bd prime` | Reads `AGENTS.md` |
|---|---|---|---|
| Claude Code (CLI) | ✅ | Auto (SessionStart hook) | Via `CLAUDE.md → @AGENTS.md` |
| Codex (CLI) | ✅ | Auto (SessionStart hook) | Via `.codex/` config |
| OpenCode | ✅ | Manual — run `bd prime` first | Direct |
| Claude desktop | ❌ | — | Share file or paste |
| Claude mobile | ❌ | — | Share file or paste |
| Codex desktop/mobile | ❌ | — | Share file or paste |

**For tool-capable harnesses:** `bd prime` is the single entry point — it injects the full command reference, current memories, and open-work state into context. On CLI harnesses it runs automatically; on OpenCode run it manually before starting work.

**For conversational harnesses (desktop/mobile):** you can't run `bd` directly. Use one of these to share current status with the model:

1. **Paste `bd prime` output** — run it in your terminal and paste the result into the chat.
2. **Paste `bd ready`** — shorter; just the unblocked work queue with context.
3. **Share the JSONL** — `.beads/issues.jsonl` is committed and pushed; you can share the raw GitHub URL or paste the file. It's the same data the db serves.

## Getting current status (any harness)

The question to answer before starting any session: *what is in flight, what's blocked, what's ready?*

```bash
bd prime          # full context: memories + command ref + open work
bd ready          # just the unblocked work queue
bd list --status=in_progress   # anything mid-flight
bd memories       # all stored cross-session context
```

On a conversational harness, run these in your terminal and share the output.

## Tracking all work types

Beads tracks more than implementation tasks. Use it for every kind of work so status is queryable regardless of harness:

| Work type | What to track in bd | Where the content lives |
|---|---|---|
| Implementation task | Feature/task bead with acceptance criteria | Code + plan doc |
| Planning / spec work | Task bead ("Draft 002e plan") | `docs/plans/` |
| Review (adversarial/independent) | Task bead ("Review 002d–002h") | `.agents/snapshots/` |
| Brainstorm / research | Task bead or note on parent epic | `docs/research/` or bead `--notes` |
| Decision / ADR | Task bead ("Write ADR-002") | `docs/adrs/` |
| Deployment / ops | Task bead ("Flip resend issuer") | `docs/state/deployment-setup.md` |

The bead is the *pointer* — status, dependencies, owner, notes. The doc file is the *content*. Never put planning content only in a bead description; never let a plan doc float without a tracking bead.

## Outgoing checklist (before switching harness or ending session)

```bash
# 1. Update bead status
bd close <id> --reason="what was done"            # if complete
bd update <id> --notes="where you left off, what's next, any blockers"  # if mid-flight

# 2. Save non-obvious context to a memory
bd memories handoff   # check existing keys first; update in place
bd remember --key <slug> "key decisions, caveats, gotchas, next action"

# 3. Quality gates (if code changed)
pnpm -r typecheck && pnpm -r test

# 4. Commit relevant files
git status   # confirm what changed
# Stage only relevant files — .beads/issues.jsonl is auto-exported; commit it if you
# want the JSONL on GitHub to reflect current state for conversational harnesses

# 5. Push (if authorised — see merge gate in AGENTS.md)
git push

# 6. Report to the user: branch, PR if open, bead status, what's next
```

## Incoming checklist (picking up work)

```bash
# 1. Get latest code
git pull --ff-only

# 2. Load session context (tool-capable harnesses)
bd prime
bd ready
bd list --status=in_progress

# 3. Read the active bead in detail
bd show <id>

# 4. Check memories
bd memories handoff   # any notes left by the outgoing session
bd memories <topic>   # search by area of work
```

On a conversational harness: run steps 1–4 in your terminal, paste or summarise the output into the session.

## Memory discipline

`bd remember` / `bd memories` is the cross-session, cross-harness knowledge layer. Think of it as structured commit messages for *intent and context*, not content.

- **Save:** non-obvious decisions, test gotchas, review findings that shaped a plan, "next step is X and why", anything you'd have to re-derive from scratch.
- **Don't save:** file paths / function names (read the code), git history (use `git log`), things already written in plan docs or ADRs.
- **One key per topic, updated in place:** `bd remember --key <existing-key> "revised content"` — not a growing append log.
- **Retire stale memories:** `bd forget <key>` once the work ships and the context no longer applies.

## Review / adversarial work handoff

Reviews cross harnesses often (one agent writes, another reviews):

1. **Outgoing reviewer:** write the packet to `.agents/snapshots/<name>-<date>.md`; note the path in a memory.
2. **Incoming implementer:** read the snapshot, triage findings (accepted / rejected with rationale / deferred), apply revisions, append disposition to the packet.
3. **Both:** update the plan's "Review revisions" section so accepted findings are visible inline without reading the snapshot.

See `.agents/snapshots/` for worked examples.

## Repo policy (applies across all harnesses)

- **Merge gate:** never merge a PR without explicit per-PR user confirmation. Stop after CI green and report. See `AGENTS.md`.
- **No `bd dolt push`:** this repo is local-first, single-writer. `.beads/issues.jsonl` + `.beads/config.yaml` are the committed source of truth; the binary Dolt db is local and gitignored.
- **No second `bd init`:** one workspace at `.beads/`. Multi-machine sync is a deliberate opt-in, not a default.

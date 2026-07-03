# Workflow State

Beads (`bd`) is the tracker of record for all active work — status, dependencies, notes, and handoff context. This file is no longer maintained as a live pointer.

To get current status:

```bash
bd dolt pull          # sync the Dolt db from remote first
bd prime              # full context: memories + command ref + open work
bd ready              # unblocked work queue
bd list --status=in_progress   # anything mid-flight
bd memories handoff   # cross-session handoff notes
```

See `docs/workflow-multi-harness-handoff.md` for the handoff workflow across Claude Code, OpenCode, and Codex.

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

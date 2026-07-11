# D1 Production Migrations and Recovery

This runbook owns production D1 promotion and emergency recovery for Reader's Way.
The repository contract is test-locked by
`scripts/d1-deployment-contract.test.ts`.

## Environment contract

| Environment | Database | UUID | Migration policy |
| --- | --- | --- | --- |
| Preview | `literacy_preview` config name (remote database currently named `flashcards`) | `e3884eb3-fb85-4b29-9940-9c241bbc67ef` | Automatic after verified pushes to `main` |
| Production | `literacy_prod` | `e6b236d6-e3ae-4ff8-9a7e-4874c8419c96` | Manual protected workflow only |

Never use the `DB` binding name as the migration target. Use the immutable database
name and the explicit Wrangler environment.

## Current production state

`literacy_prod` was created in WNAM and initialized from the canonical migration
directory on 2026-07-10. `0001_foundation.sql` is applied, no migrations are pending,
and the guardian, student, session, auth-token, practice-session, and attempt tables
all contain zero rows.

Pre-initialization bookmark:

```text
00000000-00000006-000050a4-582b708e04a004826f2f8a3f0a6c402c
```

Post-initialization bookmark:

```text
00000001-00000004-000050a4-514c415ca9c338488001e4a913e3a336
```

Production starts clean. Do not export or import the preview database.

## External-guardian trigger

The repository Actions variable `EXTERNAL_GUARDIAN_PILOT` is `false` by default.
The manual production migration workflow refuses to run until it is exactly `true`.
Set it to `true` only immediately before the first non-household guardian is granted
access and only after the enrollment allowlist, production Worker binding, and pilot
smoke checks are verified.

Do not enable the external pilot while production uses the `dev-log` email issuer.
Allowlist mode never echoes its link to the caller, but `dev-log` only records the
usable link in operator logs and does not prove mailbox ownership. Before changing
the variable:

1. set production `AUTH_EMAIL_ISSUER = "resend"`;
2. configure `RESEND_API_KEY` as a production Worker secret;
3. replace the placeholder `EMAIL_FROM` with a verified sender; and
4. complete the operational test send in `docs/state/deployment-setup.md`.

Production is configured with `AUTH_ACCESS_MODE = "allowlist"`. The
`GUARDIAN_EMAIL_ALLOWLIST` value is a Cloudflare production secret; missing or empty
means no new guardian can enroll. Denied requests must be rejected before guardian or
auth-token insertion. See `docs/state/deployment-setup.md` for the secret procedure.

The GitHub environment `production-d1` is restricted to protected branches. This is
a single-owner repository, so it currently has no required second reviewer; the
workflow additionally requires the operator to type `literacy_prod` and provide a
change or incident reference.

## Routine production migration

1. Merge the migration only after it passes preview CI and preview exercise.
2. Confirm the production Worker version remains compatible with both the old and
   new schema for the migration window.
3. In GitHub Actions, run **migrate production D1** from the protected `main` branch.
4. Type `literacy_prod` exactly and provide the PR/incident reference.
5. Retain the pre-migration Time Travel bookmark written to the workflow summary.
6. Confirm the workflow reports no pending migrations and can read the migration
   ledger.
7. Before external access, verify the deployed Worker's D1 binding UUID through the
   Cloudflare dashboard/API. An unauthenticated HTTP response cannot distinguish
   preview from production and is not acceptable binding evidence.

The workflow verifies the remote name and UUID before applying migrations. A normal
push to `main` can migrate preview only.

## Recovery decision

### The migration command fails

Wrangler rolls back the failed migration while leaving earlier successful migrations
applied. Keep or restore the previous compatible Worker version, diagnose the failure,
and ship a corrected forward migration. Never edit a migration already applied to
either environment.

### The migration succeeds but is harmful

Prefer a forward-fix when production has accepted writes after the pre-migration
bookmark. Time Travel restores the whole database and discards all later writes.

There is no tested general-purpose maintenance switch yet. Therefore:

- before external-pilot activation, Time Travel is allowed only while
  `EXTERNAL_GUARDIAN_PILOT=false`, the production allowlist secret is absent, and
  both `session` and `auth_token` contain zero rows;
- after external-pilot activation or while authenticated writers may exist, do not
  Time Travel. Use a forward-fix and escalate until a tested write-quiescence
  mechanism exists.

For an eligible pre-pilot restore:

1. Verify the external-pilot variable is false, `GUARDIAN_EMAIL_ALLOWLIST` is absent
   from `wrangler secret list --env production`, and the session/token counts are
   zero. If any check fails, stop and use a forward-fix.
2. Capture the current bookmark so the restore can itself be undone:

   ```bash
   pnpm --filter api exec wrangler d1 time-travel info literacy_prod --env production --json
   ```

3. Confirm the pre-migration bookmark from the workflow summary and the incident
   decision with the owner.
4. Restore the database:

   ```bash
   pnpm --filter api exec wrangler d1 time-travel restore literacy_prod --env production --bookmark=<pre-migration-bookmark> --json
   ```

5. Retain the returned `previous_bookmark`; it can undo the restore.
6. Verify the restored schema/data and list pending migrations. The harmful migration
   will be pending again because Time Travel also rewinds `d1_migrations`.
7. Re-verify the production UUID, then with explicit owner approval for the exact
   filename, mark only the restored harmful migration as superseded in the ledger:

   ```bash
   pnpm --filter api exec wrangler d1 info literacy_prod --env production --json
   pnpm --filter api exec wrangler d1 execute literacy_prod --env production --remote --command "INSERT INTO d1_migrations (name) VALUES ('NNNN_harmful.sql')"
   pnpm --filter api exec wrangler d1 execute literacy_prod --env production --remote --command "SELECT id, name, applied_at FROM d1_migrations ORDER BY id"
   ```

8. Add a new corrective migration after the harmful file. Confirm `migrations list`
   shows only the corrective migration, then apply it.
9. Verify no migrations remain pending, the corrective postconditions hold, and the
   harmful SQL was not rerun before reopening writes.

Never apply migrations immediately after a Time Travel restore without reconciling
the rewound ledger. Never mark a migration applied unless its effects were removed by
the selected restore and the exact filename is present in the canonical repository.

Time Travel retention is seven days on Workers Free and 30 days on Workers Paid.
Restoring overwrites the database in place and cancels in-flight queries. See
<https://developers.cloudflare.com/d1/reference/time-travel/>.

## Verified rollback drill — 2026-07-10

The procedure was tested remotely with Wrangler 4.92.0 against a disposable WNAM D1
named `literacy_rollback_drill` (UUID
`fddb2cea-d0fd-4699-9e1d-079077ee415e`).

1. Created `rollback_probe` with row `(1, 'baseline')`.
2. Captured baseline bookmark:
   `00000000-00000008-000050a4-fb13780662f069aa17a7e1f3da79df02`.
3. Applied valid harmful SQL: added `harmful_marker`, changed the value to
   `corrupted`, and verified the harmful state was visible.
4. Restored to the baseline bookmark.
5. Cloudflare returned undo bookmark:
   `00000000-ffffffff-000050a4-48b03f444f20337ed030c936a222de56`.
6. Verified the value was `baseline` and `harmful_marker` column count was zero.
7. Permanently deleted the disposable drill database.

The drill did not touch preview or production data and incurred no expected marginal
cost.

## Verified migration-ledger recovery drill — 2026-07-10

The complete migration-runner procedure was tested remotely against disposable WNAM
D1 `literacy_rollback_ledger_drill` (UUID
`d64620db-4130-42de-9c26-a12f65a51f04`):

1. Wrangler applied `0001_baseline.sql`; the pre-harmful bookmark was
   `00000001-00000004-000050a4-403e7619c7788e95d174523dc5bd80ae`.
2. Wrangler applied `0002_harmful.sql`; both harmful data and schema were verified.
3. Time Travel restored the pre-harmful bookmark and returned undo bookmark
   `00000002-ffffffff-000050a4-156453721365a43ebbfba54d33c6acbc`.
4. `migrations list` showed `0002_harmful.sql` pending again, proving the ledger was
   rewound.
5. The exact `0002_harmful.sql` name was inserted into `d1_migrations` as superseded.
6. Wrangler then listed and applied only `0003_recovery.sql`.
7. Final verification showed baseline data, no harmful column, one recovery marker,
   all three ledger rows, and no pending migrations.
8. The disposable database was permanently deleted.

## Verified failed-migration atomicity — 2026-07-10

Wrangler 4.92.0 was also tested locally with a migration that created a table, inserted
one valid row, and then violated a `CHECK` constraint. The migration returned failure;
the table and partial row were absent afterward, and the failed migration remained
pending. This confirms the command-failure path is atomic in the tested D1 runtime.

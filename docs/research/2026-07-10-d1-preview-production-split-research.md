# Research: D1 preview/production split

**Bead:** `rw-bpb`
**Date:** 2026-07-10
**Scope:** Definition/design evidence plus the approved creation of the empty
production database; no Worker binding or migration change has been applied.

## Surface area

- `api/wrangler.toml`
  - The top-level, `preview`, and `production` `DB` bindings all name
    `literacy_preview` and use the same database UUID.
  - `env.production` is deployed as the `api-flashcards` Worker.
- `.github/workflows/ci.yml`
  - `verify` runs on pull requests and pushes to `main`.
  - `migrate` runs after `verify` on every push to `main` and applies all pending
    migrations remotely to the hard-coded `literacy_preview` database.
- `api/migrations/0001_foundation.sql`
  - The only current migration creates guardian/auth/session/student/mastery,
    practice-session, and attempt tables.
- `api/src/routes/auth.ts` and `api/src/email/magic-link.ts`
  - `/auth/start` inserts a new guardian before issuing a link.
  - `dev-log` returns that usable link to the caller, so it is not a household-only
    access boundary.
- `package.json`
  - `db:migrations:list` is also hard-coded to `literacy_preview`.
- `scripts/check-sentinel.sh`
  - Existing precedent for a small, testable configuration-contract gate in CI.
- `docs/state/deployment-setup.md`
  - Documents the current shared-DB posture and the manual Cloudflare/GitHub setup
    surface.
- `docs/specs/001-literacy-app-v1-design.md` and
  `docs/plans/001a-literacy-app-v1.md`
  - Establish a forward-fix default for D1 migrations, but predate the current D1
    Time Travel recovery surface and do not specify a tested emergency recovery
    drill.
- GitHub repository configuration (read-only inspection on 2026-07-10)
  - No repository Actions variables exist.
  - The only configured GitHub environment is `github-pages`; there is no protected
    production-D1 environment.
- Local Cloudflare access (read-only inspection on 2026-07-10)
  - Wrangler 4.92.0 was authenticated through the owner OAuth flow.
  - The pre-existing configured UUID resolves to a remote D1 named `flashcards`, not
    `literacy_preview`; that naming mismatch must be preserved consciously or cleaned
    up separately rather than hidden by the split.

## Approved remote action

After the owner approved creation with the verified expectation of $0 marginal cost,
`literacy_prod` was created on 2026-07-10:

- database UUID: `e6b236d6-e3ae-4ff8-9a7e-4874c8419c96`;
- region: Western North America (`WNAM`);
- backend: production;
- state after creation: empty, no tables, approximately 8–12 KB;
- pre-initialization Time Travel bookmark:
  `00000000-00000006-000050a4-582b708e04a004826f2f8a3f0a6c402c`.

The account remains well below even the Free-plan database limit. The repository's
production binding now points at the new UUID, `0001_foundation.sql` is applied, and
all user-data tables were verified empty. A disposable remote Time Travel drill also
restored both data and schema successfully and was deleted afterward; the evidence is
recorded in `docs/state/d1-production-migrations.md`.

## Key findings

### Current failure mode

The database boundary is nominal rather than real: preview and production resolve
to the same D1 UUID. Merging any PR runs remote migrations against that database,
whether or not the PR is intended to change production data. A Worker rollback does
not undo a schema or data migration.

### Wrangler configuration shape

D1 bindings and variables are non-inheritable Wrangler environment keys, so each
environment must declare its own binding. The target shape is therefore:

- top-level/local and `env.preview` -> `literacy_preview` / preview UUID;
- `env.production` -> `literacy_prod` / distinct production UUID;
- migration commands select the environment explicitly and use the immutable
  database name, not the mutable binding name.

Cloudflare recommends database names for migration commands because binding names
can change. Relevant documentation:

- <https://developers.cloudflare.com/d1/configuration/environments/>
- <https://developers.cloudflare.com/workers/wrangler/environments/>
- <https://developers.cloudflare.com/d1/reference/migrations/>

### A code-only gate is insufficient

A repository check can prove that preview and production IDs differ and that CI
does not auto-target production. It cannot prove that a UUID exists in the intended
Cloudflare account or that the operator has declared the external-guardian trigger.
The complete gate needs both:

1. a deterministic PR check over the checked-in deployment contract; and
2. a remote, authenticated production-migration workflow protected by explicit
   operator state.

The operational trigger should be expressed as a precondition, not inferred after
data appears:

> Before enabling a production path that can issue a usable magic link to any
> guardian outside the owner household, production must be bound to a distinct,
> initialized D1 database and the production-migration gate must be enabled.

This is mechanically safer than waiting to discover the first external guardian row
after it has already been written.

The current `AUTH_EMAIL_ISSUER` setting cannot enforce that precondition. In
`dev-log` mode, any caller with API access can receive the usable magic link in the
response, and the guardian row is inserted first. A real trigger therefore needs a
fail-closed enrollment check before the first guardian insert (for example, a
household/pilot allowlist) or must be acknowledged as an operator-only convention.

### Recovery has two different cases

Wrangler documents that a migration which errors is rolled back atomically while
previous successful migrations remain applied. That does not protect against a
migration that succeeds technically but is harmful semantically.

For a successful bad migration, D1 Time Travel can restore the whole database in
place to a pre-migration bookmark. It is always enabled on the production storage
backend, but retention is plan-dependent (currently 7 days on Workers Free and 30
days on Workers Paid). Restore cancels in-flight queries, overwrites the database,
and can discard all writes after the selected bookmark. The restore response returns
the previous bookmark, which can be used to undo the restore.

Therefore the default remains a forward-fix. Time Travel is an emergency procedure
only when the damage of retaining post-migration writes is greater than the damage of
losing them.

Relevant documentation:

- <https://developers.cloudflare.com/d1/reference/time-travel/>
- <https://developers.cloudflare.com/d1/wrangler-commands/>

### A safe rollback test needs a disposable remote database

Local D1 can test migration failure behavior, but it cannot establish that account
permissions and remote Time Travel restore work. The acceptance criterion should be
tested against a disposable `literacy_rollback_drill` database:

1. initialize a sentinel table/row;
2. capture a bookmark;
3. apply a deliberately harmful but valid SQL change outside the canonical migration
   directory;
4. restore to the bookmark;
5. assert the harmful change is absent and the sentinel state is intact;
6. record the commands/results, then delete the disposable database.

No restore drill should be performed against `literacy_preview` or `literacy_prod`.

## Resolved decisions

- **Production starts clean.** There is no owner-household progress to preserve, so
  `literacy_prod` will be initialized only from canonical migrations. No preview
  export, data-copy script, or selective transfer is required.

## Unknowns

- What exact email addresses comprise the owner household allowlist? This should not
  be committed if it contains private addresses; the design needs an operational
  source of truth.
- Is a small fail-closed enrollment guard within `rw-bpb` scope, or should it be a
  separate blocking security bead? Without it, the external-guardian trigger is not
  mechanically enforceable.
- Is the Cloudflare account on Workers Free or Paid? This changes Time Travel
  retention from 7 to 30 days and therefore the response window.
- Should production schema promotion remain manual for the entire pilot, or become an
  automatically queued deployment with a protected-environment approval after the
  external-guardian trigger?
- Can the repository's GitHub plan enforce required reviewers for a production-D1
  environment, and is a second reviewer available? A single-owner workflow cannot
  depend on an approval rule the owner is prohibited from self-approving.
- Is Cloudflare GitHub Builds already deploying `api-flashcards --env production`
  from the checked-in config? If so, merging the binding change is itself the
  production cutover and must be sequenced after database initialization/data-copy
  decisions.

## Risk areas

- **Cutover ordering:** deploying `env.production` with a new but uninitialized D1
  breaks auth and practice immediately.
- **Data-copy ambiguity:** blindly exporting preview into production may carry test
  guardians/tokens/sessions; starting clean may discard desired owner-household
  progress.
- **False gate confidence:** distinct UUID strings do not prove database existence,
  account ownership, schema currency, or correct Worker binding.
- **Trigger bypass:** `dev-log` currently echoes a usable link and `/auth/start`
  creates arbitrary guardian rows, so an operator-only trigger can be crossed without
  a deployment/configuration change.
- **Unreviewed automatic migration:** preserving the current push-to-`main` behavior
  for production would recreate the original risk after the split.
- **Restore data loss:** Time Travel restores the entire database, not only schema,
  so writes after the bookmark may be lost.
- **Credential scope:** the owner OAuth session can write D1 and many other Cloudflare
  resources. Commands must remain narrowly scoped to the intended database.
- **Migration-history divergence:** preview and production must consume the same
  immutable migration files in order; editing an already-applied migration would make
  recovery and environment parity unreliable.

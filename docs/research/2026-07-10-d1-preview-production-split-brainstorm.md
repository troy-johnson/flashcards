# Brainstorm: D1 preview/production split

**Bead:** `rw-bpb`
**Status:** Draft design direction; clean production initialization, binding,
preview-only automatic migration path, gated manual production workflow, and remote
rollback drill are implemented locally/remotely. The fail-closed enrollment guard is
implemented and verified.
**Research input:**
[`2026-07-10-d1-preview-production-split-research.md`](2026-07-10-d1-preview-production-split-research.md)

## Problem frame

Preview and production currently share one D1 UUID, and every successful push to
`main` applies migrations to it. The split must establish a real data boundary,
prevent routine CI from mutating production before external-guardian activation,
and give the operator a rehearsed response to a migration that succeeds but damages
schema or data.

The phrase “first non-household guardian” must describe an action taken before the
first external row is inserted. Before this work, `dev-log` echoed a usable magic
link to any `/auth/start` caller. The implemented allowlist mode now returns an empty
204 for both allowed and denied callers; verified Resend delivery remains required
before real production access.

## Constraints and assumptions

- `literacy_preview` remains disposable/non-production and can migrate automatically
  after `main` verification.
- `literacy_prod` is a distinct Cloudflare D1 database and is the only database bound
  to `env.production` after cutover.
- Production migrations use the same immutable SQL files as preview, in the same
  order.
- A migration that fails is allowed to rely on Wrangler's documented per-migration
  rollback. A migration that succeeds but is harmful uses forward-fix by default.
- Time Travel is an emergency whole-database restore, not a routine schema downgrade.
- The owner authenticated Wrangler and approved creation of `literacy_prod`; its
  production binding and canonical schema initialization are now verified. The
  disposable remote recovery drill passed and its database was deleted.
- Production starts clean. There is no owner-household progress to transfer from
  preview.

## Approaches considered

### Approach A: Automatically migrate both databases on every push to `main`

Change the existing workflow to run preview and production migration commands after
verification, relying on the D1 split to contain blast radius.

**Advantages**

- Smallest workflow change.
- Preview and production remain schema-current without operator action.
- Little release-process overhead.

**Costs and risks**

- Recreates the original operational risk on a more valuable database: merging code
  still mutates production immediately.
- No deliberate preview dwell time or production approval.
- A green unit-test suite cannot establish that a migration is safe for live pilot
  data.
- Does not satisfy the requested pre-trigger production migration gate.

**Disposition:** Reject.

### Approach B: Automatic preview, explicit production promotion

Keep preview migration automatic after a verified push to `main`. Move production
migration into a separate manual workflow with a production-D1 GitHub environment,
an explicit external-pilot variable, a typed database confirmation, remote identity
checks, and a captured pre-migration Time Travel bookmark. Add a fail-closed guardian
allowlist before insert so the external-guardian trigger is enforceable.

**Advantages**

- Removes production data mutation from the normal merge path.
- Makes the first external guardian an intentional operator action.
- Preserves a lightweight workflow suitable for a small pilot.
- Produces recovery evidence for every production migration.
- Can become more automated later without changing the database boundary.

**Costs and risks**

- Adds one manual release action for production schema changes.
- Requires GitHub environment/variable setup and Cloudflare credentials.
- Adds a small auth-path behavior to `rw-bpb` because unrestricted `dev-log` behavior
  was not a household-only boundary.
- A single-maintainer repository may not be able to use a second-person approval;
  typed confirmation and protected environment remain useful but are not independent
  review.

**Disposition:** Recommend for the pilot.

### Approach C: Dedicated release branch or migration service

Promote vetted migrations through a release branch or a purpose-built migration
controller that records approvals, schema versions, maintenance state, and recovery
bookmarks.

**Advantages**

- Strong separation of code merge and database release.
- Better auditability and multi-operator controls at larger scale.
- Natural home for maintenance windows and staged rollouts.

**Costs and risks**

- Considerably more machinery than one small D1 pilot needs.
- Creates a second release lifecycle before the project has evidence it needs one.
- More custom code and operational surface to test and maintain.

**Disposition:** Defer until production cadence or team size justifies it.

## Recommended design

### 1. Environment contract

The checked-in contract is:

| Wrangler scope | Worker use | D1 name | D1 identity |
| --- | --- | --- | --- |
| top-level | local development defaults | `literacy_preview` | preview UUID |
| `env.preview` | non-production Worker | `literacy_preview` | preview UUID |
| `env.production` | production Worker | `literacy_prod` | distinct production UUID |

A new tested script, `scripts/d1-deployment-contract.ts`, should fail CI when:

- preview and production UUIDs are equal;
- production is not named `literacy_prod`;
- either remote UUID is missing or uses the sentinel value;
- the push-to-`main` migration job targets production;
- the production migration workflow lacks manual dispatch, the
  `production-d1` environment, or the external-pilot gate.

The script verifies repository intent only. The authenticated workflow separately
verifies the remote database name/UUID with `wrangler d1 info --json` before applying
anything.

### 2. Trigger and state model

Use three operational states:

1. **Household-only** — preview may migrate automatically; the production migration
   workflow is disabled; production auth accepts only addresses in a private
   guardian allowlist.
2. **Cutover-ready** — `literacy_prod` exists, canonical migrations are initialized,
   the production Worker binding is verified, the rollback drill has passed, and any
   chosen owner data transfer is complete. External addresses are still rejected.
3. **External pilot enabled** — immediately before the first non-household guardian
   is invited or given access, set the non-secret GitHub Actions variable
   `EXTERNAL_GUARDIAN_PILOT=true` and add that normalized address to the production
   guardian allowlist. The production migration workflow becomes available but
   remains manual and protected.

The allowlist check must run before guardian or auth-token insertion and return a
non-enumerating response for denied addresses. The allowlist itself belongs in a
Cloudflare production secret, not in Git. During the pilot, external access remains
allowlisted rather than open signup.

This expands `rw-bpb` by one narrow auth guard. If scope separation is preferred, the
guard should become a new security bead that blocks `rw-bpb`; documenting the trigger
without enforcing it would leave the acceptance criterion nominal.

### 3. CI and promotion workflows

**Pull request / verify job**

- Run the tested D1 deployment-contract check.
- When migrations change, show the migration list and require the existing reviewer
  checklist entry.
- Never access or mutate a remote database from a pull-request job.

**Push to `main` / preview migration job**

- Keep the current dependency on all quality gates.
- Apply only `literacy_preview --remote --env preview`.
- Never reference `literacy_prod` in this event path.

**Manual production migration workflow**

- Trigger only with `workflow_dispatch`.
- Require `EXTERNAL_GUARDIAN_PILOT == true`.
- Target the GitHub environment `production-d1`.
- Require the operator to type `literacy_prod` and provide a reason/change reference.
- Use the immutable database name plus `--env production`.
- Run `d1 info --json` and compare the remote identity with the checked-in production
  contract.
- List pending migrations and stop successfully when there are none.
- Capture and retain the pre-migration Time Travel bookmark in the workflow summary.
- Apply migrations, then assert no pending migrations remain and run a minimal
  read-only schema/health query.

The one-time production initialization is an explicit owner operation during
cutover, not part of the push-to-`main` path. It records the same pre/post evidence as
the manual production workflow.

### 4. Cutover sequence

1. Authenticate Wrangler with the owner account or a D1-scoped API token.
2. Inspect `literacy_preview` only to confirm that no production data transfer is
   required; do not export it.
3. Create `literacy_prod`; record its UUID and storage backend/version.
4. Apply canonical migrations explicitly and verify `d1_migrations` is current.
5. Verify the new database contains no guardian, student, session, auth-token,
   practice-session, or attempt rows.
6. Create and run the disposable remote rollback drill described below.
7. Update `env.production` to the distinct database and land the repository gate/
   workflow changes.
8. Verify the deployed production Worker reads the expected database without adding
   an external guardian.
9. Keep external access allowlisted until the owner explicitly enables the external
   pilot state.

No whole-database preview export should be created or imported. Production state is
derived from canonical migrations only.

### 5. Bad-migration response

**Migration command fails**

- Wrangler rolls back that migration and leaves previously successful migrations
  applied.
- Keep production on the previous compatible Worker version.
- Correct the SQL in a new migration if the failed file was applied anywhere; do not
  rewrite an applied migration.

**Migration succeeds but is wrong**

1. Use a forward-fix whenever authenticated writers may exist; the current system has
   no tested general-purpose maintenance switch.
2. Before external activation, Time Travel may be used only while the pilot variable
   is false, the allowlist secret is absent, and auth-token/session counts are zero.
3. Restore to the recorded pre-migration bookmark and retain the returned undo
   bookmark.
4. Verify the harmful migration is pending again, then reconcile its exact filename
   in `d1_migrations` with explicit owner approval.
5. Apply a later corrective migration and prove the harmful file was not rerun.

The runbook must state the account's actual 7-day or 30-day retention after remote
inspection. Time Travel restore is destructive, cancels in-flight queries, and can
discard every write after the selected bookmark.

### 6. Rollback drill

Use disposable drill D1s, never preview or production:

1. Create a sentinel table and row.
2. Capture a Time Travel bookmark.
3. Apply valid harmful SQL through the real Wrangler migration runner.
4. Confirm the harmful state is visible.
5. Restore to the bookmark.
6. Assert the sentinel row is restored, harmful schema/data is absent, and the
   harmful migration is pending again.
7. Reconcile that exact ledger entry, add a corrective migration, and prove Wrangler
   applies only the corrective migration.
8. Separately prove a constraint failure rolls back all earlier statements in one
   failed migration.
9. Record evidence and delete every disposable database.

This tests the remote account permissions and recovery mechanism without risking
pilot data. A separate local test should prove that a syntactically valid migration
which violates a later constraint leaves earlier statements in that migration
rolled back.

## Resolved design decisions

1. The guardian enrollment guard is part of `rw-bpb` because the trigger is otherwise
   unenforceable.
2. The single-owner `production-d1` environment uses protected branches, typed
   confirmation, remote UUID verification, and PR review; no second required reviewer
   is currently available.

## ADR signal

The environment boundary, promotion model, and recovery posture constrain all future
D1 schema work. They warrant an ADR after the recommended direction and enrollment-
guard scope are approved.

## Self-review

- Three approaches are compared; the recommendation is explicit.
- The design does not depend on `AUTH_EMAIL_ISSUER` as an access gate.
- Preview automation and production promotion cannot target the same database under
  the checked-in contract.
- The remote recovery test never operates on preview or production.
- Forward-fix and Time Travel are not described as interchangeable.
- Infrastructure changes, secrets, and remote mutations remain outside this draft.

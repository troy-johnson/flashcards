# rw-bpb adversarial code review — 2026-07-10

## Target and plan

- Target: current `plan/rw-bpb-d1-split` branch diff and untracked rw-bpb artifacts.
- Profile: `code`.
- Model: `gpt-5` from the Codex system runtime.
- Transport: two independent fresh-context subagents.
- Reviewers:
  - auth/security correctness;
  - CI/D1 operability and recovery.
- Reviewers were given only the bead, repository diff/artifacts, and verification
  evidence. They did not edit files or external state.

## Round 1 verdict

Both reviewers returned `BLOCKED`.

Accepted findings:

1. Production allowlist + `dev-log` distinguished allowed addresses and echoed a
   usable link.
2. Missing/invalid `AUTH_ACCESS_MODE` failed open.
3. The production Worker HTTP smoke could not prove the deployed D1 binding.
4. The fixed eight-table postcheck was incompatible with legitimate future schema
   evolution.
5. Time Travel rewound `d1_migrations`, so the harmful migration would be pending and
   rerun before a later corrective migration.
6. Failed-migration atomicity lacked direct test evidence.
7. Allowlist operational docs were duplicated.

## Remediation and evidence

- Allowlist mode now always returns an empty `204`; `dev-log` never echoes to an
  allowlist caller.
- Missing or unknown access modes deny before guardian/token insertion.
- Resend configuration/provider failures are logged, the new token is deleted, and
  allowlist callers still receive the same empty `204`; open mode preserves error
  propagation.
- Auth route tests cover denied, absent-secret, normalized allowed, missing/invalid
  mode, and delivery-failure behavior.
- The false Worker HTTP smoke was removed. The workflow verifies the migration target
  UUID directly and reads the stable migration ledger after apply.
- The fixed schema-name postcheck was replaced by a `d1_migrations` readability
  check.
- A remote actual-runner drill proved Time Travel makes the harmful migration pending;
  exact ledger reconciliation then caused Wrangler to apply only the later corrective
  migration. Final data/schema/ledger state was verified and the disposable D1 was
  deleted.
- A local Wrangler drill proved a later `CHECK` failure rolls back the table and
  earlier row in the same migration, leaving the migration pending.
- The runbook contains exact production-targeted reconciliation commands and prohibits
  Time Travel after external activation because no general write-quiescence switch is
  currently tested.
- Duplicate/stale operational documentation was reconciled.

## Round 2 and final verification

- Operability reviewer: `APPROVED WITH NITS`; its three documentation nits were
  accepted and fixed (write-quiescence boundary, exact ledger command, stale auth
  wording).
- Auth reviewer round 2 found one provider-failure enumeration blocker.
- Targeted final verification after remediation: `APPROVED`, with no remaining issue
  related to provider-failure enumeration or token cleanup.

## Final synthesis

**Verdict: APPROVED.**

No correctness, security, CI-targeting, remote-identity, schema-evolution, or
migration-recovery blocker remains. The deliberate operational boundary is that
Time Travel is pre-pilot-only until a tested general write-quiescence mechanism is
implemented; after external activation, bad migrations use forward-fix.

## Verification

- `mise exec -- pnpm test`: pass (API 88, app 44, script tests 121).
- `mise exec -- pnpm typecheck`: pass.
- `mise exec -- pnpm lint`: pass.
- `mise exec -- pnpm content:validate`: pass.
- `mise exec -- pnpm audio:manifest:check`: pass.
- Workflow YAML parse: pass.
- `git diff --check`: pass.
- Remote `literacy_prod`: canonical migration current; no pending migrations.
- GitHub `EXTERNAL_GUARDIAN_PILOT`: `false`.
- Disposable rollback databases: deleted.

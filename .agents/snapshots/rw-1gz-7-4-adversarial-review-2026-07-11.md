# rw-1gz.7.4 adversarial code review — 2026-07-11

## Target and review setup

- Target: current `plan/rw-1gz-7-4-magic-link-rate-limit` branch diff.
- Profile: security and concurrency review of magic-link throttling.
- Model: `vercel/moonshotai/kimi-k2.7-code`.
- Transport: OpenCode through the Vercel AI Gateway.
- Fresh-context constraint: the reviewer ran with tools disabled and received only
  focused descriptions of the implemented controls and verification evidence.

OpenCode's normal tool manifest exhausted the reviewer's context before it could
return a disposition. A temporary, tool-free OpenCode review agent preserved the
requested model and gateway while reducing the prompt to the review evidence.

## Round 1 verdict

**Verdict: BLOCKED.**

The reviewer found that an exact three-attempts-per-email-per-15-minutes cap did not
constrain an attacker rotating recipient addresses. It required a second source-level
control before public Resend access.

## Remediation

- Added a production Cloudflare Workers Rate Limiting binding at 10 attempts per
  source IP per minute.
- Applied the source-IP limiter only when access is `open` and the issuer is
  `resend`; allowlist and local development behavior remain unchanged.
- Hashed the source IP before passing it as the limiter key.
- Made public Resend issuance fail closed when either the binding or trusted
  `cf-connecting-ip` header is absent.
- Kept the D1-backed exact per-email cap as the authoritative anti-harassment
  control because Cloudflare documents its native rate limiter as permissive and
  location-local.
- Added route tests for missing configuration, missing source IP, rejected requests,
  hashed keys, concurrent same-email bursts, expiry, and provider failures.
- Added a deployment-contract test for the production binding and documented the
  combined controls in ADR-001 and the user journey.

## Round 2

Security review returned `NO SECURITY BLOCKER` for the combined exact
three-per-email-per-15-minutes limit and fail-closed 10-per-IP-per-minute production
control.

The first concurrency review called the conditional `INSERT ... SELECT` a
check-then-write race. That finding was challenged with the platform contract:
Cloudflare documents each D1 database as single-threaded and processing queries one
at a time, D1 runs each query in an implicit transaction, and SQLite starts a write
transaction for an `INSERT`. On reconsideration, the reviewer withdrew the blocker
and concluded that another query cannot interleave between the `SELECT` and `INSERT`
phases of this single statement.

Primary platform evidence:

- <https://developers.cloudflare.com/d1/reference/faq/#how-much-work-can-a-d1-database-do>
- <https://developers.cloudflare.com/d1/sql-api/foreign-keys/>
- <https://www.sqlite.org/lang_transaction.html#read_transactions_versus_write_transactions>

## Final synthesis

**Verdict: APPROVED.**

No security or concurrency blocker remains. The Cloudflare limiter is deliberately a
coarse abuse backstop; the single-statement D1 ledger remains the exact per-recipient
limit.

## Verification

- `mise exec -- pnpm test`: pass (API 93, app 44, script tests 122).
- `mise exec -- pnpm typecheck`: pass.
- `mise exec -- pnpm lint`: pass.
- Production Wrangler deploy dry-run: pass; `literacy_prod` and
  `AUTH_RATE_LIMITER (10 requests/60s)` are bound.
- No deployment or external resource creation was performed.

# PR #138 adversarial review — round 2

Date: 2026-07-17
Target: `origin/main...HEAD` on `plan/rw-vja-same-site-api`
Profile: `code`

## Reviewers

- `vercel/zai/glm-5.2` — fresh-context code reviewer
- `vercel/openai/gpt-5.6-luna` — fresh-context code reviewer

Both reviewers were given only the branch diff, relevant repository files,
round-1 evidence, and the recorded verification commands. Neither reviewer was
given the parent conversation or an expected verdict.

## Raw verdicts and findings

### `vercel/zai/glm-5.2`

Verdict: `APPROVED WITH NITS`.

The reviewer found no code blocker. It confirmed that the production API
trigger is applied after the validated version deploy, that CI builds and
checks the real production frontend bundle, and that the cookie/CORS design is
correct. It identified these nits:

- The frontend versioned deploy declared a custom-domain route but did not
  apply its trigger.
- Live API DNS, HTTPS, and browser magic-link smoke were not evidenced.
- The API remains available on its `workers.dev` hostname unless explicitly
  disabled.
- There is no automated browser-level credentialed CORS test.
- `wrangler triggers deploy` is experimental and the trigger step is not
  atomic with version deployment.
- Wrangler reports the intentional top-level `DIAG_GUARDIAN_EMAIL` warning.

### `vercel/openai/gpt-5.6-luna`

Verdict: `APPROVED WITH NITS`.

The reviewer independently reproduced the local evidence and found no code
blocker. It confirmed the same-site cookie design, exact API trigger ordering,
real-bundle check, full test result (`162/162`), and Wrangler dry-run results.
It likewise identified the missing frontend trigger application and the
external production DNS/browser-smoke prerequisite. It also noted the
experimental Wrangler command, non-atomic trigger sequencing, and the noisy
intentional production variable warning.

## Synthesis

The round-1 code blocker is resolved: the API production deploy now applies
the configured custom-domain trigger after deploying the validated version,
and CI verifies the actual Vite production bundle contains
`https://api.readersway.troyjohnson.dev` without the old `workers.dev` or local
fallback origins.

The remaining live readiness blocker is external. At review time,
`api.readersway.troyjohnson.dev` had no DNS answer and HTTPS could not resolve;
the attempted live Wrangler trigger application was rejected by the production
change approval gate. No live state was changed and no browser smoke result is
being inferred.

The frontend-trigger finding was remediated immediately after round 2 with a
focused RED/GREEN TDD checkpoint:

- `c2e31c9 RED: require frontend trigger application` — the new assertion
  failed with 161/162 tests passing, proving the command was absent.
- `bc7570e GREEN: apply frontend production triggers` — the shared deploy path
  now applies `wrangler triggers deploy` for both API and frontend, adding
  `--env production` only for the API.
- The focused deployment suite passes `7/7`; the full suite passes `162/162`.
- Both API and frontend Wrangler trigger dry-runs pass.

## Final disposition

`APPROVED WITH NITS` for code/merge readiness. Production is not ready for the
magic-link browser smoke until the API custom-domain route and DNS/certificate
are live. No merge is authorized by this review.

## Evidence

- Round 1 evidence: `.agents/snapshots/pr-138-adversarial-review-round-1-2026-07-17.md`
- Local verification after the post-review remediation: typecheck, lint,
  `pnpm test` (`162/162`), content validation, audio manifest/distribution
  checks, production frontend build, real bundle check, and API/frontend
  Wrangler trigger dry-runs all passed.

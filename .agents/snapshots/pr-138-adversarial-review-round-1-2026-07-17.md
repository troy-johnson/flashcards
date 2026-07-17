# PR #138 adversarial review — round 1

Date: 2026-07-17
Target: `plan/rw-vja-same-site-api` / PR #138
Profile: `code`
Run mode: fresh-context, read-only headless reviews

## Reviewers

- `vercel/zai/glm-5.2` — deployment/configuration, Cloudflare routing, environment separation, regression coverage, and operational readiness.
- `vercel/openai/gpt-5.6-luna` — auth/cookie semantics, security, deployment correctness, and test coverage. This was the substitute for `vercel/moonshotai/kimi-k3`, which returned `Service temporarily unavailable` twice.

## Evidence supplied

- `git diff origin/main...HEAD`
- auth/session, CORS, magic-link, app client, Wrangler, deployment script/tests, deployment contract tests, and deployment documentation
- prior lint, typecheck, full test, content/audio, app-build, Wrangler dry-run, PR verify, and both Workers Build results
- explicit note that DNS/custom-domain provisioning and a real post-deploy magic-link smoke were not yet evidenced

## Raw reviewer output — vercel/zai/glm-5.2

**VERDICT: APPROVED WITH NITS**

**BLOCKERS:**
None. The code/config change is correct, fail-closed guards are in place, all 15 deploy/contract tests pass, and CI is green (verify + both Workers Builds). The residual risks are operational verification gaps (acknowledged pending), not code defects.

**FINDINGS:**

- **MAJOR — Real-build bundle contract is not exercised by any automated test.** `scripts/cloudflare-production-deploy.ts:50-74` defines `assertFrontendProductionBundle`, and `runProductionDeployment` calls it after `pnpm --filter app build` (`cloudflare-production-deploy.ts:215`). But every test in `scripts/cloudflare-production-deploy.test.ts` mocks `run` (so `build` is a no-op) and passes a temp `frontendDistDirectory` fixture containing the origin literal. The tests prove the assertion logic and the wiring, not that the real Vite build embeds the origin or eliminates the fallback. This is exactly the regression the rw-vja issue flagged: a future Vite/`import.meta.env` regression is invisible in CI and would block a production deploy with no early warning. Recommend a CI test that builds the real app with a throwaway origin and runs `assertFrontendProductionBundle` against `app/dist`.

- **MAJOR — Live verification of the PR's actual target is unevidenced.** The stated target is fixing production magic-link sessions. The issue notes record that `api.readersway.troyjohnson.dev` has no DNS answer and that DNS/custom-domain provisioning plus a real post-deploy magic-link smoke are pending. The `routes` entry in `api/wrangler.toml:41-43` only declares intent; Cloudflare must provision the Custom Hostname and DNS. The SameSite/Lax/CORS design is correct on paper but unverified end-to-end.

- **MINOR — `workers_dev` not disabled for the production API.** `api/wrangler.toml` has no `workers_dev = false` under `[env.production]`. The old cross-site `api-flashcards.troyjohnson.workers.dev` endpoint stays live alongside the new custom domain. Disable it after the custom domain is provisioned and smoke-tested.

- **MINOR — Forbidden-origin list is incomplete for defense-in-depth.** `cloudflare-production-deploy.ts:64-67` forbids localhost and the old production workers.dev API origin but not `https://api-flashcards-preview.troyjohnson.workers.dev`. The same-site environment guard rejects it first, so risk is low.

- **MINOR — Source-map fragility in the bundle scan.** `frontendTextExtensions` includes `.map`; if source maps with `sourcesContent` are enabled later, the localhost literal could make production deploys fail-closed. This is safe but operationally noisy.

- **MINOR — No single source of truth for the production origin.** The production origin appears in Wrangler config, the deployment script, and the contract test without a test that compares the script constant to the Wrangler route.

- **NOTE — Test name overstates coverage.** The bundle test named “rejects the old API origin and localhost fallback” only writes the workers.dev origin into the fixture; the localhost-fallback rejection path is not exercised.

- **NOTE — Cookie/CORS design is correct.** `api/src/db/session.ts:7-8` sets `HttpOnly; Secure; SameSite=Lax` with no `Domain` (host-only). `api/src/index.ts:20` returns `APP_ORIGIN` with credentials enabled. `readersway.troyjohnson.dev` and `api.readersway.troyjohnson.dev` share the registrable domain `troyjohnson.dev`, so they are same-site. Preview remains separate.

**EVIDENCE:**

- Diff: `api/wrangler.toml:41-43`, `scripts/cloudflare-production-deploy.ts:27-74,203-215`, `scripts/d1-deployment-contract.test.ts:66-77`, and `docs/state/deployment-setup.md:17-25,173-174`.
- Cookie/auth path: `api/src/db/session.ts:7-11`, `api/src/index.ts:20`, `api/src/routes/auth.ts:93-106`, `app/src/api/client.ts:1,14-17`, and `api/src/email/magic-link.ts:16`.
- Independent test run: affected deployment and contract tests passed 15/15.
- Real bundle inspection: `app/dist/assets/index-B_lUywdI.js` contains the new API origin; no source maps or localhost/old-origin literals were present.
- CI: `verify`, API Workers Build, and frontend Workers Build succeeded; migration was skipped as expected on a PR.

**RECOMMENDED NEXT ACTION:**

Add a CI integration test for the real Vite build and bundle check; provision `api.readersway.troyjohnson.dev`; run a real production magic-link smoke; then optionally disable `workers_dev` for the production API.

## Raw reviewer output — vercel/openai/gpt-5.6-luna

**VERDICT: BLOCKED**

**BLOCKERS:**

- **BLOCKER — The API custom-domain trigger is declared at `api/wrangler.toml:39-43`, but `scripts/cloudflare-production-deploy.ts:162-183` only uploads and deploys the Worker version. It never runs `wrangler triggers deploy`, which Cloudflare requires to apply route/custom-domain changes made with `wrangler versions upload`.** Impact: `api.readersway.troyjohnson.dev` may not route to the deployed API, so magic-link sessions can fail before cookie behavior matters.
- **BLOCKER — Production activation is not evidenced.** `docs/state/deployment-setup.md:1-3` labels Cloudflare setup as pending, and the deployment sections describe dashboard actions still required. No DNS/custom-domain verification or real HTTPS magic-link smoke is available.

**FINDINGS:**

- **MINOR — Deployment tests use synthetic bundle fixtures.** They do not run Vite or inspect the actual `app/dist` generated by Vite. The production wrapper would reject a bad bundle when actually used, but CI can miss regressions in Vite substitution or output location.
- **MINOR — No automated test covers the browser credentialed CORS/preflight/session path.** Existing auth tests call the Worker directly and inspect `Set-Cookie`, but do not send a frontend `Origin`, exercise `OPTIONS`, or verify browser cookie storage.
- **MINOR — The client remains permissive when `VITE_API_ORIGIN` is absent.** `app/src/api/client.ts:1` falls back to localhost; the production wrapper rejects missing or incorrect values, so this is not currently a production-wrapper failure.

**EVIDENCE:**

- Cookie attributes at `api/src/db/session.ts:7-11`: host-only, `HttpOnly`, `Secure`, `SameSite=Lax`, and `Path=/`.
- Production hosts are same-site but cross-origin: frontend `APP_ORIGIN` at `api/wrangler.toml:45-50`, API route at `:41-43`.
- Credentialed requests are configured at `app/src/api/client.ts:13-18`; CORS credentials are enabled at `api/src/index.ts:20`.
- Magic-link URLs target the frontend at `api/src/email/magic-link.ts:16`, which consumes the token through the API and navigates to `/guardian`.
- Preview/local values remain separate and host-only cookies prevent sharing between environments.
- Reported lint, typecheck, tests, content/audio gates, app build, Wrangler dry-run, PR verification, and Workers Builds passed; those do not prove DNS/custom-domain activation or a real browser session flow.

**RECOMMENDED NEXT ACTION:**

Apply and verify the API custom-domain trigger and DNS; run an HTTPS smoke covering magic-link navigation, CORS preflight, cookie storage, `/auth/me`, logout, and token replay; add a CI/deployment test that runs the real Vite build and checks actual `app/dist` output.

## Synthesis

### Direct validation of the trigger finding

The installed Wrangler 4.92.0 CLI describes `wrangler triggers deploy` as:

> Apply changes to triggers (Routes or domains and Cron Triggers) when using `wrangler versions upload`

The repository's production deploy script calls `wrangler versions upload` and `wrangler versions deploy`, but contains no `wrangler triggers deploy` invocation. The trigger blocker is therefore accepted as confirmed, not speculative.

### Disposition

**FINAL VERDICT: BLOCKED**

The auth design is sound and the code checks are green, but the PR's target is production magic-link reliability. The route/domain trigger is not applied by the checked-in versioned deployment flow, and production DNS/custom-domain activation plus a real browser smoke are still pending. Both reviewers independently corroborated the real-build/live-verification gap; the second reviewer additionally found the trigger application defect.

### Required next actions

1. Add the production trigger-application step to the versioned API deployment flow, or document and verify an equivalent Cloudflare dashboard/Builds operation; add a test that asserts the step is present.
2. Provision and verify DNS, custom domain, and certificate for `api.readersway.troyjohnson.dev`.
3. Run a real HTTPS magic-link smoke: request, consume, verify `/auth/me`, logout, and token replay rejection, including CORS preflight/cookie behavior.
4. Add real-build CI coverage for `VITE_API_ORIGIN` and `app/dist` bundle verification.
5. Re-run adversarial review after remediation. Do not merge while the blocker remains.

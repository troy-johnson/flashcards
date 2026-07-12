# Deployment Setup — Pending User Actions

These steps must be completed once in the Cloudflare and GitHub dashboards to make the new deploy pipeline work. Code changes are already on this branch.

## 1. Create the frontend Worker with Static Assets

Cloudflare Pages was deleted because the dashboard-created project had no Git
connection and could not be retrofitted. The frontend now deploys as a Worker
with Static Assets from `app/wrangler.toml`.

1. Dashboard → Workers & Pages → Create application → Worker.
2. Project name: `flashcards`.
3. Pick `troy-johnson/flashcards`, production branch `main`.
4. Build settings:
   - Build command: `pnpm install --frozen-lockfile && pnpm --filter app build`
   - Deploy command: `pnpm --filter app exec wrangler deploy`
   - Root directory: leave empty (monorepo)
5. Environment variables (Production + Preview):
   - `VITE_API_ORIGIN = https://api-flashcards.troyjohnson.workers.dev`
   - `NODE_VERSION = 24`

Production deploys land at `https://flashcards.troyjohnson.workers.dev/`.
The API `APP_ORIGIN` for preview and production must match that URL.

## 2. Add CLOUDFLARE_API_TOKEN secret to GitHub

The new `migrate` job in `.github/workflows/ci.yml` needs API access on push-to-main.

1. https://dash.cloudflare.com/profile/api-tokens → Create Token → "Edit Cloudflare Workers" template (or custom: Account → D1: Edit + Workers Scripts: Edit, scoped to your account).
2. GitHub → Settings → Secrets and variables → Actions → New repository secret:
   - `CLOUDFLARE_API_TOKEN = <token>`
   - `CLOUDFLARE_ACCOUNT_ID = 2b33f66afd354338cb987943a3be1ec1`

## 3. Connect backend API Worker to GitHub Builds

The backend API Worker was created by Wrangler as `api-flashcards`. Connect it to
GitHub so Cloudflare deploys API changes automatically instead of relying on
manual `wrangler deploy` uploads.

Dashboard → Workers & Pages → `api-flashcards` → Settings → Build → edit:
- Repository: `troy-johnson/flashcards`
- Production branch: `main`
- Build command: `pnpm install --frozen-lockfile`
- Non-production branch deploy command:
  `pnpm --filter api exec wrangler versions upload --env preview`
- Production branch deploy command:
  `pnpm --filter api exec wrangler deploy --env production`
- Root directory: leave empty (monorepo)
- Environment variables:
  - `NODE_VERSION = 24`

## 4. Resend transactional email setup

Real magic-link email is behind the `AUTH_EMAIL_ISSUER` env var. Keep it as
`dev-log` until Resend is verified and the secret is in place.

1. Sign up / sign in at https://resend.com and add a verified domain
   (e.g. `mail.readersway.app`). Resend requires a domain you own; the
   `*.workers.dev` origin cannot be a sender identity.
2. Note the verified sender address, e.g.
   `Reader's Way <signin@mail.readersway.app>`.
3. In `api/wrangler.toml`, replace every placeholder `EMAIL_FROM` value with the
   verified address.
4. Set the Resend API key as a Cloudflare Worker secret for **each environment**
   that will send real email:
   - Default / local: `pnpm --filter api exec wrangler secret put RESEND_API_KEY`
   - Preview: `pnpm --filter api exec wrangler secret put RESEND_API_KEY --env preview`
   - Production: `pnpm --filter api exec wrangler secret put RESEND_API_KEY --env production`
5. Do **one** operational test send before flipping the issuer:
   - Temporarily set `AUTH_EMAIL_ISSUER = "resend"` in the target environment
     vars (e.g. `env.preview.vars`), commit, and deploy.
   - Request a magic link to the operator's email address and confirm delivery.
   - Revert to `AUTH_EMAIL_ISSUER = "dev-log"` after the test.
6. Only after the test send succeeds, leave `AUTH_EMAIL_ISSUER = "resend"` in
   the pilot/production environment. Keep `dev-log` out of public production
   except for deliberate internal testing windows.

## 5. Configure the production guardian allowlist

Production uses `AUTH_ACCESS_MODE = "allowlist"`. If its allowlist secret is absent
or empty, `/auth/start` returns without creating a guardian or auth token. Local and
preview remain `open` for internal development.

Before setting even the owner-household list, complete the Resend test-send procedure
and leave production configured with `AUTH_EMAIL_ISSUER = "resend"`, a valid
`RESEND_API_KEY`, and the verified `EMAIL_FROM`. Then set the production Worker
allowlist secret. Use normalized, comma-separated email addresses and never commit
the value:

```bash
pnpm --filter api exec wrangler secret put GUARDIAN_EMAIL_ALLOWLIST --env production
```

Before the first non-household guardian receives access:

1. Verify `literacy_prod`, the production Worker binding, and the rollback drill.
2. Confirm production is still using the verified Resend configuration.
3. Set the GitHub Actions variable `EXTERNAL_GUARDIAN_PILOT` to `true`.
4. Replace `GUARDIAN_EMAIL_ALLOWLIST` with the complete owner + invited-guardian
   list.
5. Confirm an unlisted address creates no guardian/auth-token rows and an invited
   address completes the intended magic-link flow.

Keep pilot access allowlisted; open public enrollment is outside `rw-bpb`.
In allowlist mode the API always returns an empty `204` for valid requests; it never
echoes a development magic link to the caller.

## 6. Configure the production operator designation

Production operator access is fail-closed and uses a Cloudflare Worker secret.
Enter the designated guardian email interactively; never place the value in a
command, committed file, documentation, fixture, log, screenshot, or review output:

```bash
pnpm --filter api exec wrangler versions upload --env production --message "Stage operator secret update"
pnpm --filter api exec wrangler versions secret put DIAG_GUARDIAN_EMAIL --env production --message "Add production operator designation"
pnpm --filter api exec wrangler versions view <version-id> --env production --json
pnpm --filter api exec wrangler deployments status --env production --json
```

This Worker uses versioned deployments. Upload the reviewed code and production
configuration first; otherwise `versions secret put` can clone a stale uploaded
version with preview bindings. Use the version ID returned by the secret command for
the `versions view` check. The candidate must show the production D1 database,
allowlist mode, Resend issuer, verified sender, rate limiter, and the
`DIAG_GUARDIAN_EMAIL`, `GUARDIAN_EMAIL_ALLOWLIST`, and `RESEND_API_KEY` binding names.
Secret values are not returned. If any non-secret binding is wrong, never deploy that
version; upload the reviewed configuration again before retrying.

Both commands create undeployed versions. Confirm `deployments status` still points
100% of production traffic at the prior version. Deploying the candidate is a later,
separately authorized step. Never copy or expose a secret value while configuring or
verifying it.

## 7. Verify the production-D1 GitHub gate

The `production-d1` GitHub environment must exist and allow deployments only from
protected branches. This single-owner repository currently has no required reviewer;
the workflow compensates with the external-pilot variable, exact database
confirmation, remote UUID verification, and bookmark capture.

The repository variable must remain false before the external-guardian trigger:

```text
EXTERNAL_GUARDIAN_PILOT=false
```

After the workflow lands on `main`, verify in GitHub Settings → Environments →
`production-d1` that protected branches are enabled. Also verify the repository
Actions variable is still `false`; do not rely only on the checked-in workflow text.

## Current naming

- Frontend Worker name: `flashcards`.
- Backend API Worker name: `api-flashcards` (`api-flashcards-preview` for preview env deploys).
- Preview uses D1 UUID `e3884eb3-fb85-4b29-9940-9c241bbc67ef`; the
  configured name is `literacy_preview`, while Cloudflare currently reports the
  remote resource name as `flashcards`.
- Production uses the distinct `literacy_prod` D1, UUID
  `e6b236d6-e3ae-4ff8-9a7e-4874c8419c96`.
- Production migration and recovery procedure:
  [D1 Production Migrations and Recovery](d1-production-migrations.md).

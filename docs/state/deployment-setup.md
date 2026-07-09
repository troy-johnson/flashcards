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

## Current naming

- Frontend Worker name: `flashcards`.
- Backend API Worker name: `api-flashcards` (`api-flashcards-preview` for preview env deploys).
- Production and preview share the `literacy_preview` D1. Split before real users exist; add `[[env.production.d1_databases]]` pointing at a new `literacy_prod` DB and run migrations against it.

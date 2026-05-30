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

## Current naming

- Frontend Worker name: `flashcards`.
- Backend API Worker name: `api-flashcards` (`api-flashcards-preview` for preview env deploys).
- Production and preview share the `literacy_preview` D1. Split before real users exist; add `[[env.production.d1_databases]]` pointing at a new `literacy_prod` DB and run migrations against it.

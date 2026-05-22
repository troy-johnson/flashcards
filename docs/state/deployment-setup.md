# Deployment Setup — Pending User Actions

These steps must be completed once in the Cloudflare and GitHub dashboards to make the new deploy pipeline work. Code changes are already on this branch.

## 1. Connect Pages project to GitHub

Project `literacy-app-preview` exists but has no source.

1. Dashboard → Workers & Pages → `literacy-app-preview` → Settings → Builds & deployments → Connect to Git.
2. Pick `troy-johnson/flashcards`, production branch `main`.
3. Build settings:
   - Build command: `pnpm install --frozen-lockfile && pnpm --filter app build`
   - Build output directory: `app/dist`
   - Root directory: leave empty (monorepo)
4. Environment variables (Production + Preview):
   - `VITE_API_ORIGIN = https://flashcards.troyjohnson.workers.dev`
   - `NODE_VERSION = 24`

Production deploys land at `https://literacy-app-preview.pages.dev/`; PR previews at `https://<commit>.literacy-app-preview.pages.dev/`.

## 2. Add CLOUDFLARE_API_TOKEN secret to GitHub

The new `migrate` job in `.github/workflows/ci.yml` needs API access on push-to-main.

1. https://dash.cloudflare.com/profile/api-tokens → Create Token → "Edit Cloudflare Workers" template (or custom: Account → D1: Edit + Workers Scripts: Edit, scoped to your account).
2. GitHub → Settings → Secrets and variables → Actions → New repository secret:
   - `CLOUDFLARE_API_TOKEN = <token>`
   - `CLOUDFLARE_ACCOUNT_ID = 2b33f66afd354338cb987943a3be1ec1`

## 3. Update Workers Build deploy commands

Workers Builds currently deploys with `--env preview` regardless of branch. Switch to per-branch envs.

Dashboard → Workers & Pages → `flashcards` → Settings → Build → edit:
- Non-production branch deploy command:
  `pnpm --filter api exec wrangler versions upload --env preview`
- Production branch deploy command:
  `pnpm --filter api exec wrangler deploy --env production`

## Known mismatches (defer)

- The deployed Worker is named `flashcards` in the dashboard but `literacy-api` in `wrangler.toml`. Renaming would change the public URL — leave alone until v1 launch.
- Production and preview share the `literacy_preview` D1. Split before real users exist; add `[[env.production.d1_databases]]` pointing at a new `literacy_prod` DB and run migrations against it.

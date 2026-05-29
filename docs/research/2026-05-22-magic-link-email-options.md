# Magic-link email options — low-cost pilot path

Date: 2026-05-22

## Problem

The deployed Flashcards auth flow creates valid magic links but uses `AUTH_EMAIL_ISSUER=dev-log`, so links are written to Cloudflare Worker logs instead of being emailed. This blocks real guardian sign-in outside internal smoke testing.

The product constraint is to avoid fixed monthly operating cost until the app has users and evidence of demand, while still providing a usable and trustworthy pilot auth flow.

## Options considered

### Option 1 — Keep `dev-log`

Cost is effectively zero and it is useful for local development, but it requires operator access to Worker logs and cannot support real users. It remains a development mode only.

### Option 2 — Cloudflare Email Routing / Email Workers

Cloudflare's email features are attractive because the app already runs on Cloudflare, but Email Routing is primarily for receiving and forwarding mail rather than acting as a general transactional sender for magic links. This does not look like the right primary tool for auth delivery.

### Option 3 — Resend free tier

Resend is a transactional email provider with a straightforward API and a free/low-cost entry point. It requires sender/domain setup and an API key, but it gives a real user-facing magic-link path without committing to fixed monthly spend at pilot scale.

### Option 4 — MailChannels-style Worker sending

This may be cheap, but the support and policy story is less predictable than a transactional email provider. Because auth email is critical, this is less attractive as the first real sender.

## Recommendation

Adopt a provider-pluggable issuer model and implement Resend as the first real provider:

```text
AUTH_EMAIL_ISSUER=dev-log | resend
```

Use `dev-log` for local/internal testing and `resend` for pilot/production once the Cloudflare secret and sender identity are configured.

## Assumptions

- Pilot email volume will remain low enough for a free or very low-cost transactional email tier.
- The project can verify a sender/domain before inviting real users.
- Magic-link auth remains the desired guardian sign-in flow for the near term.

## Open questions

- Which sender address/domain should be used for pilot emails?
- Should broad public access wait until magic-link rate limiting is implemented?
- What threshold of users or monthly sends should trigger a pricing/provider review?

## Decision record

Captured as [ADR 001: Low-cost transactional email for magic-link auth](../adrs/001-low-cost-transactional-email.md).

# ADR 001: Low-cost transactional email for magic-link auth

## Status

Accepted — 2026-05-22

## Context

Flashcards uses magic-link guardian authentication. The deployed API currently has `AUTH_EMAIL_ISSUER=dev-log`, which creates valid auth tokens and logs magic-link URLs in Cloudflare Worker logs, but does not deliver email to guardians. This is sufficient for internal smoke testing and confirms the auth/session flow works, but it is not usable for pilot users.

The app should avoid fixed operating costs before it has users and evidence of audience demand. At the same time, magic-link email is auth-critical: pilot users need reliable delivery, and the implementation should not lock the project into a costly or brittle provider.

Options considered:

- Keep `dev-log` only and manually retrieve links from Worker logs.
- Use Cloudflare Email Routing / Email Workers.
- Use a transactional email provider with a free tier, starting with Resend.
- Use MailChannels-style direct sending from Workers.

## Decision

Use a provider-pluggable email issuer model:

```text
AUTH_EMAIL_ISSUER=dev-log | resend
```

- Keep `dev-log` for local development and internal smoke tests.
- Add `resend` as the first real transactional sender for preview/pilot use.
- Store the Resend API key as a Cloudflare Worker secret.
- Configure sender identity explicitly with an environment variable such as `EMAIL_FROM`.
- Keep the public auth API independent of the concrete email provider so another provider can replace Resend later without changing guardian auth flows.

## Consequences

Positive:

- No fixed monthly email cost at pilot scale if usage stays within the provider's free tier.
- Real users can receive magic links without operator access to Worker logs.
- The code keeps a low-friction local mode via `dev-log`.
- Provider abstraction reduces migration cost if pricing, deliverability, or policy changes later.

Negative:

- Adds one external dependency for production auth.
- Requires domain/sender verification and secret management before real email works.
- A non-2xx provider response must be treated as sign-in failure, so email provider outages can affect auth.

Guardrails:

- Rate-limit magic-link creation before opening broad public access.
- Keep token TTL short; current TTL is 15 minutes.
- Monitor send counts during pilot to detect abuse or unexpected cost growth.
- Keep `dev-log` disabled for public production use except deliberate internal testing windows.

## Follow-up implementation notes

- Extend `api/src/email/magic-link.ts` to support `resend`.
- Add environment typings for `RESEND_API_KEY` and `EMAIL_FROM`.
- Add unit tests for `dev-log`, successful Resend send, and Resend failure.
- Configure Cloudflare secret for `api-flashcards` before switching production `AUTH_EMAIL_ISSUER` to `resend`.

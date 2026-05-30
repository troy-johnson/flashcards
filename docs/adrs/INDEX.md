# Architecture Decision Records

| ADR | Title | Status | Date | Summary |
| --- | --- | --- | --- | --- |
| 001 | [Low-cost transactional email for magic-link auth](001-low-cost-transactional-email.md) | accepted | 2026-05-22 | Keep `dev-log` for local/internal testing, add a provider-pluggable transactional email path, and use Resend as the first real sender for pilot magic links to avoid fixed monthly cost while preserving migration flexibility. |

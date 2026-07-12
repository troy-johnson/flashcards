# Architecture Decision Records

| ADR | Title | Status | Date | Summary |
| --- | --- | --- | --- | --- |
| 003 | [Server-authoritative guardian capabilities](003-server-authoritative-guardian-capabilities.md) | accepted | 2026-07-11 | Add a server-computed `operator_tools` capability to `/auth/me` for navigation visibility while preserving independent route authorization and avoiding a general role system. |
| 002 | [Phase A audio strategy](002-phase-a-audio-strategy.md) | accepted (revised 2026-06-21) | 2026-06-06 | 44 UFLI-aligned recorded instructional sound targets + 12 validated grapheme mappings, whole-item TTS, gesture playback, deterministic manifests, checksum-bound review, and target-device QA. |
| 001 | [Low-cost transactional email for magic-link auth](001-low-cost-transactional-email.md) | accepted | 2026-05-22 | Keep `dev-log` for local/internal testing, add a provider-pluggable transactional email path, and use Resend as the first real sender for pilot magic links to avoid fixed monthly cost while preserving migration flexibility. |

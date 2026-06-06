# Architecture Decision Records

| ADR | Title | Status | Date | Summary |
| --- | --- | --- | --- | --- |
| 002 | [Phase A audio strategy](002-phase-a-audio-strategy.md) | accepted | 2026-06-06 | Real pre-produced audio for the 44 phonemes + digraphs (record/license) with TTS fallback for words/sentences and gesture-initiated playback; QA on iPadOS Safari + desktop/mobile Chrome/Safari. Addresses the highest Phase A implementation risk. |
| 001 | [Low-cost transactional email for magic-link auth](001-low-cost-transactional-email.md) | accepted | 2026-05-22 | Keep `dev-log` for local/internal testing, add a provider-pluggable transactional email path, and use Resend as the first real sender for pilot magic links to avoid fixed monthly cost while preserving migration flexibility. |

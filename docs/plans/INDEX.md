# Plans Index

Implementation plans paired with specs. Numbered as `<spec#><letter>` (e.g., `001a`, `001b`) so a single spec can decompose into multiple shippable plans.

| # | Slug | Status | Date | Summary |
|---|------|--------|------|---------|
| 008a | [family-safe-guardian-progress](008a-family-safe-guardian-progress.md) | approved with nits (adversarial round 2) | 2026-07-26 | Guardian-owned progress API, canonical skill names and explanations, accessible disclosures, responsive mobile layout, and unchanged operator diagnostics boundary. Bead `rw-ir1.1`; parallel with 007a. |
| 007a | [k-u1-heart-word-classification](007a-k-u1-heart-word-classification.md) | approved with nits (adversarial round 1) | 2026-07-26 | Reclassify “as” as a temporary K Unit 1 heart word through deprecate-and-replace, preserve the 200-word decodable bar with “Sam,” and audit neighboring content. Bead `rw-1gz.8.7`; parallel with 008a. |
| 006a | [caregiver-ready-phonemic-awareness](006a-caregiver-ready-phonemic-awareness.md) | approved (adversarial round 2) | 2026-07-11 | Validated caregiver script/child task contract, scheduler/API propagation, canonical and legacy PA rendering, viewport evidence, and separate family/educator instructional review gates. Bead `rw-gmi`; Wave 2 parallel with 004a. |
| 005a | [production-operator-capabilities](005a-production-operator-capabilities.md) | approved (adversarial round 2) | 2026-07-11 | Protected-path plan for one fail-closed operator policy, additive `/auth/me` capability, client entry-point filtering, production Worker secret, security review, and independent deployment verification. Bead `rw-r6r`; Wave 1. |
| 004a | [family-device-guardian-experience](004a-family-device-guardian-experience.md) | approved (adversarial round 2) | 2026-07-11 | Responsive branded guardian shell, accessible redirect confirmation, and safe client-only practice exit with exact cached-session semantics and device/VoiceOver QA. Beads `rw-arr`, `rw-cwm`, `rw-a92`; Wave 2 after 005a. |
| 002i | [phase-a-mastery-selection-drill-modes](002i-phase-a-mastery-selection-drill-modes.md) | drafted — ready to execute | 2026-07-04 | Family-wave gates `rw-ncu` + `rw-qjk`: planner selection layer per spec 001 §6 (active/review/missed buckets, due_at priority, interleaving — bookkeeping unchanged; full SM-2 deferred to `rw-5kd`) + mode-aware drill cards (kind/answer/heart parts through PlanCard; PA answer line, heart-part highlighting, fluency copy). |
| 003a | [audio-assets-playback](003a-audio-assets-playback.md) | drafted — ready to execute (Phase 0 first) | 2026-06-21 | Eleven-task plan for Spec 003 / bead `rw-1gz.8.2`: Phase 0 real-iPad TTS spike, schema-v2 TDD migration, canonical 44+12 inventory, deterministic manifest/staging, item `speech_text` propagation, protected catalog API + UI, gesture playback/TTS, codec spike, recording + checksum-bound SLP approval, CI/device QA. |
| 002h | [phase-a-ui-polish-a11y](002h-phase-a-ui-polish-a11y.md) | drafted — implement last | 2026-06-06 | Cross-cutting pilot polish + accessibility over all FR34 surfaces (FR33–36, AC16–17). a11y = jest-axe automated + manual contrast/reduced-motion/SR checklist; breakpoints 375/768/1280. Beads epic `rw-1gz.11` (blocked-on .9 + .10). |
| 002g | [phase-a-privacy-terms](002g-phase-a-privacy-terms.md) | drafted — ready to implement | 2026-06-06 | Basic plain-language Privacy + Terms pages + manual support contact route (FR27–29/37–39, AC14/18–19). LLM-drafted for owner review; contact via `mailto:` support email. Beads epic `rw-1gz.10`. |
| 002f | [phase-a-landing-page](002f-phase-a-landing-page.md) | drafted — ready to implement | 2026-06-06 | Public landing page (FR24–26, AC13): positioning, audience, privacy stance, pilot status, invite-only contact path (`mailto:`). Copy from the copy package. Beads epic `rw-1gz.9`. |
| 002e | [phase-a-content-bar](002e-phase-a-content-bar.md) | drafted — ready to implement | 2026-06-06 | Phased v1.0 content bar (FR16–18, AC11–12): K Units 1–2 first, 1st-grade Unit 1 follow-on. Adds a content manifest + validator count gate (binary AC11). Audio per ADR-002; LLM-assisted authoring for the pilot. Beads epic `rw-1gz.8`. |
| 002d | [phase-a-email-provider](002d-phase-a-email-provider.md) | drafted — ready to implement | 2026-06-06 | Add a `resend` transactional magic-link issuer behind the ADR-001 abstraction (FR19/22/23, AC3). Beads epic `rw-1gz.7`. |
| 002c | phase-a-scheduler-practice | **shipped** (PR #21, #23) | 2026-06-03 | Scheduler/practice replacing the hardcoded stub: grade-aware K start, 1st-grade review advancement, mastery updates, and the 1st-grade review-exhausted terminal reason at the start route. |
| 002b | phase-a-telemetry | **shipped** (PR #19) | 2026-05-30 | Complete-session endpoint and gated diagnostic telemetry report for sessions, completion, duration, and friction items. |
| 002a | phase-a-copy-package | **shipped** (PR #22) | 2026-05-30 | Shared `packages/copy` workspace module for Reader's Way brand/UI chrome used by app and magic-link email. |
| 001a | literacy-app-v1 | shipped | 2026-05-17 | First previewable foundation slice with per-task payloads for workspace scripts, Wrangler/D1, content validation, magic-link auth, guardian-tap API/app loop, mandatory PR gates, telemetry, and replay scaffold. |

## Spec 002 roadmap — every workstream now has a plan

All Phase A workstreams are planned. Shipped: 002a/b/c. Drafted, ready to implement: 002d–002h.

| Beads | Workstream | Plan | Spec coverage | Status |
|---|---|---|---|---|
| rw-1gz.7 | Transactional email provider (Resend) | 002d | FR19/22/23, AC3 | drafted |
| rw-1gz.8 | v1.0 content bar | 002e + [003a](003a-audio-assets-playback.md) (ADR-002) | FR16–18, AC11–12 | drafted (phased; full AC11/AC7 only after Phase 2 = 1st-grade U1). Audio subsystem (rw-1gz.8.2) designed in Spec 003 / plan 003a. |
| rw-1gz.9 | Public landing page | 002f | FR24–26, AC13 | drafted |
| rw-1gz.10 | Privacy Policy & Terms + contact | 002g | FR27–29/37–39, AC14/18–19 | drafted |
| rw-1gz.11 | Pilot UI polish & accessibility | 002h | FR33–36, AC16–17 | drafted (do last, after .9+.10) |

**Recommended implementation order:** 002d (email) + 002e (content) in parallel → **002g (privacy/terms) before/with 002f (landing)** (so the landing footer's `/privacy` `/terms` links resolve, and `support.email` exists) → 002h (polish, last). Pilot for 1st-grade students is gated on 002e Phase 2. Later-phase items (spec OQ1–6) remain intentionally unplanned.

> Pilot rollout runs as two waves (family `rw-odv`, educator `rw-1ge`), decided 2026-07-03 — gates and journey/bead traceability in [docs/design/user-journeys.md](../design/user-journeys.md).

> All five drafted plans (002d–002h) + ADR-002 passed an independent Sonnet adversarial review on 2026-06-07 (`.agents/snapshots/plans-002d-h-adversarial-review-2026-06-07.md`); revisions are folded into each plan's "Review revisions" section.

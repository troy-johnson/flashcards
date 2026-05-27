# Workflow State

**Active Phase:** Roadmap brainstorming — Phase A scope lock in progress
**Active Branch:** docs/email-auth-spec (note: working tree has uncommitted work from chore/prod-env-and-migrate-ci era — UI polish, dev-link echo, walkthrough script)
**Active Artifacts:** docs/specs/001-literacy-app-v1-design.md; docs/plans/001a-literacy-app-v1.md; docs/design/walkthrough/2026-05-26T22-39-16/ (12 mobile + 12 desktop screenshots, flow.webm)
**Current Gate:** Brainstorming roadmap before any further implementation
**Next Action:** Pair business plan + name workstreams (positioning → pricing/packaging → derive a name from that), then draft remaining Phase A workstreams (email, UI polish, onboarding, telemetry, privacy/ToS) as a spec for review rather than continuing multiple-choice scoping.

---

## Roadmap shape (agreed)

Three phases with B2B groundwork **pulled into Phase A** (not deferred to Phase C).

- **Phase A — Pilot-ready** (5–20 invited families). Includes role-model + accessibility groundwork so Phase C is cheap later.
- **Phase B — Public-ready** (anyone can sign up; B2C subscription).
- **Phase C — B2B-ready** (school / district licensing).

Definition of "finished" for the current push: **Phase A, with the intent to push toward Phase B and then Phase C.** Business model includes both family subscription and school/district licensing.

---

## Phase A — decisions locked

1. **Role model:** many-to-many `guardian_student` edge with role column. Phase A only inserts `role=guardian` edges. Phase C adds `teacher` (and possibly `co-parent`, `admin`). Co-parents (two parents on one student) work today via two edges. One migration. Classroom-as-aggregate stays deferred until Phase C — a "classroom" is just the set of students a teacher edge points at.

2. **Accessibility target:** **WCAG 2.1 AA as we build + formal audit at end of Phase A.** Apply during UI polish (semantic HTML, focus styles, keyboard ops on the drill card, aria-live for status messages, contrast already handled by the OKLCH palette). Audit at end = axe + keyboard walkthrough + screen-reader pass; estimate ~1 day.

3. **Content scope:** **Hold the spec's v1.0 content bar.** No vocab in v1.0 (vocab + comprehension stay deferred to v2.0 per the existing spec). Floor:
   - Phonics scope/sequence: full K Unit 1 + Unit 2 + 1st Unit 1 (~12 skills with prerequisites wired)
   - Heart words: ~50 entries tagged with `regular_parts` / `irregular_parts`
   - Decodable words: ~200 entries, skill-tagged
   - Fluency sentences: ~30 short decodable sentences spanning K + 1-U1 skills
   - Audio: all 44 phonemes + common digraphs (sh, ch, th, wh, ck, ng, qu, ll, ss, ff, zz, ph). TTS fallback for words/sentences (recorded audio is v1.5).

4. **Content authoring approach:** **Hybrid.** UFLI (University of Florida Literacy Institute) scope/sequence + word lists as scaffold; LLM gap-fill for fluency sentences and missing items; every item validated programmatically through `scripts/content-validate.ts` against phoneme/grapheme rules.

---

## Phase A — workstreams still to scope

These are the remaining Phase A workstreams. Next-model action: **pair (1) and (5) in one round** (positioning drives the name), then **draft (2), (3), (4), (6), (7) as a spec the user redlines** rather than running another Q&A round per workstream.

1. **Name + minimal brand.** Constraints to gather: existing owned domains? Trademark sensitivities vs literacy products (Lexia, IXL, Hooked on Phonics, etc.)? Positioning angle (parent-facing warm vs school-procurement-credible vs both)? Output: a name, a wordmark, a one-line positioning statement, an email sender identity. *Recommendation:* derive from positioning rather than picking in a vacuum.

2. **Real magic-link email.** ADR `001-low-cost-transactional-email.md` exists — re-read first; choice is essentially Resend free tier vs MailChannels via Workers. Today the issuer is `dev-log` (echoes the URL to the UI in dev). Production env vars already set in `api/wrangler.toml`. Wire the real issuer and remove the dev echo in non-dev environments.

3. **UI polish (Claude Design pass 2).** Use the walkthrough captured at `docs/design/walkthrough/2026-05-26T22-39-16/` as input to a Claude Design iteration prompt. Mobile screens that especially need work: sign-in (sparse), guardian dashboard (empty top half, weak hierarchy), add-student (compressed), student dashboard (Start practice vs Settings competing), play-start (almost empty), play-done (minimal celebration). Drill card is closest to done but missing the heart-word/skill-mode indicator from Claude Design Pass 1.

4. **Guardian onboarding flow.** Currently `/signin` → `/guardian` drops the new user into an empty dashboard. Needs a real first-run sequence: explain co-engagement model, set first student, set daily time of day, pick a starting skill (or default), do one drill so guardian sees the loop. Decide: progressive disclosure vs one wizard.

5. **Business plan.** Pricing tiers (family monthly/annual vs district per-seat), positioning, who pays what, free-trial mechanics, what the pilot needs to validate (engagement, learning outcome, willingness to pay). Output: a one-page business plan that informs the name + the marketing copy + what telemetry has to measure.

6. **Telemetry baseline.** Already a plan section ("Minimal telemetry baseline before scheduler tuning"). Needs concretization for pilot: did families use it daily? How long per session? Skill mastery curves? Drop-off points? Build on the `attempt` table that already exists.

7. **Privacy policy + ToS.** Even for an invited pilot — the entire user base is under 13, which triggers COPPA. Need verifiable parental consent flow, data-retention policy, right-to-delete. Cheaper to template from a known-good source (Common Sense Privacy template, or a literacy-product peer's policy as a starting reference) than to write from scratch.

---

## Cross-cutting / parking lot

- **Phase B (Public-ready) workstreams:** Stripe family subscription, marketing site, content depth pass 2 (1st U2/U3, fluency passages), account management (password reset, email change, COPPA right-to-delete), support inbox/help docs, production-grade ops (alerting, error tracking, backups).
- **Phase C (B2B-ready) workstreams:** Roster import (CSV first, then Clever/ClassLink), admin/teacher dashboards, DPA template + signed-agreement workflow, SSO (Google for Education first), invoicing/PO billing, classroom-aggregate UI.
- **Compliance gotchas for Phase C:** COPPA, FERPA, state laws (NY Ed Law 2-d, CA SOPIPA, IL SOPPA, etc.). Districts request signed DPAs before piloting.
- **Architectural decisions still implicit:** content lives as JSON in repo for v1.0; migrates to D1 in v1.2 per spec. Don't optimize for that move now.

---

## Reference pointers

- Spec: `docs/specs/001-literacy-app-v1-design.md` (v1.0 content bar at §1, "v1.0 shippable content bar")
- Plan 001a (foundation, shipped): `docs/plans/001a-literacy-app-v1.md`
- ADR for email: `docs/adrs/001-low-cost-transactional-email.md`
- Walkthrough captures: `docs/design/walkthrough/2026-05-26T22-39-16/` (mobile/, desktop/, flow.webm)
- Walkthrough script: `scripts/walkthrough.mjs` (run after `pnpm dev` from repo root)
- Claude Design Pass 1 (the chosen direction we extracted tokens + Lexend from): `docs/design/claude-design-pass1/`
- Research grounding: `docs/research/2026-05-22-ui-engagement-research.md`

---

> This file is a current pointer, not a full session log.

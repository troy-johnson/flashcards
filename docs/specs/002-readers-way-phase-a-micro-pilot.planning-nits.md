# Planning Decisions: Spec 002 Phase A Carried-Forward Nits

**Spec:** [002-readers-way-phase-a-micro-pilot.md](002-readers-way-phase-a-micro-pilot.md)
**Review packet:** [002-readers-way-phase-a-micro-pilot.adversarial-review.md](002-readers-way-phase-a-micro-pilot.adversarial-review.md)
**Date:** 2026-05-30
**Owner:** Troy Johnson
**Status:** decisions agreed; unblocks spec sign-off (not yet an implementation plan)

## Purpose

The adversarial review approved Spec 002 **with nits** and carried three planning-level
follow-ups forward. This doc resolves each into a concrete, agreed decision so the spec
can be signed off and later turned into an implementation plan. It is **decision-level**:
it names file surfaces, thresholds, and storage/reporting mechanisms; it does **not**
design the full scheduler/practice build.

Codebase state at time of writing (relevant because two of the three nits are greenfield):

- No product-name or copy module exists anywhere in `app/src`; `grep` for the product
  name / `productName` returns nothing. `app/src/tokens.css` is CSS color tokens only.
- The practice scheduler does not exist yet. `api/src/routes/practice.ts` builds the plan
  as a hardcoded stub (`seedCards` filtered to one skill, `phonics_k_u1_short_a`). The
  `skill_mastery` / `item_mastery` tables (level 0–4, streak, ease, due_at) and
  `content/scheduler-config.json` exist but are not wired in.
- Telemetry is the most built-out: `practice_session` (`started_at` / `completed_at`) and
  `attempt` (`result`, `duration_ms`, `scored_at`) tables exist. `completed_at` is never
  written (no complete-session endpoint). `api/src/routes/diag.ts` is a gated admin
  endpoint already returning aggregated attempt summaries.

---

## Nit 1 — Centralized copy/token file surface (review finding 2; FR1–FR3, G2, D2, AC2)

**Decision:** Add a shared workspace package **`packages/copy`** — a typed TypeScript
module that is the single source of truth for brand/UI copy, imported by both `app`
(UI + landing) and `api` (magic-link email).

Implementation outline:

- Add `packages/copy` to `pnpm-workspace.yaml` (currently only `app`, `api`).
- Export typed constants for the FR1 set: `productName` (`"Reader's Way"`), short product
  display text, landing headline/subtitle, onboarding headline/subtitle, magic-link email
  subject + body product references, privacy/contact support display name.
- `app` references these in UI and landing; `api/src/email/magic-link.ts` references them
  in the email. No hard-coded product strings scattered across components (FR2).
- A future rename = edit one file, type-checked across both packages (FR3, AC2).

**Scope boundary (important):** this surface is **brand/UI chrome only**. Instructional
content — phonics skills, heart words, decodable words, fluency sentences, audio, scope &
sequence — stays in `content/` as validated data governed by FR16–FR17 and the
content-validation script. FR3/AC2 require a rename to touch *only* brand chrome and never
instructional content data, so the two must not be conflated.

**Why not the database (considered and rejected):** DB-backed brand copy would add a
runtime failure mode to static chrome (the landing page and the email worker would each
need a D1 round-trip just to render the product name), defeat edge-caching the landing
page, and buy nothing in Phase A — there is no non-engineer editor and no live A/B need; a
rename is a deliberate post-trademark deploy event (OQ1). The database's job is per-user /
over-time data (mastery, sessions), not a brand string. A shared package delivers the
same single-source-of-truth in code without those costs. (Instructional word lists, by
contrast, are legitimately content-file/DB-shaped data — but that is a separate concern
from this nit.)

---

## Nit 2 — Deterministic 1st-Grade review advancement rule (review finding 3; FR9–FR10, D6, AC7)

**Decision:** A 1st grader's brief K review path advances per-skill on a research-grounded,
deterministic criterion that mirrors UFLI's mastery heuristic and uses the latency signal
the `attempt` table already records.

Rule:

> Per K review skill, over a minimum sample of **M = 4** scored attempts of that skill:
> mark the skill **review-passed** (skip its remaining review items) when **accuracy ≥ 90%**.
> Record an **automaticity** signal in parallel — the share of correct attempts with
> `duration_ms ≤ 2000` ("automatic," per UFLI's A/C/I scoring). Any skill that misses the
> 90% accuracy bar drops into the normal active-practice mix. The review path ends once
> every K review skill is either review-passed or pulled into active practice.

Research basis:

- Structured-literacy / Orton-Gillingham mastery ≈ **90% accuracy** plus automaticity
  ([The Literacy Nest](https://www.theliteracynest.com/2020/11/checking-for-mastery-in-orton-gillingham-lessons.html),
  [Phonics Hero](https://phonicshero.com/mastery_phonics/)).
- UFLI advances when **≥80% is automatic** (correct within ~2 s), else reteach
  ([UFLI Foundations](https://ufli.education.ufl.edu/foundations/)).

**Phase A gating caveat (deliberate):** scoring is `guardian_tap`, so `duration_ms`
includes the adult's tap-reaction latency. Phase A therefore **gates on the 90% accuracy
criterion only** and **records the automaticity signal without hard-gating on it**, until
real latency distributions are observed. Once we have that data, tighten toward the full
UFLI gate (e.g. accuracy ≥ 90% AND ≥ 80% automatic). This keeps the rule deterministic and
defensible now with a clear path to the stronger criterion.

Depends on: the real scheduler (not built yet) reading `skill_mastery` and applying this
rule when assembling a 1st-grade plan. That build is out of scope for this decision doc.

---

## Nit 3 — Telemetry storage / reporting mechanism (review finding 4; FR30–FR32, D11)

**Decision:** Reuse existing tables for storage; extend the existing gated `diag` endpoint
for reporting. No new analytics platform (matches D11, FR31).

- **Storage:** keep `practice_session` (`started_at` / `completed_at`) and `attempt`
  (`result`, `duration_ms`, `scored_at`). Add a **complete-session endpoint** that writes
  `completed_at` — currently never set, which blocks any completion metric.
- **Reporting:** grow `api/src/routes/diag.ts` (already gated by `DIAG_GUARDIAN_EMAIL`)
  into a small read-only telemetry report: sessions started / completed, completion %,
  average (or approximate) session duration, and top friction items (highest
  incorrect/skipped counts). Returns JSON; no admin UI added to Phase A scope.
- These three reads answer FR32's core questions: are families using it, where do they get
  stuck, is practice progressing. Granular clickstream tracking remains excluded (FR31).

---

## Resolution summary

| Nit | Decision | Primary surface |
| --- | --- | --- |
| 1. Copy surface | Shared `packages/copy` TS module (brand chrome only; not word lists; not DB) | `packages/copy`, `pnpm-workspace.yaml`, `api/src/email/magic-link.ts` |
| 2. Advancement rule | Per-skill: accuracy ≥ 90% over ≥ 4 attempts gates; automaticity (`duration_ms ≤ 2000`) recorded, not yet gated | future scheduler reading `skill_mastery` |
| 3. Telemetry | Reuse `practice_session` / `attempt`; add complete-session endpoint; extend `diag` report | `api/src/routes/practice.ts`, `api/src/routes/diag.ts` |

All three review nits are resolved at the decision level. None change the approved product
scope. Next step (separate, when ready): turn these decisions into an implementation plan
alongside the scheduler/practice build.

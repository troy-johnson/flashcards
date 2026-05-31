# Adversarial Review Packet: Spec 002 Reader's Way Phase A Micro-Pilot

**Spec:** [002-readers-way-phase-a-micro-pilot.md](002-readers-way-phase-a-micro-pilot.md)
**Review rounds:** 1 (2026-05-27), 2 (2026-05-30), 3 (2026-05-31)
**Verdict:** APPROVED WITH NITS

## Review Focus

This review stress-tests the Phase A spec for ambiguity, scope creep, missing acceptance criteria, and conflicts with the existing literacy app direction.

## Findings

### 1. Scope is broad but internally consistent

The spec includes brand, onboarding, content, email, privacy, landing page, telemetry, UI polish, and manual support. That is a large surface for a micro-pilot, but the breadth is justified because the pilot uses real child accounts and aims to validate an authentic home routine.

**Disposition:** Accept. Carry the breadth into planning as separate workstreams rather than trimming the spec.

### 2. Centralized copy is required but file surface is not yet defined

The spec correctly requires product/brand copy to be centralized for future rename flexibility. It does not prescribe the exact implementation surface, such as a TypeScript constants module, design-token file, JSON copy catalog, CSS tokens, or email-template constants.

**Disposition:** Nit. Resolve during planning by identifying the exact files/modules responsible for app, email, and landing copy.

### 3. "Advances quickly" needs implementation thresholds

The spec intentionally chooses a brief 1st Grade review path that advances quickly when the child succeeds. This is product-correct but needs deterministic scheduling criteria before implementation.

**Disposition:** Nit. Planning must define the rule, such as number of review activities, performance threshold, or existing scheduler mastery signal.

### 4. Telemetry destination/reporting is unspecified

The spec identifies what should be tracked and what should not be tracked, but does not identify whether the data is stored in existing session tables, new summary fields, logs, or an admin/reporting view.

**Disposition:** Nit. Planning must identify the storage/reporting mechanism and avoid adding a large analytics platform.

### 5. Manual admin support is appropriate for the trust boundary

Manual support is acceptable because the participants are the creator's family and a few known educators/families. The spec correctly requires Privacy/Terms/contact copy to make this support route explicit.

**Disposition:** Accept.

### 6. Legal scope is pragmatic

Basic Privacy Policy and Terms are required, while DPA/procurement artifacts are deferred. This is appropriate for trusted family/educator pilot use and avoids overbuilding school-sales infrastructure too early.

**Disposition:** Accept.

## Review Round 2

**Date:** 2026-05-30
**Focus:** cross-reference integrity and internal consistency (doc-level correctness pass).
**Verdict:** APPROVED WITH NITS

### Verified clean

- Numbering is gap-free and contiguous: G1–G12, NG1–NG12, D1–D12, FR1–FR39, AC1–AC20, OQ1–OQ6.
- Internal pointers resolve: AC14 → FR28, AC16 → FR34, and §11's "three nits" matches the three Round 1 planning follow-ups.
- No contradictions across the goal/non-goal/decision/requirement/acceptance layers. Spot checks: NG2 (no self-serve deletion/recovery) is consistent with FR38 (deferred) and AC18 (manual contact route); the no-gamification rule is consistent across NG11, FR14, and AC10; magic-link email contents agree across D8, FR21, and AC4.

Round 1 findings 2–4 remain planning follow-ups; findings 1, 5, and 6 remain accepted.

### 7. ADR cross-reference resolved before landing

The spec links `../adrs/001-low-cost-transactional-email.md` (Related artifacts and FR22). During review, that file was present on `main` but absent from the branch because the branch had diverged before the ADR landed. The branch has since been updated from `main`, and the ADR link target now exists in-branch.

**Disposition:** Resolved. No spec text change required.

## Required Follow-Up During Planning

All three planning follow-ups are now resolved at the decision level in the
[planning-nits doc](002-readers-way-phase-a-micro-pilot.planning-nits.md):

1. Define centralized copy/token file surface. — **Resolved:** shared `packages/copy` TS
   module (brand chrome only; not word lists; not DB).
2. Define deterministic 1st Grade review advancement rule. — **Resolved:** per-skill
   accuracy ≥ 90% over ≥ 4 attempts gates; UFLI automaticity signal recorded, not yet gated.
3. Define telemetry storage/reporting mechanism. — **Resolved:** reuse existing tables +
   complete-session endpoint; extend the gated `diag` route into a JSON report.

## Review Round 3

**Date:** 2026-05-31
**Focus:** acceptance-criteria testability, coverage gaps between FRs and ACs, and unstated
implementation/legal risk. (Rounds 1–2 covered scope and doc-level consistency; this round
assumes those are sound and probes what they did not.)
**Verdict:** APPROVED WITH NITS

### 8. "Approximately" is not testable in an acceptance criterion (AC11; FR16)

AC11 inherits FR16's "approximately 12 phonics skills / ~50 heart words / ~200 decodable
words / ~30 fluency sentences." As a target in an FR this is fine; as an **acceptance
criterion** it cannot fail — any count satisfies "approximately." The acceptance layer
should be binary.

**Disposition:** Resolved. AC11 now requires the content set to match counts declared in the
Phase A content manifest, with AC12 carrying the validation-script gate. FR16 keeps
"approximately" as the design target.

### 9. FR36 commits to six accessibility behaviors; only two are gated (AC17)

FR36 targets semantic HTML, visible focus, keyboard access, WCAG 2.1 AA contrast,
reduced-motion awareness, and screen-reader status messaging for practice feedback. Only
keyboard-reachable + visible focus have an acceptance criterion (AC17); contrast (AA),
reduced-motion, and SR status messaging have none, and OQ6 defers the formal audit. The spec
therefore claims an AA target it does not verify in Phase A.

**Disposition:** Resolved. AC17 now gates keyboard/focus and requires the UI polish pass to
verify the WCAG 2.1 AA contrast target, reduced-motion behavior where animation exists, and
screen-reader-friendly practice status messaging where applicable.

### 10. No exit criteria for the pilot itself

The ACs verify the **build** is complete; §5 Success Priorities are qualitative ("routine
viability," "usability"). Nothing defines when Phase A has succeeded or when it ends.
Telemetry (FR30–FR32) gathers the signal, but no threshold is stated for reading it against.
The "summer-flexible, feedback-driven" framing (§5 Timing) makes a hard calendar gate
inappropriate — but a defined *start* with no defined *end* leaves "did this work?"
unanswerable.

**Disposition:** Resolved. §5 now defines soft exit markers distinct from build ACs: creator
family use across at least 10 completed sessions over at least two weeks, at least two
non-creator pilot households/educators completing at least four sessions each or providing
structured feedback after attempted use, and one operator review of telemetry/support notes.

### 11. Audio playback constraints are unaddressed — highest implementation risk

Phase A ships audio for 44 phonemes + digraphs plus TTS fallback (FR16), driven by a child
tapping on a tablet. iOS Safari blocks audio without a user gesture, autoplay policies vary
by browser, and TTS voice availability/quality differs across platforms. The spec names no
target devices/browsers anywhere and does not flag the gesture/autoplay constraint. For an
audio-centric K–1 product, this is the likeliest place the pilot breaks on real hardware.

**Disposition:** Resolved. FR16 now states target-device/browser assumptions for current
iPadOS Safari and current desktop/mobile Chrome/Safari, requires explicit user-gesture audio
initiation, and carries TTS quality/availability into planning or pilot-device QA.

### 12. Advanced-Kindergartener asymmetry is unstated

The fast-advance rule (D6; planning-nit #2) applies only to the 1st-grade review path. A K
student who is genuinely ahead has no escape: no placement (NG3), no level selection (NG4),
and no fast-advance within the K sequence itself. D5's consequences lean on "manual
adjustment," which for K means replaying the sequence or an operator hand-edit. This is a
defensible Phase-A call, but the asymmetry is invisible at FR8 ("start at the beginning").

**Disposition:** Resolved. FR8 now explicitly states that Phase A has no Kindergarten
fast-advance path and that advanced Kindergarten readers are handled through manual support /
adjustment in the trusted pilot context.

### 13. Child-privacy posture rests implicitly on the trust boundary

NG7 defers the FERPA/COPPA packet; onboarding routes through guardians (good) and ships
plain-language Privacy/Terms (D7, good). For a handful of known families this is reasonable.
But educator *families* are in scope — one step removed from the creator — and the spec
never explicitly states that it is **accepting** child-data legal exposure on the strength of
the trust boundary rather than satisfying a formal consent regime.

**Disposition:** Resolved. §12 now explicitly states that Phase A relies on a trusted-pilot
boundary for child-data risk, not a formal COPPA/FERPA consent or procurement regime, and
that broadening beyond known family/educator testers reopens NG7.

### Smaller notes (accept or fold into the above)

- **AC16 / FR35** — "sanity coverage" / "sanity checks" have no defined pass bar (manual?
  which viewports?). Acceptable for a pilot; name the breakpoints in planning.
- **Magic-link security** — single-use tokens and rate limiting are unmentioned; FR23 defers
  retries/observability. Likely covered by ADR-001 / Spec 001 — add a cross-reference to
  close the loop rather than respecify.
- **Multiple children per guardian** — implied by FR5/FR6 but never stated; an educator
  family may have both a K and a 1st grader. Confirm Spec 001's guardian/student model
  supports it.

### Round 3 disposition summary

All six findings (8–13) were nits, not blockers, and have now been folded into the spec as a
pre-implementation polish pass. None changed the approved product scope.

## Final Verdict

**APPROVED WITH NITS**

The spec is ready for owner review and implementation planning. Round 1 findings 2–4 are
resolved at the decision level in the [planning-nits doc](002-readers-way-phase-a-micro-pilot.planning-nits.md);
finding 7 was resolved by updating the branch from `main`. Round 3 adds six polish-level nits
(8–13) — testability of AC11, accessibility coverage in FR36, missing pilot exit criteria,
audio-playback assumptions, the advanced-K asymmetry, and an explicit child-privacy risk
acknowledgment. All have been resolved in the spec body as doc-edit / planning-level
clarifications. None block accepting the product scope.

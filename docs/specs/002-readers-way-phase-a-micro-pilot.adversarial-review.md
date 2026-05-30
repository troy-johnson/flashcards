# Adversarial Review Packet: Spec 002 Reader's Way Phase A Micro-Pilot

**Spec:** [002-readers-way-phase-a-micro-pilot.md](002-readers-way-phase-a-micro-pilot.md)
**Review rounds:** 1 (2026-05-27), 2 (2026-05-30)
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

### 7. Stale ADR cross-reference on the branch

The spec links `../adrs/001-low-cost-transactional-email.md` (Related artifacts and FR22). That file was added to `main` after this branch diverged, so it does not exist on the branch tree. After merge into `main` the link resolves correctly, but on the checked-out branch (and any branch-head rendering) the link is dead.

**Disposition:** Pre-landing nit. Rebase or merge `main` into the branch before landing so the ADR reference is valid in-branch as well as post-merge. No spec text change required.

## Required Follow-Up During Planning

1. Define centralized copy/token file surface.
2. Define deterministic 1st Grade review advancement rule.
3. Define telemetry storage/reporting mechanism.

## Final Verdict

**APPROVED WITH NITS**

The spec is ready for owner review and implementation planning. Findings 2–4 are planning-level details, and finding 7 is a pre-landing branch hygiene item; none block accepting the product scope.

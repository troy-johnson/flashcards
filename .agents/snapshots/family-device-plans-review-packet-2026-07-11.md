# Fresh-Context Adversarial Plan Review Packet

## Target

Review `.agents/snapshots/family-device-plans-draft-2026-07-11.md` as the proposed implementation packet for approved Specs 004–006.

## Profile

`plan` — high risk/high effort.

Required lenses: zero-context executability, dependency ordering, verification quality, and file-scope control.

Stop conditions: a non-executable slice, missing verification, ambiguous dependency, or forbidden-scope leak.

## Allowed evidence

- `.agents/snapshots/family-device-plans-draft-2026-07-11.md`
- `docs/specs/004-family-device-guardian-experience.md`
- `docs/specs/005-production-operator-capabilities.md`
- `docs/specs/006-caregiver-ready-phonemic-awareness.md`
- `docs/adrs/003-server-authoritative-guardian-capabilities.md`
- `docs/research/2026-07-11-family-device-qa-remediation-research.md`
- Source/test/config files explicitly named by the draft plan, only to verify current interfaces and feasibility
- Beads named by the draft, via `bd show`, only when required

Do not use parent-chat history, main-session narrative, unstated context, or model memory as evidence. Do not edit files.

## Reviewer roles

- Reviewer 1: zero-context execution, dependency ordering, and TDD slicing.
- Reviewer 2: verification quality, protected authorization/configuration path, accessibility/device gates, and scope control.

## Verdict schema

Return:

1. `VERDICT`: `APPROVED`, `APPROVED WITH NITS`, `BLOCKED`, or `NEEDS CLARIFICATION`.
2. `BLOCKERS`: numbered findings or `None`; include severity, plan/task, evidence, impact, and concrete remediation.
3. `NITS`: numbered findings or `None` with the same fields.
4. `DEPENDENCY CHECK`: ordering gaps or `Complete`.
5. `AC/VERIFICATION COVERAGE`: missing or non-deterministic evidence, or `Complete`.
6. `FILE-SCOPE CHECK`: missing/wrong/forbidden files, or `Complete`.
7. `SUMMARY`: concise disposition.

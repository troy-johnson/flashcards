# Fresh-Context Adversarial Spec Review Packet

## Target

Review these three approved product specs as one remediation packet:

- `docs/specs/004-family-device-guardian-experience.md`
- `docs/specs/005-production-operator-capabilities.md`
- `docs/specs/006-caregiver-ready-phonemic-awareness.md`

## Profile

`spec` — high risk/high effort.

Required lenses: goal/non-goal clarity, acceptance-criteria quality, decision coverage, and scope control.

Stop conditions: ambiguous acceptance criteria, a missing decision, a scope contradiction, or an unverifiable requirement.

## Evidence available to reviewers

Read only the following repository evidence as needed:

- the three target specs above;
- `docs/research/2026-07-11-family-device-qa-remediation-research.md`;
- `docs/research/2026-07-11-family-device-qa-remediation-brainstorm.md`;
- `docs/research/SOURCES.md` entries consumed by the research packet;
- `docs/adrs/003-server-authoritative-guardian-capabilities.md`;
- beads `rw-arr`, `rw-cwm`, `rw-r6r`, `rw-a92`, `rw-gmi`, and `rw-15y` via `bd show` if necessary;
- current source files cited by the research packet, strictly to verify feasibility or existing behavior.

Do not use parent-chat history, main-session narrative, unstated conversation context, or model memory as evidence.

## Review constraints

- Do not edit any repository file.
- Treat raw review output as evidence for the orchestrator, not a canonical update.
- Distinguish blockers from non-blocking nits.
- Cite the exact spec section and repository evidence for each finding.
- Do not reopen an explicitly documented product decision merely because another choice is possible; challenge it only when contradictory, unsafe, or unverifiable.

## Verdict schema

Return:

1. `VERDICT`: `APPROVED`, `APPROVED WITH NITS`, `BLOCKED`, or `NEEDS CLARIFICATION`.
2. `BLOCKERS`: numbered findings, or `None`. Each includes severity, spec/section, evidence, impact, and concrete remediation.
3. `NITS`: numbered findings, or `None`, using the same fields.
4. `CROSS-SPEC CHECK`: contradictions, missing dependencies, or `None`.
5. `AC COVERAGE`: requirements that lack a deterministic acceptance criterion or verification method, or `Complete`.
6. `SUMMARY`: concise disposition.

# Family-Device Specs Adversarial Review — Round 2

**Target:** Specs 004, 005, and 006 after round-1 remediation
**Profile:** `spec`
**Date:** 2026-07-11
**Final verdict:** **BLOCKED**

## Review execution

Two independent fresh-context reviewers used `openai/gpt-5.5` through the verified OpenCode subscription transport. Each received the original review packet, round-1 evidence, and current artifacts.

- Reviewer 1, requirement completeness and scope control: **APPROVED**, no blockers or nits.
- Reviewer 2, acceptance-testability, accessibility, security, and cross-spec boundaries: **BLOCKED**, two blockers and no nits.

Per the disagreement policy, the blocking verdict controls because both findings are supported by direct spec evidence.

## Round-1 resolution

Both reviewers agreed the round-1 findings were materially resolved: post-create focus, menu/AT outcomes, exit state semantics, caregiver-readability rubric, operator-config boundaries, and concrete viewport coverage.

## Accepted round-2 blockers

1. **Spec 004 does not make exit-control presence and target size failable.** Required behavior says every active practice screen has a 44 × 44 CSS-pixel control, but the acceptance criteria and verification do not enumerate practice start and active drill/current-card surfaces.
2. **Spec 006 does not define auditable SLP review evidence.** The educator-pilot gate needs a stored reviewer identity/role, date, wording/content revision, reviewed scope, and pass/fail result analogous to the family review artifact.

## Rejected findings

None.

## Cross-spec synthesis

No contradiction or missing dependency was found.

## Next action

Return both omissions to the spec-owning workflow. The standard two substantive rounds are exhausted; an additional fresh-context confirmation review requires user-approved escalation under the adversarial-review skill.

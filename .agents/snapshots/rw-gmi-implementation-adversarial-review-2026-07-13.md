# rw-gmi implementation adversarial review — 2026-07-13

## Target

Current uncommitted implementation on `plan/rw-gmi-guardian-pa-directions`, reviewed against:

- `docs/specs/006-caregiver-ready-phonemic-awareness.md`
- `docs/plans/006a-caregiver-ready-phonemic-awareness.md`

Review scope was the rw-gmi content validator, scheduler/API propagation, PA card rendering, tests, and CSS. `.beads/issues.jsonl` was excluded from code findings.

## Reviewers

- `vercel/zai/glm-5.2` via OpenCode/Vercel AI Gateway — fresh-context code review
- `vercel/moonshotai/kimi-k2.7-code` via OpenCode/Vercel AI Gateway — fresh-context code review

Both reviewers were given the same read-only artifact brief and required verdict schema. Neither edited the repository.

## Verdicts

Both reviewers: **APPROVED WITH NITS**.

No correctness, security, data-loss, scoring, scheduler-selection, migration, or non-PA regression blocker was identified.

## Shared findings

1. **Viewport evidence remains outstanding.** No recorded rendered-card verification exists yet at 320, 375, 768, and 1280 CSS pixels. This is a Spec 006 acceptance/review gate and blocks family-pilot rollout evidence, not a code-correctness blocker.
2. **Provisional wording still needs owner/curriculum review.** Both reviewers flagged slash notation and phrasing such as “Stretch /a/ slightly” for the mandated readability review. This is already owned by Plan 006a Task 5.

## Individual non-blocking observations

- GLM: the role-label heading hierarchy cannot be fully verified without the surrounding `CardShell` context; only a maintainability/accessibility nit.
- GLM: the negative validator loop currently exercises one live PA item because the content set currently has one live `pa_` item.
- Kimi: “Listen for:” could be made more explicit as expected-answer guidance during the wording review.
- Kimi: role labels use `<h2>` inside nested sections; no concrete hierarchy defect was established.

## Evidence reviewed

- Content contract tests cover missing, empty, and whitespace-only `guardian_script`, `student_task`, and `answer`, plus deprecated compatibility.
- Scheduler/planner/API tests cover additive propagation and omission when unauthored.
- App tests cover canonical role rendering, legacy fallback, expected answer, and preserved scoring controls.
- Reported gates: content validation pass; scripts 141/141; API 124/124; app 61/61; workspace typechecks pass; `git diff --check` pass.

## Disposition

No remediation code change is required from this review. Keep `rw-gmi` open until the viewport evidence and owner/curriculum review are recorded. SLP review remains the separate educator-wave gate.

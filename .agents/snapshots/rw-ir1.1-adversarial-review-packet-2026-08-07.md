# rw-ir1.1 adversarial code-review packet

**Target:** `plan/rw-ir1-1-family-progress` at `1ab4e63`, compared with `origin/main`; PR #228 (`feat: add family-safe guardian progress`).

**Profile:** code review — correctness, regression risk, tests/verification, maintainability, authorization/privacy, and family-facing accessibility/responsive behavior.

**Review isolation:** Fresh-context reviewers receive this packet and the repository only. Do not rely on parent-chat history, unstated intent, or prior reviewer conclusions. Do not edit files, commit, push, or merge.

## Bead and acceptance criteria

Bead `rw-ir1.1` is “Make guardian progress summaries readable and family-safe.” The implementation must ensure that an authenticated guardian opening an owned student receives that student’s progress without operator-tools access and cannot receive another guardian’s student data; each row shows a human-readable skill name, correct/attempt counts, and an accessible expandable plain-language explanation; internal IDs are not the default visible label; 320px and 375px layouts have no horizontal overflow or clipped borders and readable scores; operator diagnostics authorization is unchanged; API, app rendering, ownership, accessibility, and responsive regression tests pass.

Relevant implementation files:

- `api/src/routes/students.ts` and `api/src/routes/students.test.ts`
- `app/src/App.tsx`, `app/src/App.css`, `app/src/api/literacy.ts`, `app/src/api/types.ts`, `app/src/routes/guardian.test.tsx`
- `content/skills.json`, `api/src/scheduler/content.ts`, `scripts/content-validate.ts` and related tests

## Fresh verification evidence

- `pnpm --filter app build`: PASS
- `pnpm -r typecheck`: PASS
- `pnpm lint`: PASS
- `pnpm test`: app 79/79, API 138/138, script tests 176/176 PASS
- `pnpm content:validate`: PASS (17 skills, 283 items)
- `git diff --check origin/main...HEAD`: PASS
- Prior browser evidence: non-operator guardian at 320/375/768/1280 CSS px; no overflow, clipped borders, score overlap, raw IDs, browser errors, or overlay; native disclosure Enter/Space keyboard behavior passed.
- Prior physical Safari + VoiceOver verification: PASS.

## Reviewer output contract

Return exactly: (1) verdict `APPROVED`, `APPROVED WITH NITS`, `BLOCKED`, or `NEEDS CLARIFICATION`; (2) findings with severity (`BLOCKER`, `MAJOR`, `MINOR`, or `NIT`), file/line, concrete evidence, and remediation; (3) explicit disposition for every acceptance criterion; (4) whether any finding requires a follow-up Bead. Distinguish verified defects from optional improvements. Keep the review concise and do not change the repository.

## Review results and synthesis (2026-08-06/07)

Both requested fresh-context reviewers ran through OpenCode using the Vercel AI Gateway with verified model IDs:

- `vercel/zai/glm-5.2` (high): **APPROVED WITH NITS**; no verified defects, five optional improvements (CSS marker allowance, module-load coupling, automated keyboard test, deprecated-skill API coverage, and list semantics), no follow-up Bead.
- `vercel/moonshotai/kimi-k3` (high): **APPROVED WITH NITS**; no verified defects, two optional improvements (trim metadata strings and avoid module-scope content loading), plus an observation that responsive evidence is manual rather than automated; no follow-up Bead.

The reviewers agreed on all substantive conclusions: ownership and archived-student filtering are correct, operator diagnostics authorization is unchanged, native disclosure semantics are preserved, and the acceptance criteria are satisfied by code/tests plus prior browser/device evidence. No disagreement or blocker was found. The shared CSS marker-offset nit was remediated separately in the canonical round-1 evidence. The other findings remain optional and are not required to ship this scoped change.

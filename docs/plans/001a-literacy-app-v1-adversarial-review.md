# Adversarial Review Packet — Plan 001a Literacy App v1 First Previewable Foundation

**Plan:** [`docs/plans/001a-literacy-app-v1.md`](001a-literacy-app-v1.md)
**Spec:** [`docs/specs/001-literacy-app-v1-design.md`](../specs/001-literacy-app-v1-design.md)
**Branch:** `plan/001a-literacy-app-v1`
**Date:** 2026-05-17
**Current verdict:** APPROVED WITH NITS; engineer can start Wave 1 immediately

## 1. Round history

| Round | Disposition | Outcome |
|---|---|---|
| Round 1 | Reject — revise and re-review | 5 critical, 7 important, 5 minor, 14 coverage-gap rows, 5 scope-leak findings |
| Round 2 | BLOCKED | Criticals largely fixed; importants/coverage gaps still failing; 8 new issues introduced by revision; one direct spec/plan enum conflict |
| Round 3 | APPROVED WITH NITS | Every Round-1 and Round-2 finding scored as Fixed or Fixed-deferred; engineer can start Wave 1 immediately; five nits recorded below. |
| Stage-2 review (post Wave 5) | REVISE → READY FOR MERGE (pending sentinel) | 2 blockers + 4 importants + 2 minors against the implementation; all in-code findings resolved; sentinel replacement remains procedural. See §9. |

## 2. Round 3 nits

| # | Nit | When to fix | Risk if not fixed | Response |
|---|---|---|---|---|
| 1 | §3 Created table omitted `api/package.json`, `api/vitest.config.ts`, `api/tsconfig.json`, and `app/tsconfig.json`; Task 3.2 auth test depends on `vitest.config.ts` worker-pool wiring that was not authored. | Before Wave 3 | Wave 3 auth test will not resolve `@cloudflare/vitest-pool-workers` pool. | Patched now: §3 lists all four files; Task 1.2 authors app/API tsconfigs, API package dependency, and `api/vitest.config.ts`. |
| 2 | Task 1.2 `mkdir` created `api/email` but the file lives at `api/src/email/magic-link.ts`. | Before Wave 1 lands | Path inconsistency between mkdir and file location. | Patched now: Task 1.2 creates `api/src/email`. |
| 3 | Sentinel CI gate blocks the Wave 2 PR that introduces the sentinel; no CI waiver mechanism exists. | Procedural during Wave 2 | First Wave 2 PR must provision real D1 ID before opening, or be force-merged. | Deferred procedurally: Wave 2 must provision the real D1 ID before opening the PR or document reviewer-approved waiver. |
| 4 | `APP_ORIGIN = "http://localhost:5173"` plus Secure cookies is environment-fragile across Cloudflare local dev. | Minor; smoke catches it | Cookie may not stick in some local dev contexts. | Accepted minor risk; local/preview smoke remains the detection mechanism. |
| 5 | Auth test scrapes `console.log` for the magic URL, but dev-log issuer log format was not specified. | Before Wave 3 | Test regex is tied to phantom behavior. | Patched now: Task 3.2 specifies exact `[magic-link] ${url}` log format and test extraction uses that prefix. |

## 2. Round 1 findings

### Critical
- **C1.** No per-task code blocks; writing-plans contract violated.
- **C2.** Wave 2 circular dependency (validator verified before authored).
- **C3.** Scripts invoked but never authored (`db:migrations:list`, `content:validate`, `replay:attempts`).
- **C4.** `api/wrangler.toml` listed as created but no task authored it.
- **C5.** Auth/magic-link on the critical path but undefined.

### Important
- **I1.** Schema missing `archived_at`, `bonus_count`, scoring_source enum conflict.
- **I2.** Validator omits ID immutability vs main, grade-band sanity, `deprecated:true` enforcement.
- **I3.** Drill modes 4→1 stealth descope.
- **I4.** Scheduler in 001a undefined (no `scheduler.ts`/`mastery.ts`).
- **I5.** R2 / audio manifest / TTS fallback unaddressed.
- **I6.** PR gates mix CI-enforceable and honor-system without annotation.
- **I7.** `pnpm replay:attempts` in final gate is decorative on empty DB.

### Minor
- **M1.** Auth review applies to behavior, not just paths.
- **M2.** `pnpm --version` is env check, not action.
- **M3.** Replay cadence meaningless until pilot data exists.
- **M4.** `tsconfig.base.json` strict flags unspecified.
- **M5.** README `git diff` is not verification.

### Coverage gaps (14 rows)
PWA, frontend libs (Tailwind/Lexend/router/state), magic-link wiring, schema fields, scoring_source enum, ID immutability, grade-band sanity, `/content/VERSION`, four drill modes, SRS state machine, diag gate, nine routes, audio preloading + TTS, R2 binding, rollback boundary enforcement.

### Scope leaks
Drill modes 4→1, SRS, PWA — all stealth descopes without successor-plan pointers.

## 3. Round 1 → Round 2 revision response

Round-1 author addressed C1–C5 in commit 13:40 by replacing wave tables with per-task sections containing concrete payloads, reordering Wave 2, authoring `package.json` scripts in Task 1.1, authoring `wrangler.toml` in Task 2.1, and authoring magic-link routes in Task 3.2.

## 4. Round 2 findings

### Critical verification
- **C1.** Fixed (per-task code blocks throughout §9).
- **C2.** Fixed (validator now precedes seed).
- **C3.** Fixed (scripts authored in Task 1.1).
- **C4.** Fixed (Task 2.1 authors `wrangler.toml`).
- **C5.** Partially fixed (auth contract present; no test scaffold payload; cookie `Max-Age` missing; CSRF posture unnamed).

### Important verification
- **I1.** Not fixed — `scoring_source` SQL hardcodes `'guardian_tap'`, direct conflict with spec enum.
- **I2.** Not fixed — validator still missing immutability + grade-band + deprecated:true rules.
- **I3.** Not fixed (stealth) — Wave 4.3 still ships "one card" with no deferral pointer.
- **I4.** Not fixed (stealth) — no `scheduler.ts`/`mastery.ts` task, no deferral pointer.
- **I5.** Not fixed (stealth) — manifest read but not authored, no R2 binding, no TTS fallback.
- **I6.** Not fixed — checklist still unannotated.
- **I7.** Not fixed — `replay:attempts` still in final gate.

### Minor verification
- **M1.** Partially fixed (security reviewer named in 3.2).
- **M2.** Partially fixed (chained with action; env-check noise remains).
- **M3.** Not fixed (cadence still triggers on first scheduler PR).
- **M4.** Fixed (`tsconfig.base.json` now lists strict flags).
- **M5.** Partially fixed (README sections named; verification still `git diff`).

### Coverage gaps re-scored
2 fixed (`student.archived_at`/`bonus_count`, diag env gate), 2 partial (magic-link, nine routes), 10 still missing or stealth.

### Scope leaks re-scored
All 3 stealth descopes (drill modes, SRS, PWA) still stealth — no successor plan IDs named in the revised plan.

### New issues introduced by the revision
1. `scoring_source = 'guardian_tap'` in Task 2.2 SQL directly contradicts spec §3 enum.
2. Sentinel UUID rule (Task 2.1) is honor-system; no CI gate.
3. `Env.AUTH_EMAIL_ISSUER` enum widens to three values but only `dev-log` is implemented.
4. `api/src/db/session.ts` named in Task 3.2 file scope but no payload defined.
5. Auth test command `pnpm --filter api test -- auth` runs no file (no test scaffold authored).
6. Acceptance-coverage table reads as satisfied while underlying drill-mode scope descopes.
7. `pnpm replay:attempts` chained into ship gates but cannot fail.
8. Root `pnpm dev` references `app` dev script without authoring `app/package.json`.

## 5. Round 2 → Round 3 revision response

### Spec amendment
- Spec §3 `attempt.scoring_source` enum renamed `'parent'` → `'guardian_tap'` to align with v1.0 vocabulary; `mic_auto` / `mic_then_parent_override` retained for forward compatibility. Spec status line updated.
- Spec already had `result IN ('correct', 'incorrect', 'skipped')`; plan SQL aligned to `'skipped'` (was `'skip'`).

### Plan revision — finding-by-finding status entering Round 3

| Round-1/2 finding | Round 3 status | Where in revised plan |
|---|---|---|
| C1 per-task code blocks | Fixed (retained from R2) | §9 throughout |
| C2 wave-2 ordering | Fixed (retained from R2) | §9 Wave 2 |
| C3 script authoring | Fixed (retained from R2) | Task 1.1 |
| C4 wrangler.toml | Fixed (retained from R2) | Task 2.1 |
| C5 auth scaffold | Fixed (R3 added) | Task 3.2 — session helper payload + Vitest scaffold using `@cloudflare/vitest-pool-workers`, cookie `Max-Age=2592000`, single-use + expiry + logout tests |
| I1 schema/enum conflict | Fixed (R3) | Spec amended; plan SQL aligned (`'skipped'` for result, `'guardian_tap'` for scoring_source matching amended spec) |
| I2 validator rules | Fixed (R3) | Task 2.3 — immutability vs origin/main, grade-band prereq sanity, deprecated:true enforcement, reference integrity |
| I3 drill modes descope | Fixed via explicit deferral (R3) | §1 Scope envelope + §13 → 001e |
| I4 scheduler descope | Fixed via explicit deferral (R3) | §1 Scope envelope + §13 → 001c |
| I5 audio descope | Fixed via explicit deferral (R3) | §1 Scope envelope + §13 → 001d |
| I6 gate annotation | Fixed (R3) | §5 and Task 5.1 — `[CI]` / `[reviewer]` tags on every gate |
| I7 decorative replay gate | Fixed (R3) | Task 5.4 + §10 — `replay:attempts` removed from ship gate; replaced with `bash scripts/check-sentinel.sh` |
| M1 auth review framing | Carried forward; security-aware reviewer named in Task 3.2 | Task 3.2 |
| M2 `pnpm --version` env check | Carried forward; chained with action | Task 1.1 |
| M3 replay cadence | Fixed (R3) | §8 — cadence trigger changed to "after first pilot attempts exist" |
| M4 tsconfig flags | Fixed (R2) | Task 1.1 payload |
| M5 README verification | Fixed (R3) | Task 5.3 — grep-based verification of section headings |
| Coverage gap: PWA | Fixed via explicit deferral (R3) | §1 + §13 → 001b |
| Coverage gap: frontend libs | Fixed via explicit deferral (R3) | §1 + §13 → 001b |
| Coverage gap: magic-link wiring | Fixed via explicit deferral (R3) | §1 + §13 → 001f; `Env.AUTH_EMAIL_ISSUER` narrowed to `"dev-log"` |
| Coverage gap: ID immutability | Fixed (R3) | Task 2.3 validator |
| Coverage gap: grade-band | Fixed (R3) | Task 2.3 validator |
| Coverage gap: `/content/VERSION` | Fixed via explicit deferral (R3) | §13 → 001b |
| Coverage gap: four drill modes | Fixed via explicit deferral (R3) | §13 → 001e |
| Coverage gap: SRS | Fixed via explicit deferral (R3) | §13 → 001c |
| Coverage gap: nine routes | Already covered (R2) | Tasks 4.2 + 4.3 |
| Coverage gap: audio preloading + TTS | Fixed via explicit deferral (R3) | §13 → 001d |
| Coverage gap: R2 binding | Fixed via explicit deferral (R3) | §13 → 001d |
| Coverage gap: rollback boundaries | Carried forward; D1 forward-only policy retained; full enforcement deferred | §4 |
| New issue 1: scoring_source conflict | Fixed (R3) | Spec amendment + plan alignment |
| New issue 2: sentinel UUID honor-system | Fixed (R3) | Task 1.4 — `scripts/check-sentinel.sh` + `.github/workflows/ci.yml` |
| New issue 3: AUTH_EMAIL_ISSUER drift | Fixed (R3) | Task 3.1 — narrowed to `"dev-log"` with 001f widening comment |
| New issue 4: session.ts payload | Fixed (R3) | Task 3.2 — full payload |
| New issue 5: auth tests not authored | Fixed (R3) | Task 3.2 — `auth.test.ts` payload |
| New issue 6: acceptance table drift | Fixed (R3) | §2 — Phonics-only row clarified |
| New issue 7: decorative replay gate | Fixed (R3) | Task 5.4 + §10 |
| New issue 8: missing `app/package.json` | Fixed (R3) | Task 1.2 payload |

## 6. Re-review checklist (Round 3 reviewer verified)

- [ ] Spec §3 `scoring_source` enum is `'guardian_tap' | 'mic_auto' | 'mic_then_parent_override'`.
- [ ] Plan §9 Task 2.2 SQL matches the amended spec enum (`'guardian_tap'`) and uses `'skipped'` for result.
- [ ] Plan §13 names a successor plan for every descoped surface from Round 2 (drill modes, SRS, PWA, audio, magic-link issuer).
- [ ] Plan §1 Scope envelope is reachable from the goals statement and points to §13.
- [ ] Plan §5 and Task 5.1 PR template annotate every gate `[CI]` or `[reviewer]`.
- [ ] Plan Task 1.4 authors `scripts/check-sentinel.sh` and `.github/workflows/ci.yml`; sentinel gate is in both PR template and Wave 5.4 verification.
- [ ] Plan Task 2.3 validator implements ID immutability vs `origin/main`, grade-band prereq sanity, and `deprecated:true` enforcement.
- [ ] Plan Task 3.2 ships a Vitest scaffold that asserts cookie attributes, single-use, expiry, `/auth/me`, and logout teardown.
- [ ] Plan Task 5.4 and §10 verification chains do not include `pnpm replay:attempts`.
- [ ] Plan §8 cadence triggers replay only after pilot attempts exist.

## 7. Remaining risks (acknowledged, not blocking)

- The plan still expects implementers to replace the sentinel D1 UUID before the implementation PR's final diff; the CI gate makes this enforceable but the first PR introducing the sentinel must keep it (preview hasn't been provisioned) and rely on reviewer judgment until 2.1 is implemented end-to-end against a real D1.
- 001a defines the first previewable foundation slice, not the full v1.0 content bar.
- 001b through 001f are normative pointers but unwritten; the first PR that depends on each must wait for that plan to land or get explicit reviewer waiver.
- Vitest pool worker harness (`@cloudflare/vitest-pool-workers`) introduces a Cloudflare-specific test runtime; if it's incompatible with the chosen wrangler version, the auth test scaffold needs adjustment in Wave 3.

## 8. Requested Round 3 disposition

Requested disposition from adversarial reviewer:

- `APPROVED` — implementation may proceed by wave.
- `APPROVED WITH NITS` — implementation may proceed after minor plan nits are patched.
- `BLOCKED` — implementation must not proceed; list blocking findings.
- `NEEDS CLARIFICATION` — user decision required before approval.

## 9. Stage-2 implementation review (post Wave 5)

**Date:** 2026-05-18
**Branch under review:** `plan/001a-literacy-app-v1` @ `74ab474`
**Disposition entering review:** REVISE — two blockers and four importants identified against the merged implementation.
**Disposition after fixes:** READY FOR MERGE pending sentinel D1 replacement.

### Findings and responses

| # | Severity | Finding | Disposition | Where addressed |
|---|---|---|---|---|
| S2-1 | Blocker | API/app contract mismatch: API returned `practice_session.plan_json`; app types and code expected `practice_session.plan`. Practice loop would fail end-to-end against real API. | Fixed | `api/src/routes/practice.ts:47` returns `plan` (parsed object); DB column remains `plan_json`. `api/src/routes/practice.test.ts` updated. App types already matched. |
| S2-2 | Blocker | Sentinel D1 UUID still present in diff vs `origin/main`; merge gate refuses. | Procedural — not auto-resolvable | Real preview D1 must be provisioned and migration substituted before opening the merge PR. `scripts/check-sentinel.sh` enforces. |
| S2-3 | Important | Attempt submission integrity too permissive: server accepted any `(skill_id, item_id)` for an owned session, allowing forged or buggy clients to pollute the source-of-truth attempt log. | Fixed | `api/src/routes/practice.ts` now loads `plan_json` for the submitted session, parses it, and rejects 400 if `(skill_id, item_id)` is not in the started plan. Rejects 409 if the session is already completed. New test in `api/src/routes/practice.test.ts`. |
| S2-4 | Important | Guardian progress UI was a static placeholder. | Fixed (skeletal but real) | `StudentDashboardRoute` in `app/src/App.tsx` fetches `/guardian/diag`, summarizes attempts per skill for the current student, and renders overall accuracy + per-skill breakdown. UX polish deferred to 001b/001e. |
| S2-5 | Important | No UI path to diagnostics; `/guardian/diag` was backend-only. | Fixed | New `/guardian/diag` route in `app/src/App.tsx` renders the summary table. `GuardianNav` and `GuardianRoute` link to it. |
| S2-6 | Important | `Student.prefs_json` type mismatch: backend serialized as parsed object; app type said `string`. | Fixed | `app/src/api/types.ts` `Student.prefs_json` changed to `Record<string, unknown>`; test mocks updated. |
| S2-7 | Minor | PhonicsCard buttons could double-submit if a guardian tapped fast. | Fixed | PhonicsCard now tracks `scored` state and disables all three buttons after the first tap; App.tsx keys the card by `${skill_id}:${item_id}` so each card mounts fresh. |
| S2-8 | Minor | `birth_month` validation accepted any two digits. | Fixed | `api/src/routes/students.ts` regex narrowed to `^\d{4}-(0[1-9]|1[0-2])$`; new test in `students.test.ts`. |
| S2-9 | Minor | `scripts/replay-attempts.ts` is a stub. | Accepted per plan | Plan §9 Task 5.x explicitly defers to first scheduler PR (§13 → 001c). |
| S2-10 | Note | UI / IA pass requested before expanding child-facing modes. | Partially addressed | This pass added: top-level GuardianNav, diag route, per-skill progress view, loading/empty/error states across every fetch view, mobile-first layout, button disabled state, secondary actions surface. Visual design system (Figma, motion, audio cues, full skill-map UX) remains deferred to 001b. |

### Verification at end of Stage-2 review

- `pnpm -r typecheck` — passes (api + app).
- `pnpm -r test` — passes (10 api tests + 8 app tests; new tests cover attempt-integrity 400 and birth_month 400).
- `bash scripts/check-sentinel.sh` — fails as expected; sentinel still present (procedural blocker S2-2).

### Remaining for merge

1. Provision real preview D1 (Cloudflare side, out-of-band) and replace the sentinel UUID in `api/wrangler.toml` + migration filenames as applicable.
2. Re-run `bash scripts/check-sentinel.sh` until clean.
3. Open merge PR; CI workflow at `.github/workflows/ci.yml` re-runs typecheck, tests, and sentinel gate.

### Out of scope for this branch (deferred)

- Visual/design-system pass — 001b.
- SRS scheduler + skill-map view — 001c.
- TTS, R2 audio binding, mic stub — 001d.
- Drill modes 2–4 (Heart, Fluency, PA) — 001e.
- Magic-link issuer beyond `dev-log` — 001f.

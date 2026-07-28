# Plans 007a and 008a Adversarial Review Evidence

**Date:** 2026-07-26
**Profile:** plan — high risk / high effort
**Transport:** headless OpenCode via Vercel AI Gateway
**Targets:** `docs/plans/007a-k-u1-heart-word-classification.md`, `docs/plans/008a-family-safe-guardian-progress.md`

## Reviewer matrix

| Target | Round | Model | Role | Raw verdict |
|---|---:|---|---|---|
| 007a | 1 | `vercel/moonshotai/kimi-k3` | zero-context execution, sequencing, test realism | APPROVED WITH NITS |
| 007a | 1 | `vercel/zai/glm-5.2` | curriculum data, manifest arithmetic, immutability | APPROVED WITH NITS |
| 008a | 1 | `vercel/moonshotai/kimi-k3` | cross-layer execution and compatibility | APPROVED WITH NITS |
| 008a | 1 | `vercel/zai/glm-5.2` | authorization, privacy, accessibility, responsiveness | BLOCKED |
| 008a | 2 | `vercel/moonshotai/kimi-k3` | blocker closure and execution hardening | APPROVED WITH NITS |
| 008a | 2 | `vercel/zai/glm-5.2` | blocker closure, auth and family-data boundary | APPROVED WITH NITS |

The first OpenCode launch attempt parsed the prompt as a filename, and the next default-agent attempt exited before a verdict after trying repository skills/tools. Neither attempt reached a substantive review and neither is counted above. Counted reviews ran in fresh OpenCode `--pure` sessions with attached evidence and tool use forbidden.

## 007a synthesis

**Final verdict:** APPROVED WITH NITS

Both reviewers verified:

- retiring one live phonics item and adding `phonics_k_u1_cvc_a_sam` preserves 200 live decodable words;
- adding `heart_k_u1_as` raises live heart words from 50 to 51 without lowering the manifest;
- `Sam` is decodable from the cumulative K Unit 1 graphemes;
- retaining `phonics_k_u1_cvc_a_as` with `deprecated: true` satisfies identifier immutability;
- the `a` regular / `s` irregular split matches the existing `heart_k_u1_is` precedent;
- practice-route fixtures do not currently reference the exact retired item.

Accepted Kimi finding: the app card test constructs a `PracticeCard` inline, so it would already pass and cannot honestly be a RED test for missing canonical content. Plan 007a now defines the scheduler content test as the real RED gate and the card test as a passing characterization lock.

Accepted GLM/Kimi nits: grouped-item assertions now name exact item IDs, insertion adjacency is specified, and the practice-fixture search is explicit.

Rejected or non-actionable:

- A seed-to-React integration import was not added. The scheduler test locks the canonical item fields and the generic card test locks rendering; importing server content into the app test would create a new cross-package coupling without closing a demonstrated gap.
- The concern that `pnpm test:scripts` might not exist was rejected by direct `package.json` evidence: the script exists.

## 008a round 1 synthesis

**Round 1 verdict:** BLOCKED

GLM identified a real contradiction: the plan allowed deprecated retained skills to omit display metadata while the runtime fallback applied only to absent skill IDs. That could produce blank family-facing rows. The higher-severity verdict was preserved.

Accepted remediation:

- require nonblank metadata on every retained skill, including deprecated rows;
- map absent or blank runtime metadata to exact safe fallback copy;
- aggregate multiple unknown historical skill IDs into one fallback row;
- directly test missing/blank metadata resolution;
- assert the dashboard never calls `getGuardianDiag`;
- retain the diagnostics mock for diagnostics-route tests while adding a progress mock;
- preserve native `<summary>` list-item behavior and put layout grid on an inner wrapper;
- use explicit mobile wrapping properties;
- move physical Safari/VoiceOver verification to the owner gate;
- pin exact response keys, ordering, and no-leakage behavior.

## 008a round 2 synthesis

**Final verdict:** APPROVED WITH NITS

Both reviewers verified the round 1 blocker was closed and found no remaining blocker. They confirmed:

- ownership uses the existing guardian + active-student boundary before the attempt query;
- the response excludes item/session/operator telemetry;
- metadata and historical fallback paths remain human-readable;
- dashboard progress no longer depends on operator diagnostics;
- native disclosure semantics, visible affordance, and mobile wrapping are explicitly verified;
- all 17 canonical skills have provisional copy and an owner review gate.

Accepted round 2 hardening:

- make `WHERE student_id = ?` explicit;
- compute overall totals from raw grouped rows before fallback collapse;
- include the fallback row in deterministic ordering tests;
- prove retained deprecated skills remain in scheduler metadata;
- preserve the existing overall correct/attempt/percentage UI through the cutover.

Rejected or deferred:

- Plan 007a does not overlap Plan 008a production files: 007a changes item content and card tests; 008a changes skill metadata, student progress API, and guardian dashboard files. The parallelism concern is unsupported by the declared surfaces.
- A reserved-key content-validator rule was not added. `__earlier_practice__` is an API response sentinel, not canonical curriculum content; collision handling remains local to the route and its exact-response tests.
- Loading scheduler content once for the route is intentionally accepted because it reuses the canonical parser and the bundled content is small; creating a second JSON-reading path would increase drift risk.

## Final disposition

- Plan 007a: APPROVED WITH NITS; ready for owner curriculum confirmation and execution.
- Plan 008a: APPROVED WITH NITS after round 2; ready for execution, with physical Safari/VoiceOver and final copy approval remaining human gates before merge.
- No third review round is warranted under the two-round cap.

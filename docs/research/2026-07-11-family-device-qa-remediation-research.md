# Research: First production family-device QA remediation

**Date:** 2026-07-11
**Active bead:** `rw-15y`
**Source issues:** `rw-arr`, `rw-cwm`, `rw-r6r`, `rw-a92`, `rw-gmi`
**Purpose:** Ground three scoped specifications in observed production behavior, current code contracts, project evidence, and authoritative external guidance.

## Method and evidence boundary

This research combines:

- six user-supplied production screenshots from iPhone Safari showing the guardian shell, student creation, operator-only pages, and practice start;
- one user-supplied production screenshot of the phonemic-awareness `/a/` + `/t/` card;
- the five Beads reports created from that QA session;
- current route, content, configuration, and test behavior on `origin/main`; and
- Tier A/C sources registered in `docs/research/SOURCES.md`.

The Axon research workflow normally requires Serena symbolic tools. Serena is not available in the current Codex harness, so symbol discovery used targeted `rg` queries plus direct reads of only the relevant route, component, configuration, content, and test bodies. This limitation affects exploration efficiency, not the evidence cited below.

External standards and curriculum resources support outcome constraints; they do not select a visual design or exact instructional sentence. The production screenshots remain the primary evidence for the reported usability failures.

## Scope recommendation

One shared research packet is appropriate because all findings came from the same first family-device session. One implementation spec is not appropriate: the work has three distinct ownership and risk boundaries.

1. **Guardian mobile shell and flows** — `rw-arr`, `rw-cwm`, `rw-a92`; React routing, authenticated navigation, responsive layout, and client-side focus/status behavior.
2. **Production operator access** — `rw-r6r`; authorization configuration and deployment verification with a security boundary that must not broaden.
3. **Caregiver-ready PA instructions** — `rw-gmi`; instructional content contract, scheduler payload propagation, and mode-specific rendering.

## Surface area

### Guardian mobile shell and flows

- `app/src/App.tsx`
  - `navigate` / `usePath`: history-based client routing without a router library.
  - `GuardianNav`: authenticated links render only after `getCurrentGuardian`; no Reader's Way identity; Diagnostics and Audio catalog render for every guardian.
  - `AddStudentRoute`: creates the student, keeps the form mounted, and renders an inline status plus a link to the student dashboard.
  - `PlayStartRoute`, `DrillRoute`, `DoneRoute`: student-mode route family.
  - `App`: suppresses all guardian navigation whenever the first path segment is `play`.
- `app/src/App.css`
  - `.page-shell`: `min-height: 100vh` plus centered grid placement; when a separate navigation row is also present, the page exceeds one viewport and visibly centers the panel below a large blank band.
  - `.guardian-nav`: wrapping flex row with no mobile-specific composition.
- `app/src/routes/guardian.test.tsx`: student creation currently asserts only the inline “is ready” text; it does not assert a route transition, refreshed student list, or post-navigation focus.
- `app/src/routes/play.test.tsx`: covers start, scoring, error recovery, and completion but no guardian-requested exit.
- `packages/copy/index.ts`: centralized `productName = "Reader's Way"` already exists and is the required brand source.
- `docs/design/user-journeys.md`: canonical add-child flow returns to guardian home; the device changes hands at practice start; the guardian remains responsible for scoring.
- `docs/plans/002h-phase-a-ui-polish-a11y.md`: already establishes 375/768/1280 manual coverage, but the first live 375px pass found failures not represented by a dedicated shell contract.

### Production operator access

- `api/src/routes/diag.ts` and `api/src/routes/audio-catalog.ts`: both require an authenticated guardian whose normalized account email exactly equals `DIAG_GUARDIAN_EMAIL`; unauthorized and forbidden outcomes are intentionally distinct.
- `api/wrangler.toml`: production still declares the placeholder `pilot-guardian@example.com`, so the real owner account cannot satisfy either route's operator gate.
- `api/src/routes/practice.test.ts`, `api/src/routes/telemetry.test.ts`, and `api/src/routes/audio-catalog.test.ts`: test the exact-email gate and data scoping.
- `app/src/App.tsx` / `app/src/routes/AudioCatalogRoute.tsx`: Diagnostics reports a generic load/access error; Audio catalog renders a specific operator-only denial.
- Spec 003 deliberately chose one designated operator rather than a general admin-role system.

### Caregiver-ready phonemic-awareness instructions

- `content/items/seed.json`: the only current PA item authors `prompt: "Blend /a/ and /t/."` and `answer: "at"`.
- `api/src/scheduler/content.ts` and `api/src/scheduler/planner.ts`: normalize the prompt into generic card `text` and propagate `answer`; there is no separate adult cue, child action, or modeling field.
- `app/src/api/types.ts`: the client card contract describes `answer` as guardian-facing expected output only.
- `app/src/components/cards/DrillCard.tsx` / `cardCopy.ts`: PA rendering shows “Listen and say it,” raw card text, and “Listen for:”; the two participants' roles are not explicit.
- `app/src/components/cards/cards.test.tsx` and scheduler tests: lock the ambiguous current text/payload shape.
- `rw-qjk` intentionally shipped the minimum mode distinction; audio modeling stays owned by `rw-1gz.8.2`, and advanced scaffolds remain outside this QA remediation.

## Evidence-to-requirement findings

### 1. Mobile compactness must not trade away operability

The production screenshots show two separate failures: the navigation consumes an awkward two-row block with no product identity, and content is centered inside an additional full viewport below it. WCAG 2.2 requires content to reflow without loss of information or functionality at 320 CSS px and repeated navigation to remain predictable. WCAG's Level AA target-size floor is 24 CSS px; Apple recommends a 44-by-44-point hit region for touch controls. These sources support compact visual composition with retained touch area—not shrinking links into dense inline text.

**Requirement implication:** specify outcomes at 375, 768, and 1280 widths; keep stable link order and touch-safe hit regions; source the visible product name from centralized copy; make page height account for the authenticated header instead of adding `100vh` below it.

**Sources:** `W3C-WCAG-2.2`, `APPLE-HIG-BUTTONS`, Spec 002 FR1–FR3/FR35–FR36.

### 2. Operator-only destinations should follow authorization state

The least-privilege boundary is intentional and consistent across both APIs. The failure is designation drift: production names a placeholder operator while navigation presents restricted destinations to the real guardian. NIST AC-6 supports granting only access necessary for assigned duties; it does not justify exposing these routes to every guardian.

**Requirement implication:** keep one designated operator and exact server-side enforcement; configure the real operator through an appropriate production binding; expose operator links only when the client has a trustworthy capability signal; verify 401, 403, and operator-success paths. Avoid inferring authorization from a client-side email comparison alone.

**Sources:** `NIST-800-53-AC6`, Spec 003 operator-only decision, existing API tests.

### 3. Student creation needs both a clear transition and accessible completion feedback

The canonical journey returns to guardian home after adding a child, while the current UI leaves the guardian on a completed form. W3C form guidance says submission outcomes need clear success/error notification; WCAG 4.1.3 applies when dynamic status text remains in place. A client-side redirect changes context, so the destination must itself make completion and location understandable rather than relying solely on a disappearing live region.

**Requirement implication:** on success, return to `/guardian`, refresh or otherwise show the newly created student, and provide a perceivable success indication at the destination. On failure, remain on the form with an alert and entered values preserved. Specify focus/title behavior for the client-routed destination.

**Sources:** `W3C-FORM-NOTIFICATIONS`, `W3C-WCAG-2.2`, `docs/design/user-journeys.md`.

### 4. Practice needs a narrow guardian exit, not the full guardian shell

The absence of navigation in student mode is intentional and supports a calm, low-distraction child experience. The first family-device session nevertheless showed that the guardian cannot leave without browser chrome or completion. The co-engagement evidence supports socially interactive adult participation and avoiding unrelated distractors.

**Requirement implication:** provide one clearly labeled, touch-safe guardian exit on practice start and active drill screens; do not restore Diagnostics, Audio catalog, sign-out, or other guardian chrome. The spec must decide what happens to an in-progress locally persisted session when the guardian exits and later returns.

**Sources:** `HIRSH-PASEK-APPS-2015`, `APPLE-HIG-BUTTONS`, canonical user journey.

### 5. PA blending requires an explicit adult script and child response

IES supports explicit instruction in sound segments and blending. UFLI's implementation routine distinguishes the adult presenting individual phonemes from the child blending them into a word and models the routine before independent response. The current card compresses those roles into the specialist verb “blend.”

**Requirement implication:** PA data/rendering must distinguish at least the adult cue/model, child action, and expected response. Copy must use plain caregiver language while preserving phoneme notation needed for accurate delivery. The exact script needs curriculum/owner review; the product must not present itself as clinical speech therapy.

**Sources:** `IES-FOUNDATIONAL-2016`, `UFLI-PHONEMIC-AWARENESS`, `HIRSH-PASEK-APPS-2015`.

## Key constraints

- Preserve the current `navigate`/`usePath` routing approach unless a separate architectural decision approves a router dependency.
- Keep `productName` in `packages/copy` as the brand source; instructional prompts remain content, not brand copy.
- Keep the operator boundary server-enforced and least-privileged; no general admin-role system is in scope.
- Do not make Diagnostics or Audio catalog public and do not expose raw authorization configuration to the client.
- Preserve current practice scoring, completion, and local-session recovery semantics unless the exit decision explicitly changes them.
- Do not bundle audio playback, Elkonin boxes, clinical assessment, or automatic speech scoring into the PA instruction change.
- Preserve 375/768/1280 manual device coverage and the existing app/API test conventions.

## Unknowns

1. **Guardian shell composition:** At 375px, should primary destinations remain visible, collapse behind one labeled menu, or use a compact two-level composition? Research constrains reflow, predictability, brand visibility, and target size but does not choose the pattern.
2. **Capability discovery:** Should `/auth/me` include an operator capability, should a dedicated capability endpoint exist, or should restricted links remain visible but explicitly labeled? Client-side email inference is not trustworthy; the server contract is undecided.
3. **Post-create confirmation:** Should the destination use a one-time route state/status banner, focus the newly created student card, or rely on a heading plus visible new row? The success must be perceivable without leaving stale confirmation after reload.
4. **Practice exit semantics:** Does exit preserve the in-progress session for resume, abandon only local UI state, or complete/abandon server state? Current API has no explicit abandon endpoint.
5. **Exit discoverability vs child distraction:** Should the exit control be always visible, visually quiet, or guarded by an adult affordance? Hidden gestures are out because they are not discoverable.
6. **PA content shape:** Is one authored `adult_prompt` plus `answer` sufficient, or should the reusable contract separately model adult model, child instruction, and scoring guidance?
7. **Instructional approval:** Who gives final curriculum/SLP approval for the caregiver script before family rollout, and does the one current PA item need a temporary owner-approved script before the broader content model expands?

## Risk areas

- **Authentication flicker:** `GuardianNav` initially renders nothing while `/auth/me` loads; adding capability-driven links can introduce layout shifts or accidental disclosure if loading/denied states are conflated.
- **SPA focus regression:** route transitions implemented with `history.pushState` do not automatically reset focus or announce a new page.
- **Session integrity:** an exit control can leave persisted local and server practice state inconsistent if resume/abandon semantics are not explicit.
- **Authorization drift:** a committed production email value is easy to stale or expose; a secret/capability change can also be lost on redeploy if deployment ownership is unclear.
- **Schema compatibility:** existing persisted `plan_json` and localStorage practice objects lack new PA instruction fields; rendering needs a safe legacy fallback.
- **Instructional overreach:** a UI copy edit can accidentally imply clinical correctness, mishandle dialect variation, or hard-code specialist notation without modeling support.
- **Scope collision:** Spec 002 plan 002h covers broad polish later; these family-wave remediations must not silently absorb the full educator-wave accessibility audit.

## Research handoff

The evidence is sufficient to draft three specs, but each spec must resolve its own unknowns before planning:

- **Spec 004:** mobile shell pattern, post-create confirmation/focus, and practice exit/resume semantics.
- **Spec 005:** server-authoritative capability discovery and production designation/rollback.
- **Spec 006:** PA instruction data contract, legacy fallback, and instructional approval gate.

No standalone ADR is yet required. An ADR signal will fire if Spec 004 changes the routing/state model, Spec 005 introduces a durable role/capability system, or Spec 006 establishes a reusable instructional schema beyond the current PA mode.

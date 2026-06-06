# Reader's Way v1.0 Content Bar Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: the project's TDD workflow for code changes (validator), and content QA passes for authored data. Steps use checkbox (`- [ ]`) syntax. This plan is **phased** — Phase 1 (K Units 1–2) is the shippable first slice; Phase 2 (1st-grade Unit 1) is a documented follow-on.

**Goal:** Author the Phase A v1.0 content bar (decoding, heart words, fluency, phoneme/digraph audio) and make the acceptance bar binary via a content **manifest** enforced by the content-validate script.

**Architecture:** Instructional content stays in `content/` as validated data (per planning-nit 1's scope boundary — brand chrome lives in `packages/copy`, never here). Add `content/manifest.json` declaring per-category target counts; extend `scripts/content-validate.ts` to fail when actual content is below the manifest (AC12 gate making AC11 binary). The scheduler already consumes `content/skills.json`, `content/scope-sequence.json`, `content/items/seed.json`, and `content/audio/manifest.json` — authoring expands those files; no scheduler change is required for K. Audio follows **ADR-002** (real phoneme/digraph assets + TTS fallback for words/sentences + gesture-initiated playback).

**Tech Stack:** JSON content files, `scripts/content-validate.ts` (tsx), Vitest where logic exists, scheduler (`api/src/scheduler/`), app drill UI.

**Resolves:** Spec 002 FR16–FR18 / AC11–AC12. Beads epic `rw-1gz.8` (tasks `.8.1`–`.8.4`). Audio strategy: ADR-002.

## Decisions (embedded — no separate decisions doc)

- **Phasing (C-scope):** Phase 1 = **K Units 1–2**; Phase 2 = **1st-grade Unit 1**. AC11 (full v1.0 bar) is *partial* until Phase 2; the manifest is raised to the full v1.0 counts when Phase 2 lands.
- **Audio (C2 / ADR-002):** recorded/sourced audio for 44 phonemes + digraphs; TTS fallback for words/sentences; gesture-initiated playback; device QA on iPadOS Safari + desktop/mobile Chrome/Safari.
- **Authoring (C9 / FR17):** **pilot = LLM-assisted** generation against a UFLI-style scaffold → `content-validate` → human QA pass. **Long-term = hand authoring** (revisit if LLM proves best practice). Every generated batch passes the validator and a human review before merge.
- **Manifest counts (C1):** the manifest is the single source of truth for "complete." Phase 1 declares the K U1–2 targets; Phase 2 raises to the full v1.0 bar. Illustrative targets below; finalized in the manifest during authoring against the UFLI scope.

| Category | Phase 1 (K U1–2) target | Full v1.0 (after Phase 2) |
|---|---|---|
| Phonics skills | ~6–8 | ~12 |
| Heart words (regular/irregular tagged) | ~25–30 | ~50 |
| Decodable words | ~120 | ~200 |
| Fluency sentences | ~18 | ~30 |
| Phoneme/digraph audio | K-relevant phonemes + digraphs | 44 phonemes + ~12 digraphs |
| TTS fallback (words/sentences) | required | required |

---

## Phase 1 — Kindergarten Units 1–2

### Task 1: Content manifest + validator count gate (TDD)

**Files:** Create `content/manifest.json`; Modify `scripts/content-validate.ts`; Test: `scripts/content-validate.test.ts` (new, or extend existing validator tests).

- [ ] **Step 1 (RED):** Write a validator test asserting that when actual content counts fall **below** the manifest's declared minimums, `content-validate` fails with a clear message; and passes when counts meet/exceed them. Run — confirm RED (no manifest read yet).
- [ ] **Step 2 (GREEN):** Add `content/manifest.json` (per-category target counts + audio coverage expectations). Extend `content-validate.ts` to read it and `fail(...)` when `actual < manifest` for any category. Reuse the existing `readJson`/`fail` helpers and counting over `skills`/`items`/`audio`.
- [ ] **Step 3:** Run `pnpm content:validate` and the validator test — GREEN. Commit `feat(content): add content manifest + validator count gate`.

> Sets the Phase 1 manifest to the **current** seed counts first (so the gate passes), then each authoring task below raises the manifest as content lands — keeping the gate hard at every step.

### Task 2: Author K Units 1–2 phonics skills + scope/sequence

**Files:** `content/skills.json`, `content/scope-sequence.json`.

- [ ] Author the K U1–2 phonics skills (short vowels + early digraphs/blends per the UFLI scope) with prerequisites; extend `scope-sequence.json` units in teaching order.
- [ ] Raise `manifest.json` phonics-skill count; run `content:validate` (referential integrity + prereq sanity + manifest gate). Human QA pass. Commit.

### Task 3: Author heart words, decodable words, fluency sentences (LLM pipeline + QA)

**Files:** `content/items/seed.json` (or split files if it grows large).

- [ ] Generate the K U1–2 heart words (regular/irregular tagged), decodable words, and fluency sentences via the LLM-assisted pipeline against the UFLI scaffold.
- [ ] Validate every batch (`content:validate`: unique IDs, skill references, audio references) + **human QA** for decodability and tagging accuracy. Raise the manifest counts. Commit per category.

### Task 4: Phoneme/digraph audio assets + gesture playback (ADR-002)

**Files:** `content/audio/manifest.json`, audio assets, app drill audio wiring.

- [ ] Produce/source the K-relevant phoneme + digraph audio assets; add manifest entries (non-TTS); keep TTS fallback for words/sentences.
- [ ] Ensure app audio playback is **gesture-initiated** (tap) and falls back to TTS where no asset exists. Add/extend a test for the asset-vs-TTS selection.
- [ ] Pilot-device QA on the ADR-002 matrix (iPadOS Safari primary). Raise manifest audio coverage. Commit.

### Task 5: Phase 1 verification gate

- [ ] `pnpm content:validate` (manifest gate green for K U1–2) · `pnpm -r typecheck && pnpm -r test` (scheduler still serves K from expanded content) · app build.
- [ ] Confirm the scheduler produces a coherent K plan from the expanded content (existing `planner`/`practice` tests still green; add coverage if the larger set changes ordering assumptions).
- [ ] Update `docs/state/workflow-state.md`; close `rw-1gz.8.1`/`.8.2`/`.8.3` as their tasks complete.

---

## Phase 2 — 1st-grade Unit 1 (documented follow-on; Beads `rw-1gz.8.4`)

- Author 1st-grade Unit 1 phonics skills + items + audio; add a `grade: "1"` unit to `scope-sequence.json`.
- The scheduler's `grade === "1"` branch already filters review-passed K skills, then selects from ordered skills — once 1st-grade units exist they become active content automatically. **Verify** the planner serves 1st-grade content after the K-review path, and that `planTerminalReason` now only returns `review_complete_no_active_content` at genuine end-of-sequence (retiring the placeholder semantics from `rw-1gz.1.3`).
- Raise `manifest.json` to the full v1.0 counts → AC11 fully satisfied.

---

## Acceptance-criteria coverage

| AC | Phase 1 | Phase 2 |
|---|---|---|
| AC11 (v1.0 content bar matches manifest) | **Partial** (K U1–2 declared + met) | **Full** (manifest raised to v1.0) |
| AC12 (content validation passes) | Covered (manifest gate + existing checks) | Covered |
| FR16 audio + TTS fallback | K phonemes/digraphs + TTS | full 44 phonemes + digraphs |

## Self-review notes

- **AC11 binary:** the manifest + validator count gate makes "the content bar exists" pass/fail (resolves adversarial #8).
- **Audio risk:** ADR-002 + gesture-initiated playback + device QA matrix (resolves adversarial #11).
- **Scope boundary:** instructional content stays in `content/`; no brand strings move here (planning-nit 1).
- **Scheduler:** no K scheduler change needed; Phase 2 verifies 1st-grade integration + the terminal_reason transition (C10).
- **Authoring provenance:** LLM-for-pilot with validator + human QA gates; long-term hand-authoring noted (C9).

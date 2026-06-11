# Reader's Way v1.0 Content Bar Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: the project's TDD workflow for code changes (validator), and content QA passes for authored data. Steps use checkbox (`- [ ]`) syntax. This plan is **phased** — Phase 1 (K Units 1–2) is the shippable first slice; Phase 2 (1st-grade Unit 1) is a documented follow-on.

**Goal:** Author the Phase A v1.0 content bar (decoding, heart words, fluency, phoneme/digraph audio) and make the acceptance bar binary via a content **manifest** enforced by the content-validate script.

**Architecture:** Instructional content stays in `content/` as validated data (per planning-nit 1's scope boundary — brand chrome lives in `packages/copy`, never here). Add `content/manifest.json` declaring per-category target counts; extend `scripts/content-validate.ts` to fail when actual content is below the manifest (AC12 gate making AC11 binary). The scheduler already consumes `content/skills.json`, `content/scope-sequence.json`, `content/items/seed.json`, and `content/audio/manifest.json` — authoring expands those files; no scheduler change is required for K. Audio follows **ADR-002** (real phoneme/digraph assets + TTS fallback for words/sentences + gesture-initiated playback).

**Tech Stack:** JSON content files, `scripts/content-validate.ts` (tsx), Vitest where logic exists, scheduler (`api/src/scheduler/`), app drill UI.

**Resolves:** Spec 002 FR16–FR18 / AC11–AC12. Beads epic `rw-1gz.8` (tasks `.8.1`–`.8.4`). Audio strategy: ADR-002.

## Decisions (embedded — no separate decisions doc)

- **Phasing (C-scope):** Phase 1 = **K Units 1–2**; Phase 2 = **1st-grade Unit 1**. AC11 (full v1.0 bar) is *partial* until Phase 2; the manifest is raised to the full v1.0 counts when Phase 2 lands.
- **Audio (C2 / ADR-002):** recorded/sourced audio for 44 phonemes + digraphs; TTS fallback for words/sentences; gesture-initiated playback; device QA on iPadOS Safari + desktop/mobile Chrome/Safari.
- **Authoring (C9 / FR17):** **pilot = LLM-assisted** generation against a UFLI-style scaffold → `content-validate` → human QA pass. **Long-term = hand authoring** (revisit if LLM proves best practice). Every generated batch passes the validator and a human review before merge. **Full loop, ID/prefix conventions, and QA checklist:** see [Content Authoring Pipeline](#content-authoring-pipeline-c9--fr17) below.
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

## Content Authoring Pipeline (C9 / FR17)

> **Status:** authoring SOP for the pilot. Pilot = **LLM-assisted** generation against a UFLI-style scaffold; **long-term = hand authoring** (revisit if LLM proves best practice). Every generated batch passes `content-validate` **and** a human QA pass before merge. This section is the deliverable of bead `rw-1gz.8.3`; it drives the authoring tasks (`rw-1jk`, Tasks 2–3 below).

### ID / prefix conventions (the validator counts by prefix — get these right or content silently won't count)

`scripts/content-validate.ts` derives every manifest category count from **ID prefixes**, not from a `type` field. Generated content that uses the wrong prefix passes referential integrity but **does not count toward the manifest gate** (and may be miscounted in another category). Author to these exactly:

| Category | Counted from | Required prefix |
|---|---|---|
| `phonics_skills` | `content/skills.json` `skill_id` | `pa_` or `phonics_` |
| `heart_words` | `content/items/seed.json` `item_id` | `heart_` |
| `decodable_words` | items `item_id` | `phonics_` |
| `fluency_sentences` | items `item_id` | `fluency_` |
| `phoneme_digraph_audio` | `content/audio/manifest.json` | `phoneme_` or `digraph_` **and** a real `src` (TTS-fallback entries do **not** count — ADR-002) |

Suggested ID shape: `<prefix>_<grade>_<unit>_<slug>` (e.g. `phonics_k_u1_short_a_cat`, `heart_k_u1_the`, `fluency_k_u1_cat_sat`). IDs are **immutable post-ship** — the validator's `checkImmutability` fails any branch that drops or renames a shipped `skill_id`/`item_id` without `deprecated: true`. Never reuse or rename; add new IDs.

### The loop (per unit, per category)

1. **Select scope.** Pick the unit + target skill(s) from the UFLI-style scope/sequence. List the graphemes/skills taught **at or before** this unit — this is the decodability budget for the batch.
2. **Build the scaffold prompt.** Give the LLM: the target skill, the allowed-grapheme budget (step 1), the exact JSON shape (fields below), the required ID prefix, the batch size needed to raise `required_now`, and the rule that decodable words may use **only** allowed graphemes (heart/irregular words are the sole exception and must be tagged).
3. **Generate a batch** in the exact JSON shape, appended to the right file (`skills.json`, `scope-sequence.json`, or `items/seed.json`).
4. **Validate:** `pnpm content:validate`. Fix every failure (unique IDs, skill/audio references, prereq order, prefix → count, manifest gate). The gate is hard; the batch is not done until it's green.
5. **Human QA pass** against the checklist below. Reject and regenerate items that fail — do not hand-patch silently past a QA failure.
6. **Raise `manifest.json` `required_now`** for the category to the new count (never above `v1_target`; `v1_target` is immutable and never lowered). Re-run `content:validate` so the higher gate is enforced.
7. **Commit per category** (e.g. `content(k-u1): author heart words batch 01`). One category per commit keeps QA and review reviewable.

> **Ordering preconditions** (from Task 1 review): if items are split beyond `seed.json`, the validator must glob all item files **before** authoring at volume (it currently hard-reads `seed.json`). For audio, the `src` schema (Task 4) must land **before** the audio `required_now` is raised — a numeric count alone is satisfiable by TTS entries, which violates ADR-002.

### Item JSON shapes (from current seed)

- **PA/blend skill item:** `{ item_id (pa_*), skill_id, prompt, answer }`
- **Decodable word:** `{ item_id (phonics_*), skill_id, text, audio_id }`
- **Heart word:** `{ item_id (heart_*), skill_id, text, regular_parts[], irregular_parts[], audio_id }`
- **Fluency sentence:** `{ item_id (fluency_*), skill_id, text, audio_id }`
- **Audio entry:** `{ audio_id, src? , tts_fallback? }` — words/sentences use `tts_fallback: true`; phonemes/digraphs need a real `src`.

### Human QA checklist (every batch, before merge)

- [ ] **Decodability** — each decodable word uses only graphemes/skills taught at or before its unit; no untaught patterns leak in. Heart/irregular words are the only exception **and** are tagged.
- [ ] **Heart-word tagging** — `regular_parts` / `irregular_parts` correctly split the word; the irregular part is the genuinely irregular grapheme→phoneme correspondence (not just "hard").
- [ ] **Skill mapping** — each item's `skill_id` is the skill it actually practices, and that skill exists in `skills.json`.
- [ ] **Scope / prerequisite order** — prerequisites precede dependents; the first unit of each grade has no unmet prerequisite (validator enforces, but confirm the teaching order reads sensibly).
- [ ] **Audio references** — every `audio_id` resolves in the audio manifest; TTS-fallback words/sentences pronounce correctly (watch homographs the TTS may mis-read).
- [ ] **Prefix / ID conventions** — IDs use the counting prefix above and the `<prefix>_<grade>_<unit>_<slug>` shape; no reused or renamed shipped IDs.
- [ ] **Developmental appropriateness** — age-appropriate vocabulary for the grade; no proper nouns or obscure words a reader at this level can't reasonably attempt; no problematic content.
- [ ] **Counts** — the batch raises the category to the intended `required_now`, and `required_now ≤ v1_target`.
- [ ] **Validator green** — `pnpm content:validate` passes on the final batch (referential integrity + manifest gate + immutability off `main`).

### Provenance

Pilot content is LLM-generated and human-reviewed; record the QA reviewer in the PR. Long-term the loop converges on hand authoring (or stays LLM-assisted if it proves the better practice) — the validator + human-QA gate is identical either way, so the source of generation can change without changing the bar.

---

## Phase 1 — Kindergarten Units 1–2

### Task 1: Content manifest + validator count gate (TDD)

**Files:** Create `content/manifest.json`; Modify `scripts/content-validate.ts`; Test: `scripts/content-validate.test.ts` (new, or extend existing validator tests).

- [ ] **Step 1 (RED):** Write a validator test asserting that when actual content counts fall **below** the manifest's declared minimums, `content-validate` fails with a clear message; and passes when counts meet/exceed them. Run — confirm RED (no manifest read yet).
- [ ] **Step 2 (GREEN):** Add `content/manifest.json` with **two values per category** so the AC11 anchor cannot be quietly lowered (review finding): a fixed `v1_target` (the full v1.0 numbers — the immutable AC11 end-state) and a `required_now` (the count the validator currently enforces, raised per phase). Extend `content-validate.ts` to `fail(...)` when `actual < required_now`, **and** to fail if any `required_now > v1_target` (so the target can't be edited downward to cheat) and warn how far `required_now` is below `v1_target`. Reuse the existing `readJson`/`fail` helpers and counting over `skills`/`items`/`audio`.
- [ ] **Step 3:** Run `pnpm content:validate` and the validator test — GREEN. Commit `feat(content): add content manifest + validator count gate`.

> `v1_target` is set once to the full v1.0 bar and never lowered; `required_now` starts at the **current** seed counts (so the gate passes) and each authoring task raises it toward `v1_target`. AC11 is fully met when `required_now == v1_target` (end of Phase 2). This keeps the gate hard at every step *and* fixes the AC11 end-state.

### Task 2: Author K Units 1–2 phonics skills + scope/sequence

**Files:** `content/skills.json`, `content/scope-sequence.json`.

- [ ] Author the K U1–2 phonics skills (short vowels + early digraphs/blends per the UFLI scope) with prerequisites; extend `scope-sequence.json` units in teaching order.
- [ ] Raise `manifest.json` phonics-skill count; run `content:validate` (referential integrity + prereq sanity + manifest gate). Human QA pass. Commit.

### Task 3: Author heart words, decodable words, fluency sentences (LLM pipeline + QA)

**Files:** `content/items/seed.json` (or split files if it grows large).

- [ ] Generate the K U1–2 heart words (regular/irregular tagged), decodable words, and fluency sentences via the LLM-assisted pipeline against the UFLI scaffold.
- [ ] Validate every batch (`content:validate`: unique IDs, skill references, audio references) + **human QA** for decodability and tagging accuracy. Raise the manifest counts. Commit per category.
- [ ] **If items are split into multiple files** (`content/items/*.json` instead of only `seed.json`): `scripts/content-validate.ts` currently hard-reads `content/items/seed.json`, so split files would silently bypass all count/immutability/reference checks. Update the validator to glob and concatenate every item file **as part of this task** — do not split without it.

### Task 4: Audio playback subsystem + phoneme/digraph assets (ADR-002)

> **Scope note (review finding):** the app has **no audio code today** — `grep` of `app/src` finds no `Audio`, `speechSynthesis`, or `audio_id` usage. The content references `audio_id`s and the validator checks them, but nothing ever plays. So this task **builds the playback layer from scratch**, it is not "wiring." Given the size, consider splitting it into its own sub-plan/epic; it is the single biggest piece of 002e and the highest implementation risk (ADR-002).

**Files:** `content/audio/manifest.json` (+ schema), audio assets under `content/audio/`, new app audio module (e.g. `app/src/audio/`), drill/card components, `scripts/content-validate.ts` (audio schema).

- [ ] **Manifest schema:** the current entry shape is `{ audio_id, tts_fallback? }` with **no asset path**. Add a source field (e.g. `src` / file path) for real assets; keep `tts_fallback: true` entries for word/sentence TTS. Extend `content-validate.ts` to require a resolvable `src` for non-TTS entries.
- [ ] **Build the app audio layer (net-new):** a module that, given an `audio_id`, plays the recorded asset if present, else falls back to the **Web Speech API (`speechSynthesis`)** for words/sentences. All playback is **gesture-initiated** (tap handler) to satisfy iOS Safari autoplay rules. Unit-test the asset-vs-TTS selection.
- [ ] Produce/source the K-relevant phoneme + digraph assets; add manifest entries with `src`. Raise manifest audio coverage.
- [ ] Pilot-device QA on the ADR-002 matrix (iPadOS Safari primary; desktop/mobile Chrome/Safari): real-device gesture playback + TTS availability/quality. Commit.

### Task 5: Phase 1 verification gate

- [ ] `pnpm content:validate` (manifest gate green for K U1–2) · `pnpm -r typecheck && pnpm -r test` · app build.
- [ ] **Update the tests that expanded content will break (deterministic, not "if"):** `api/src/scheduler/planner.test.ts` asserts the **exact** 4-skill K list (`["pa_k_u1_blend_two_sound", …]`) and `api/src/routes/practice.test.ts` asserts K card ordering/counts — both change when K U1–2 content lands. Update these assertions to match the new ordered set (and the daily-plan cap once item counts exceed it). Add coverage where the larger set introduces new ordering behavior.
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

## Review revisions (2026-06-07 — independent Sonnet review; see `.agents/snapshots/plans-002d-h-adversarial-review-2026-06-07.md`)

Apply these during implementation (accepted findings):

- **Test fixtures (IMPORTANT):** expanding K content breaks more than the card-list assertion — the `allPassed` fixtures in **both** `api/src/scheduler/planner.test.ts` and `api/src/routes/practice.test.ts` hardcode the 4 K skills and drive the terminal-reason tests. Task 5 must enumerate **all** K skills in both fixtures, or those tests silently stop verifying the "all K review-passed" condition.
- **Audio count gate (IMPORTANT):** a numeric `audio` count is satisfied by TTS-fallback entries, which would violate ADR-002's real-asset requirement. The audio `required_now` must count **only entries with a real `src`**, and Task 4's `src` schema must land **before** the audio count is raised in Task 1.
- **Validator split = precondition (was buried in Task 3):** `scripts/content-validate.ts` hard-reads `content/items/seed.json` (and again in the immutability check). Treat "if items are split, update the validator to glob all item files" as a Task 1 precondition guarded before authoring at volume.
- **`v1_target` immutability:** enforce it via the existing `checkImmutability` origin/main pattern (fail if `v1_target` on HEAD < on `origin/main`), so it can't be lowered to meet `required_now`.
- **Audio phasing:** state explicitly how many of the 56 phoneme/digraph assets are required in Phase 1 (K-relevant subset) vs Phase 2 — set the audio `required_now` accordingly.
- **From ADR-002 (carry into Task 4):** handle the Web Speech **voice-load race** (`speechSynthesis.onvoiceschanged`, async enumeration, no guaranteed iPadOS English voice) and make **audio-asset licensing** a blocking checklist item before the bar is "done."

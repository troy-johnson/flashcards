# Reader's Way v1.0 Content Bar Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: the project's TDD workflow for code changes (validator), and content QA passes for authored data. Steps use checkbox (`- [ ]`) syntax. This plan is **phased** — Phase 1 (K Units 1–2) is the shippable first slice; Phase 2 (1st-grade Unit 1) is a documented follow-on.

**Goal:** Author the Phase A v1.0 content bar (decoding, heart words, fluency, recorded instructional sounds, and grapheme-pattern mappings) and make the acceptance bar binary via a content **manifest** enforced by the content-validate script.

**Architecture:** Instructional content stays in `content/` as validated data (per planning-nit 1's scope boundary — brand chrome lives in `packages/copy`, never here). Add `content/manifest.json` declaring per-category target counts; extend `scripts/content-validate.ts` to fail when actual content is below the manifest (AC12 gate making AC11 binary). The scheduler already consumes `content/skills.json`, `content/scope-sequence.json`, and `content/items/seed.json`. Audio follows **ADR-002**: 44 real UFLI-aligned instructional recordings, 12 separately validated sound–spelling mappings, text-driven whole-item TTS, deterministic runtime indexes, and gesture-initiated playback.

**Tech Stack:** JSON content files, `scripts/content-validate.ts` (tsx), Vitest where logic exists, scheduler (`api/src/scheduler/`), app drill UI.

**Resolves:** Spec 002 FR16–FR18 / AC11–AC12. Beads epic `rw-1gz.8` (tasks `.8.1`–`.8.4`). Audio strategy: ADR-002.

## Decisions (embedded — no separate decisions doc)

- **Phasing (C-scope):** Phase 1 = **K Units 1–2**; Phase 2 = **1st-grade Unit 1**. AC11 (full v1.0 bar) is *partial* until Phase 2; the manifest is raised to the full v1.0 counts when Phase 2 lands.
- **Audio (C2 / ADR-002):** 44 recorded instructional sound targets + 12 validated grapheme-pattern mappings; text-driven TTS fallback for words/sentences; gesture-initiated playback; device QA on iPadOS Safari + desktop/mobile Chrome/Safari.
- **Authoring (C9 / FR17):** **pilot = LLM-assisted** generation against a UFLI-style scaffold → `content-validate` → human QA pass. **Long-term = hand authoring** (revisit if LLM proves best practice). Every generated batch passes the validator and a human review before merge. **Full loop, ID/prefix conventions, and QA checklist:** see [Content Authoring Pipeline](#content-authoring-pipeline-c9--fr17) below.
- **Manifest counts (C1):** the manifest is the single source of truth for "complete." Phase 1 declares the K U1–2 targets; Phase 2 raises to the full v1.0 bar. Illustrative targets below; finalized in the manifest during authoring against the UFLI scope.

| Category | Phase 1 (K U1–2) target | Full v1.0 (after Phase 2) |
|---|---|---|
| Phonics skills | ~6–8 | ~12 |
| Heart words (regular/irregular tagged) | ~25–30 | ~50 |
| Decodable words | ~120 | ~200 |
| Fluency sentences | ~18 | ~30 |
| Recorded sound targets | K-relevant subset | 44 UFLI-aligned recordings |
| Grapheme-pattern mappings | K-relevant subset | 12 required mappings |
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
| `recorded_sound_targets` | `content/audio/sounds.json` | Valid sound definition **and** real approved playback asset |
| `grapheme_pattern_mappings` | `content/audio/patterns.json` | Valid mapping whose sound references all resolve |

Suggested ID shape: `<prefix>_<grade>_<unit>_<slug>` (e.g. `phonics_k_u1_short_a_cat`, `heart_k_u1_the`, `fluency_k_u1_cat_sat`). IDs are **immutable post-ship** — the validator's `checkImmutability` fails any branch that drops or renames a shipped `skill_id`/`item_id` without `deprecated: true`. Never reuse or rename; add new IDs.

### The loop (per unit, per category)

1. **Select scope.** Pick the unit + target skill(s) from the UFLI-style scope/sequence. List the graphemes/skills taught **at or before** this unit — this is the decodability budget for the batch.
2. **Build the scaffold prompt.** Give the LLM: the target skill, the allowed-grapheme budget (step 1), the exact JSON shape (fields below), the required ID prefix, the batch size needed to raise `required_now`, and the rule that decodable words may use **only** allowed graphemes (heart/irregular words are the sole exception and must be tagged).
3. **Generate a batch** in the exact JSON shape, appended to the right file (`skills.json`, `scope-sequence.json`, or `items/seed.json`).
4. **Validate:** `pnpm content:validate`. Fix every failure (unique IDs, skill/audio references, first-unit prereq containment + no-later-grade prereqs, prefix → count, manifest gate). The gate is hard; the batch is not done until it's green. Note: cross-unit prerequisite **ordering** is *not* checked here — that's a manual QA item (see checklist below).
5. **Human QA pass** against the checklist below. Reject and regenerate items that fail — do not hand-patch silently past a QA failure.
6. **Raise `manifest.json` `required_now`** for the category to the new count (never above `v1_target`; `v1_target` is immutable and never lowered). Re-run `content:validate` so the higher gate is enforced.
7. **Commit per category** (e.g. `content(k-u1): author heart words batch 01`). One category per commit keeps QA and review reviewable.

> **Ordering preconditions** (from Task 1 review): if items are split beyond `seed.json`, the validator must glob all item files **before** authoring at volume (it currently hard-reads `seed.json`). For audio, migrate the manifest to schema v2 with independent `recorded_sound_targets` and `grapheme_pattern_mappings` categories before either `required_now` value is raised.

### Item JSON shapes (from current seed)

- **PA/blend skill item:** `{ item_id (pa_*), skill_id, prompt, answer }`
- **Decodable word:** `{ item_id (phonics_*), skill_id, text, speech_text? }`
- **Heart word:** `{ item_id (heart_*), skill_id, text, regular_parts[], irregular_parts[], speech_text? }`
- **Fluency sentence:** `{ item_id (fluency_*), skill_id, text, speech_text? }`
- **Sound definition:** canonical metadata in `content/audio/sounds.json`; asset and review records are checksum-bound.
- **Pattern mapping:** canonical mapping in `content/audio/patterns.json`; one pattern may map to one sound, multiple variants, or an ordered sequence.
- **TTS override:** optional `speech_text` lives only on the content item it overrides; ordinary items speak `speech_text ?? text`.

### Human QA checklist (every batch, before merge)

- [ ] **Decodability** — each decodable word uses only graphemes/skills taught at or before its unit; no untaught patterns leak in. Heart/irregular words are the only exception **and** are tagged.
- [ ] **Heart-word tagging** — `regular_parts` / `irregular_parts` correctly split the word; the irregular part is the genuinely irregular grapheme→phoneme correspondence (not just "hard").
- [ ] **Skill mapping** — each item's `skill_id` is the skill it actually practices, and that skill exists in `skills.json`.
- [ ] **Scope / prerequisite order (manual — not validator-enforced)** — confirm every prerequisite skill appears in an **earlier** `scope-sequence.json` unit than the skill that depends on it. The planner schedules **directly in scope-sequence order** (`api/src/scheduler/planner.ts`), so a dependent placed before its prerequisite ships a broken teaching sequence while `content:validate` stays green. The validator only checks two narrow things here — first-unit prereqs are contained in that first unit, and no prereq comes from a later grade; it does **not** compare unit positions within a grade. Ordering across units is your responsibility (or extend the validator with a cross-unit ordering check before authoring at volume).
- [ ] **Audio/TTS QA** — every mapping resolves to canonical sounds; TTS words/sentences pronounce correctly; add `speech_text` overrides for homographs or poor synthesis.
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

### Task 4: Audio playback subsystem + instructional sound assets (ADR-002)

> **Scope note (review finding):** the app has **no audio code today** — `grep` of `app/src` finds no `Audio`, `speechSynthesis`, or `audio_id` usage. The content references `audio_id`s and the validator checks them, but nothing ever plays. So this task **builds the playback layer from scratch**, it is not "wiring." Given the size, consider splitting it into its own sub-plan/epic; it is the single biggest piece of 002e and the highest implementation risk (ADR-002).

**Files:** `content/audio/sounds.json`, `patterns.json`, generated `manifest.json`, item `speech_text` overrides where required, selected masters/playback assets under `content/audio/`, generation/processing scripts, new app audio module, drill/card components, protected catalog API/UI, `content/manifest.json`, and `scripts/content-validate.ts`.

- [ ] **Inventory gate:** finalize the exact 44-row UFLI-aligned recording sheet and 12-row mapping sheet from `docs/research/2026-06-21-audio-inventory-and-architecture-research.md`. Record dialect decisions, phonetic manner, instructional production behavior, and review rationale. Seek SLP approval before recording; if unavailable, record the explicit beta-risk acceptance and retain the post-recording approval gate.
- [ ] **Phase 0 TTS device spike:** make this the first phase of the implementation plan. On a real iPad, verify first tap after reload, empty/delayed voice enumeration, cancellation, errors, selected English voice, and whether playback remains gesture-authorized. Record device, OS, browser version, and date. The result blocks final TTS implementation, not plan authorship.
- [ ] **Schema-v2 migration (TDD):** replace `phoneme_digraph_audio` with independent `recorded_sound_targets` (44) and `grapheme_pattern_mappings` (12) without weakening general `v1_target` immutability. Canonical audio inputs are `sounds.json` and `patterns.json`; generated output is deterministic. TTS overrides live only as item `speech_text`.
- [ ] **Canonical/runtime ownership:** generated `content/audio/manifest.json` contains only public runtime IDs, origin-root URLs, and hashes. It never preserves undeclared old entries. Operational review notes remain server-only.
- [ ] **Whole-item TTS:** practice speaks `speech_text ?? text`, not an `audio_id`. Remove ceremonial TTS IDs. Never send student identifiers or user-entered child text to TTS.
- [ ] **Recording/processing spike:** compare WAV, AAC, Opus, and MP3 on representative stop, fricative, affricate, nasal, and vowel clips. Set measurable duration, silence, peak, clipping, encoded-size, and intelligibility thresholds before selecting the browser codec.
- [ ] **Record/process:** capture multiple 48 kHz/24-bit mono takes with the documented DJI capture chain; select one master per target; process deterministically; commit selected masters and one set of playback encodes. Raw takes remain outside Git. If pre-recording SLP review is unavailable, recording and protected-catalog QA may proceed under explicit risk acceptance, but learner-facing use remains blocked until checksum-bound SLP approval.
- [ ] **Checksum-bound review:** approval records include reviewer, timestamp, guidance checksum, master SHA-256, and playback SHA-256. Any relevant change invalidates approval.
- [ ] **Build/CI integration:** stage playback files into `app/public/audio` during prebuild, cleaning stale files first. CI checks generation, content validation, app build, final `dist/audio` count, URLs, and hashes. Do not commit duplicate playback files in both content and app directories.
- [ ] **Build the app audio layer (net-new):** recorded playback resolves known sound IDs; TTS speaks card text. New playback cancels prior playback. Failures never score, advance, or block a card.
- [ ] **Protected production catalog:** add a server-authorized `/guardian/audio-catalog` endpoint and SPA route using the existing `DIAG_GUARDIAN_EMAIL` gate. Public frontend data excludes internal review notes.
- [ ] **Accessibility/privacy/device QA:** cover accessible names, focus/busy state, VoiceOver, headphones/Bluetooth, mute/volume, slow/offline failures, exact browser versions, and TTS remote-processing disclosure. Verify iPadOS Safari first, then desktop/mobile Chrome and Safari.

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
| FR16 audio + TTS fallback | K sound/mapping subset + TTS | 44 recorded targets + 12 mappings |

## Self-review notes

- **AC11 binary:** the manifest + validator count gate makes "the content bar exists" pass/fail (resolves adversarial #8).
- **Audio risk:** ADR-002 + gesture-initiated playback + device QA matrix (resolves adversarial #11).
- **Scope boundary:** instructional content stays in `content/`; no brand strings move here (planning-nit 1).
- **Scheduler:** no K scheduler change needed; Phase 2 verifies 1st-grade integration + the terminal_reason transition (C10).
- **Authoring provenance:** LLM-for-pilot with validator + human QA gates; long-term hand-authoring noted (C9).

## Review revisions (2026-06-07 — independent Sonnet review; see `.agents/snapshots/plans-002d-h-adversarial-review-2026-06-07.md`)

Apply these during implementation (accepted findings):

- **Test fixtures (IMPORTANT):** expanding K content breaks more than the card-list assertion — the `allPassed` fixtures in **both** `api/src/scheduler/planner.test.ts` and `api/src/routes/practice.test.ts` hardcode the 4 K skills and drive the terminal-reason tests. Task 5 must enumerate **all** K skills in both fixtures, or those tests silently stop verifying the "all K review-passed" condition.
- **Audio count gate (IMPORTANT):** recordings and mappings are independent deliverables. Schema v2 uses `recorded_sound_targets` and `grapheme_pattern_mappings`; never add them into one count.
- **Validator split = precondition (was buried in Task 3):** `scripts/content-validate.ts` hard-reads `content/items/seed.json` (and again in the immutability check). Treat "if items are split, update the validator to glob all item files" as a Task 1 precondition guarded before authoring at volume.
- **`v1_target` immutability:** enforce it via the existing `checkImmutability` origin/main pattern (fail if `v1_target` on HEAD < on `origin/main`), so it can't be lowered to meet `required_now`.
- **Audio phasing:** state explicitly how many of the 44 recordings and 12 mappings are required in each phase; raise each `required_now` independently.
- **From ADR-002 (carry into Task 4):** handle the Web Speech **voice-load race** (`speechSynthesis.onvoiceschanged`, async enumeration, no guaranteed iPadOS English voice) and make **audio-asset licensing** a blocking checklist item before the bar is "done."

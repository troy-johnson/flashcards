# Audio Assets and Playback Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Deliver 44 approved UFLI-aligned instructional sound recordings, 12 validated grapheme-pattern mappings, gesture-initiated whole-item TTS, and a protected production audio-review catalog.

**Architecture:** Canonical audio data lives in `content/audio/sounds.json` and `content/audio/patterns.json`; item-level `speech_text` is the sole TTS pronunciation override. Deterministic scripts validate/process media and generate a public runtime manifest, while protected review metadata is served by the authenticated API. Playback is output-only and cannot score, advance, or block practice.

**Tech Stack:** TypeScript, Node 24, `tsx`, Vitest, React 19, Hono, Cloudflare Workers, Vite, Web Speech API, HTML audio, `ffmpeg`/`ffprobe`, SHA-256.

## Global Constraints

- Follow TDD: observe RED before production code for every behavior change.
- Keep playback, microphone capture, recognition, score proposal, guardian confirmation, and mastery persistence separate.
- Record exactly 44 UFLI-aligned instructional sound targets; validate exactly 12 grapheme-pattern mappings.
- Treat the 44 as an instructional inventory, not a universal English phoneme count.
- `content/audio/sounds.json` and `content/audio/patterns.json` are canonical; generated files preserve no undeclared data.
- Item-level `speech_text` is the only TTS pronunciation override.
- Every browser playback URL is origin-rooted under `/audio/`.
- Never send student identifiers, names, or user-entered child text to TTS.
- Recording and protected-catalog QA may proceed without pre-recording SLP review only under explicit risk acceptance.
- No recorded clip is learner-facing until checksum-bound SLP approval covers the current guidance, master, and playback bytes.
- Use the existing `DIAG_GUARDIAN_EMAIL` gate; do not add a general admin-role system.
- Do not commit raw takes or duplicate playback files under both `content/` and `app/public/`.
- PR creation is allowed when requested during execution; merging always requires explicit per-PR user confirmation.

---

## File Structure

### Canonical content

- Create `content/audio/sounds.json` — 44 sound definitions, paths, hashes, and reviews.
- Create `content/audio/patterns.json` — 12 grapheme mappings referencing sound IDs.
- Generate `content/audio/manifest.json` — public IDs, `/audio/...` URLs, and hashes only.
- Create `content/audio/masters/.gitkeep` — selected lossless masters land here later.
- Create `content/audio/playback/.gitkeep` — single committed set of browser encodes.
- Modify `content/manifest.json` — schema v2 and independent 44/12 gates.
- Modify `content/items/seed.json` — remove three legacy TTS IDs; add `speech_text` only where QA requires it.

### Scripts and validation

- Create `scripts/audio-schema.ts` — shared types, parsing, subject-hash computation, and public-manifest projection.
- Create `scripts/audio-manifest.ts` — deterministic manifest generation/checking.
- Create `scripts/audio-process.ts` — `ffprobe` validation and deterministic media processing.
- Create `scripts/audio-stage.ts` — clean and stage committed encodes into `app/public/audio`.
- Create `scripts/audio-schema.test.ts`, `scripts/audio-manifest.test.ts`, and `scripts/audio-process.test.ts`.
- Modify `scripts/content-validate.ts` and `scripts/content-validate.test.ts`.
- Modify root `package.json` — audio commands and composed validation/build commands.

### API and app

- Modify `api/src/scheduler/content.ts` — carry optional `speech_text`.
- Modify `api/src/scheduler/planner.ts` — expose optional `speech_text` in cards.
- Modify scheduler/route tests for the additive field.
- Create `api/src/routes/audio-catalog.ts` and `api/src/routes/audio-catalog.test.ts`.
- Modify `api/src/index.ts` — mount protected catalog endpoint.
- Modify `app/src/api/types.ts` and `app/src/api/literacy.ts`.
- Create `app/src/audio/playback.ts` and `app/src/audio/playback.test.ts`.
- Modify `app/src/components/cards/PhonicsCard.tsx`.
- Create `app/src/components/cards/PhonicsCard.test.tsx`.
- Create `app/src/routes/AudioCatalogRoute.tsx` and `app/src/routes/audio-catalog.test.tsx`.
- Modify `app/src/App.tsx` and `app/src/App.css`.
- Modify `app/package.json` — prebuild staging.
- Modify `.github/workflows/ci.yml` — app build and staged-asset integrity.

### Evidence and operations

- Create `docs/research/audio-spikes/phase-0-tts-device.md`.
- Create `docs/research/audio-spikes/codec-comparison.md`.
- Create `docs/research/audio-spikes/recording-session.md`.
- Update `docs/research/2026-06-21-audio-inventory-slp-review-packet.md` with reviewer disposition.
- Update `docs/state/workflow-state.md` at each external gate.

---

### Task 1: Phase 0 real-iPad TTS spike

**Files:**
- Create: `docs/research/audio-spikes/phase-0-tts-device.md`
- Modify: `docs/state/workflow-state.md`

**Interfaces:**
- Consumes: Web Speech API behavior on the actual beta iPad.
- Produces: A selected TTS initiation algorithm and exact device evidence used by Task 7.

- [ ] **Step 1: Create the spike evidence sheet**

Use this exact structure:

```markdown
# Phase 0 TTS Device Spike

- Test date:
- Device model:
- iPadOS version:
- Safari version:
- Network state:
- Available English voices at initial tap:
- Did `voiceschanged` fire:

| Scenario | Expected | Observed | Pass |
|---|---|---|---|
| First tap after reload | speech starts from the tap | | |
| `getVoices()` initially empty | safe fallback still starts | | |
| Delayed voice enumeration | no lost activation | | |
| Second tap during speech | prior speech cancels | | |
| `speechSynthesis.cancel()` then speak | new utterance starts | | |
| Voice unavailable | browser default starts | | |
| Airplane/offline mode | local voice works or clear failure appears | | |
| VoiceOver enabled | button and state are announced | | |

## Decision

Selected algorithm:

Rejected algorithms and evidence:
```

- [ ] **Step 2: Run the spike on the target iPad**

Serve the current app or a minimal static probe from a user gesture. Record observations; do not infer behavior from desktop Safari.

- [ ] **Step 3: Set the gate**

If no reliable algorithm starts speech from the first explicit tap, mark TTS implementation blocked and specify the fallback UX. Otherwise record the selected algorithm precisely enough for Task 7.

- [ ] **Step 4: Update workflow state**

Point `docs/state/workflow-state.md` to the spike and state `PASS` or the exact blocker.

- [ ] **Step 5: Commit when repository commit authority is active**

```bash
git add docs/research/audio-spikes/phase-0-tts-device.md docs/state/workflow-state.md
git commit -m "docs(audio): record iPad TTS spike

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

### Task 2: Migrate the content manifest to independent 44/12 gates

**Files:**
- Modify: `content/manifest.json`
- Modify: `scripts/content-validate.ts`
- Modify: `scripts/content-validate.test.ts`

**Interfaces:**
- Consumes: Existing schema-v1 manifest and immutable `v1_target` behavior.
- Produces: Schema-v2 categories `recorded_sound_targets` and `grapheme_pattern_mappings`.

- [ ] **Step 1: Write RED tests for exact schema-v2 categories**

Replace the audio category in test fixtures:

```ts
const validCategories = {
  phonics_skills: { v1_target: 12, required_now: 12 },
  heart_words: { v1_target: 50, required_now: 50 },
  decodable_words: { v1_target: 200, required_now: 200 },
  fluency_sentences: { v1_target: 30, required_now: 30 },
  recorded_sound_targets: { v1_target: 44, required_now: 0 },
  grapheme_pattern_mappings: { v1_target: 12, required_now: 0 }
};
```

Add tests that:

```ts
it("rejects schema v2 when recorded sounds and mappings are combined", () => {
  writeManifest({
    ...validCategories,
    phoneme_digraph_audio: { v1_target: 56, required_now: 0 }
  });
  assert.throws(runValidator, /recorded_sound_targets.*grapheme_pattern_mappings/);
});

it("allows only the explicit schema v1 to v2 target migration", () => {
  // Production content uses schema_version: 2 and replaces the legacy 56 target
  // with immutable targets 44 and 12.
  writeManifest(validCategories, 2);
  assert.match(runValidator(), /\[content-validate\] ok:/);
});
```

- [ ] **Step 2: Run RED**

Run:

```bash
pnpm test:scripts
```

Expected: FAIL because the validator still requires `phoneme_digraph_audio`.

- [ ] **Step 3: Implement schema-v2 manifest types**

Use:

```ts
const MANIFEST_CATEGORIES = [
  "phonics_skills",
  "heart_words",
  "decodable_words",
  "fluency_sentences",
  "recorded_sound_targets",
  "grapheme_pattern_mappings"
] as const;

type Manifest = {
  schema_version: 2;
  phase: "phase_a";
  categories: Record<(typeof MANIFEST_CATEGORIES)[number], ManifestCategory>;
};
```

Implement an explicit migration comparison: prior schema v1
`phoneme_digraph_audio.v1_target === 56` may become exactly `44` and `12`; every other
category remains governed by the existing non-decrease rule.

- [ ] **Step 4: Update production manifest**

```json
{
  "schema_version": 2,
  "phase": "phase_a",
  "categories": {
    "phonics_skills": { "v1_target": 12, "required_now": 12 },
    "heart_words": { "v1_target": 50, "required_now": 50 },
    "decodable_words": { "v1_target": 200, "required_now": 200 },
    "fluency_sentences": { "v1_target": 30, "required_now": 30 },
    "recorded_sound_targets": { "v1_target": 44, "required_now": 0 },
    "grapheme_pattern_mappings": { "v1_target": 12, "required_now": 0 }
  }
}
```

- [ ] **Step 5: Run GREEN**

```bash
pnpm test:scripts
pnpm content:validate
```

Expected: both pass; partial-progress warnings report 0/44 and 0/12 independently.

- [ ] **Step 6: Commit**

```bash
git add content/manifest.json scripts/content-validate.ts scripts/content-validate.test.ts
git commit -m "feat(content): split sound and grapheme coverage gates

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

### Task 3: Add canonical sound and pattern schemas

**Files:**
- Create: `content/audio/sounds.json`
- Create: `content/audio/patterns.json`
- Create: `content/audio/masters/.gitkeep`
- Create: `content/audio/playback/.gitkeep`
- Create: `scripts/audio-schema.ts`
- Create: `scripts/audio-schema.test.ts`
- Modify: `scripts/content-validate.ts`
- Modify: `content/manifest.json`

**Interfaces:**
- Produces:

```ts
export type ProductionBehavior = "clip" | "sustain" | "glide" | "sequence";
export type ReviewStatus = "approved" | "changes_requested";
export function loadAudioSources(root?: string): AudioSources;
export function computeReviewSubject(sound: InstructionalSound): string;
export function validateAudioSources(sources: AudioSources): string[];
```

- [ ] **Step 1: Write RED schema tests**

Tests must assert:

```ts
assert.equal(sources.sounds.length, 44);
assert.equal(sources.patterns.length, 12);
assert.deepEqual(new Set(sources.sounds.map((x) => x.production_behavior)),
  new Set(["clip", "sustain", "glide", "sequence"]));
assert.deepEqual(patternById.mapping_grapheme_qu.sound_ids,
  ["sound_k", "sound_w"]);
assert.deepEqual(patternById.mapping_grapheme_th.sound_ids,
  ["sound_th_unvoiced", "sound_th_voiced"]);
```

Add failure cases for duplicate IDs, unresolved references, wrong behavior, missing dialect
notes, and unknown grapheme mappings.

- [ ] **Step 2: Run RED**

```bash
node --import tsx --test scripts/audio-schema.test.ts
```

Expected: FAIL because the module and canonical JSON files do not exist.

- [ ] **Step 3: Implement exact types and subject hashing**

```ts
export type ReviewRecord = {
  kind: "recorder" | "owner" | "slp";
  reviewer: string;
  reviewed_at: string;
  status: "approved" | "changes_requested";
  subject_sha256: string;
  notes?: string;
};

export type InstructionalSound = {
  sound_id: string;
  instructional_label: string;
  ipa: string;
  example_word: string;
  phonetic_class: string;
  production_behavior: ProductionBehavior;
  production_notes: string;
  dialect_notes: string;
  recording_guidance: string;
  processing_profile: string;
  master_path?: string;
  master_sha256?: string;
  playback_url?: string;
  playback_sha256?: string;
  reviews: ReviewRecord[];
};
```

Compute SHA-256 over stable JSON containing linguistic guidance, production behavior/notes,
processing profile, and current file hashes. Exclude review records themselves.

- [ ] **Step 4: Transcribe the approved 44/12 tables**

Transcribe every row from
`docs/research/2026-06-21-audio-inventory-and-architecture-research.md`. Keep
`master_path` and media hashes absent until media exists. Set `reviews` to an empty array
until review records exist. Use exact IDs from the research artifact. Create empty committed
`content/audio/masters/` and `content/audio/playback/` directories with `.gitkeep` files.

- [ ] **Step 5: Integrate with content validation**

`actualManifestCounts.recorded_sound_targets` counts sound rows that have valid media,
matching hashes, and required learner-release approval. Before media exists it remains 0.

`actualManifestCounts.grapheme_pattern_mappings` counts structurally valid mappings whose
sound references resolve; after this task raise its `required_now` to 12.

- [ ] **Step 6: Run GREEN**

```bash
node --import tsx --test scripts/audio-schema.test.ts
pnpm test:scripts
pnpm content:validate
```

Expected: PASS; mappings report 12/12 and recordings report 0/44.

- [ ] **Step 7: Commit**

```bash
git add content/audio/sounds.json content/audio/patterns.json content/audio/masters/.gitkeep content/audio/playback/.gitkeep scripts/audio-schema.ts scripts/audio-schema.test.ts scripts/content-validate.ts content/manifest.json
git commit -m "feat(audio): add canonical sound and grapheme inventory

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

### Task 4: Generate and stage the public runtime manifest

**Files:**
- Create: `scripts/audio-manifest.ts`
- Create: `scripts/audio-manifest.test.ts`
- Create: `scripts/audio-stage.ts`
- Modify: `content/audio/manifest.json`
- Modify: `package.json`
- Modify: `app/package.json`
- Create: `app/public/audio/.gitignore`

**Interfaces:**
- Produces:

```ts
export type PublicAudioEntry = {
  audio_id: string;
  src: `/audio/${string}`;
  sha256: string;
};

export function projectPublicManifest(sounds: InstructionalSound[]): PublicAudioManifest;
export function checkPublicManifest(): void;
export function stageAudioAssets(): void;
```

- [ ] **Step 1: Write RED deterministic-generation tests**

Assert that only SLP-approved current subjects enter learner-facing `audio`, while pending
sounds may enter an `internal_audio` projection used only by the protected API:

```ts
assert.deepEqual(projectPublicManifest([approved]), {
  schema_version: 2,
  audio: [{ audio_id: approved.sound_id, src: approved.playback_url, sha256: approved.playback_sha256 }]
});
assert.deepEqual(projectPublicManifest([pending]), {
  schema_version: 2,
  audio: []
});
```

Assert rejection of `audio/foo.mp3`, `../foo.mp3`, duplicate URLs, and stale generated JSON.

- [ ] **Step 2: Run RED**

```bash
node --import tsx --test scripts/audio-manifest.test.ts
```

Expected: FAIL because generator functions do not exist.

- [ ] **Step 3: Implement deterministic generation**

Sort by `sound_id`, emit origin-root URLs, append one trailing newline, and support:

```bash
pnpm audio:manifest        # writes content/audio/manifest.json
pnpm audio:manifest:check  # exits nonzero if generated output differs
```

- [ ] **Step 4: Implement clean staging**

`audio-stage.ts` must remove only `app/public/audio/generated`, recreate it, and copy every
checksum-verified playback file declared by the canonical sound inventory while verifying
SHA-256. This includes recorded candidates needed by the protected catalog before SLP approval.
The generated learner manifest remains SLP-gated, so staging a candidate does not make it a
learner-facing release. An empty `content/audio/playback/` directory is a valid no-op before
recorded media exists; staging must still recreate an empty generated directory and complete
successfully.

Use:

```json
{
  "scripts": {
    "audio:stage": "tsx scripts/audio-stage.ts",
    "prebuild": "pnpm --dir .. audio:stage",
    "build": "vite build"
  }
}
```

Stage into `app/public/audio/generated`; retain `.gitignore` with:

```gitignore
generated/
!.gitignore
```

- [ ] **Step 5: Run GREEN**

```bash
pnpm audio:manifest
pnpm audio:manifest:check
pnpm --filter app build
```

Expected: manifest check passes; build passes even with zero approved learner-facing assets.

- [ ] **Step 6: Commit**

```bash
git add scripts/audio-manifest.ts scripts/audio-manifest.test.ts scripts/audio-stage.ts content/audio/manifest.json package.json app/package.json app/public/audio/.gitignore
git commit -m "build(audio): generate and stage runtime assets

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

### Task 5: Replace ceremonial TTS IDs with item `speech_text`

**Files:**
- Modify: `content/items/seed.json`
- Modify: `api/src/scheduler/content.ts`
- Modify: `api/src/scheduler/planner.ts`
- Modify: `api/src/scheduler/content.test.ts`
- Modify: `api/src/scheduler/planner.test.ts`
- Modify: `api/src/routes/practice.test.ts`
- Modify: `app/src/api/types.ts`
- Modify: `app/src/routes/play.test.tsx`

**Interfaces:**
- Produces:

```ts
export type PlanCard = {
  skill_id: string;
  item_id: string;
  text: string;
  speech_text?: string;
};
```

- [ ] **Step 1: Write RED propagation tests**

Create an injected scheduler item:

```ts
{
  item_id: "phonics_test_read",
  skill_id: "phonics_test",
  text: "read",
  speech_text: "reed"
}
```

Assert the planned card includes `speech_text: "reed"` and an ordinary item omits the field.

- [ ] **Step 2: Run RED**

```bash
pnpm --filter api test -- src/scheduler/content.test.ts src/scheduler/planner.test.ts
```

Expected: FAIL because `RawItem`/`PlanCard` do not carry `speech_text`.

- [ ] **Step 3: Implement additive propagation**

Add `speech_text?: string` to raw/scheduler/card/app types and card projection:

```ts
cards.push({
  skill_id: item.skill_id,
  item_id: item.item_id,
  text: item.text,
  ...(item.speech_text ? { speech_text: item.speech_text } : {})
});
```

- [ ] **Step 4: Remove legacy TTS IDs**

Remove the three `audio_id` fields referencing:

- `tts_word_mat`
- `tts_word_the`
- `tts_sentence_sam_sat`

Do not add `speech_text` unless a TTS QA test demonstrates a pronunciation need.

- [ ] **Step 5: Run GREEN**

```bash
pnpm --filter api test
pnpm --filter app test
pnpm content:validate
```

Expected: all pass; no content item references a `tts_` ID.

- [ ] **Step 6: Commit**

```bash
git add content/items/seed.json api/src/scheduler app/src/api/types.ts app/src/routes/play.test.tsx
git commit -m "feat(practice): propagate optional TTS pronunciation text

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

### Task 6: Add the protected audio-catalog API

**Files:**
- Create: `api/src/routes/audio-catalog.ts`
- Create: `api/src/routes/audio-catalog.test.ts`
- Modify: `api/src/index.ts`

**Interfaces:**
- Produces:

```http
GET /guardian/audio-catalog
200 { sounds: ProtectedSoundView[], patterns: GraphemePatternMapping[] }
401 unauthorized
403 forbidden
```

- [ ] **Step 1: Write RED authorization tests**

Mirror existing diagnostic fixtures and assert:

```ts
const unauthenticated = await SELF.fetch("https://api.test/guardian/audio-catalog");
expect(unauthenticated.status).toBe(401);

const forbidden = await SELF.fetch("https://api.test/guardian/audio-catalog", {
  headers: { cookie: "session=s_other" }
});
expect(forbidden.status).toBe(403);

const allowed = await SELF.fetch("https://api.test/guardian/audio-catalog", {
  headers: { cookie: "session=s_diag" }
});
expect(allowed.status).toBe(200);
```

Also assert the allowed response includes review metadata, while no public runtime manifest
contains reviewer names or notes.

- [ ] **Step 2: Run RED**

```bash
pnpm --filter api test -- src/routes/audio-catalog.test.ts
```

Expected: FAIL with route not found.

- [ ] **Step 3: Implement the route**

Reuse `getAuthenticatedGuardian(c)` and the exact diagnostics rule:

```ts
if (!guardian) return c.text("unauthorized", 401);
if (guardian.email !== c.env.DIAG_GUARDIAN_EMAIL) return c.text("forbidden", 403);
```

Import canonical JSON server-side and return protected metadata. Do not proxy media bytes.

- [ ] **Step 4: Mount and run GREEN**

```ts
app.route("/guardian/audio-catalog", audioCatalogRoutes);
```

Run:

```bash
pnpm --filter api test -- src/routes/audio-catalog.test.ts
pnpm --filter api typecheck
```

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add api/src/routes/audio-catalog.ts api/src/routes/audio-catalog.test.ts api/src/index.ts
git commit -m "feat(api): add protected audio review catalog

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

### Task 7: Build the isolated playback service and practice TTS button

**Files:**
- Create: `app/src/audio/playback.ts`
- Create: `app/src/audio/playback.test.ts`
- Modify: `app/src/components/cards/PhonicsCard.tsx`
- Create: `app/src/components/cards/PhonicsCard.test.tsx`
- Modify: `app/src/App.css`

**Interfaces:**
- Produces:

```ts
export type PlaybackRequest =
  | { kind: "recorded"; src: string }
  | { kind: "tts"; text: string };

export type PlaybackResult =
  | { status: "started" }
  | { status: "completed" }
  | { status: "unavailable"; reason: string }
  | { status: "failed"; reason: string };

export type PlaybackController = {
  play(request: PlaybackRequest): Promise<PlaybackResult>;
  cancel(): void;
};
```

- [ ] **Step 1: Write RED service tests from Phase 0 evidence**

Inject `speechSynthesis`, utterance creation, and audio creation. Test:

- first tap starts speech using the Phase 0-safe algorithm;
- second play cancels prior speech/audio;
- preferred English voice selection is deterministic;
- default voice fallback;
- start/error/end events;
- unsupported API returns `unavailable`;
- cleanup removes listeners/timeouts;
- recorded source must start with `/audio/`.

- [ ] **Step 2: Run RED**

```bash
pnpm --filter app test -- src/audio/playback.test.ts
```

Expected: FAIL because the module does not exist.

- [ ] **Step 3: Implement the minimal playback controller**

Do not read student state. Do not expose scoring callbacks. `play()` owns only media output.
Use the Phase 0 algorithm exactly.

- [ ] **Step 4: Write RED card tests**

Render with raw `createRoot` + `act` and assert:

```ts
expect(audioButton.getAttribute("aria-label")).toBe("Hear this word");
audioButton.click();
expect(play).toHaveBeenCalledWith({ kind: "tts", text: "mat" });
```

Test `speech_text` precedence, busy state, accessible error, and that playback failure leaves
Correct/Try again/Skip enabled.

- [ ] **Step 5: Implement the card button**

Add one explicit audio button. Use:

```ts
await playback.play({
  kind: "tts",
  text: card.speech_text ?? card.text
});
```

Playback must not call `onScore`.

- [ ] **Step 6: Run GREEN**

```bash
pnpm --filter app test -- src/audio/playback.test.ts src/components/cards/PhonicsCard.test.tsx
pnpm --filter app typecheck
```

Expected: PASS.

- [ ] **Step 7: Commit**

```bash
git add app/src/audio app/src/components/cards/PhonicsCard.tsx app/src/components/cards/PhonicsCard.test.tsx app/src/App.css
git commit -m "feat(app): add gesture-initiated practice TTS

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

### Task 8: Add the protected production audio-catalog UI

**Files:**
- Create: `app/src/routes/AudioCatalogRoute.tsx`
- Create: `app/src/routes/audio-catalog.test.tsx`
- Modify: `app/src/api/types.ts`
- Modify: `app/src/api/literacy.ts`
- Modify: `app/src/App.tsx`
- Modify: `app/src/App.css`

**Interfaces:**
- Consumes: `GET /guardian/audio-catalog`, `PlaybackController`.
- Produces: `/guardian/audio-catalog`.

- [ ] **Step 1: Write RED API-client and route tests**

Assert:

- loading, 403/error, and ready states;
- all 44 sounds and 12 mappings render;
- one clip plays at a time;
- variant/sequence mappings display referenced sound buttons;
- per-row playback failure does not break other rows;
- internal review metadata appears only after the authorized API response;
- buttons have specific accessible names such as `Play /θ/ as in thin`.

- [ ] **Step 2: Run RED**

```bash
pnpm --filter app test -- src/routes/audio-catalog.test.tsx
```

Expected: FAIL because the client and route do not exist.

- [ ] **Step 3: Implement typed client and route**

Add:

```ts
export const getAudioCatalog = (): Promise<AudioCatalogResponse> =>
  apiFetch<AudioCatalogResponse>("/guardian/audio-catalog");
```

Render status, checksums shortened for display, reviewer/date, and explicit
`SLP approval required before learner use` for pending rows.

- [ ] **Step 4: Wire routing and navigation**

Add `/guardian/audio-catalog` before the generic `/guardian/:studentId` branch and add an
`Audio catalog` link to `GuardianNav`. Unauthorized users see the route's access-denied
state after the API returns 403.

- [ ] **Step 5: Run GREEN**

```bash
pnpm --filter app test
pnpm --filter app typecheck
pnpm --filter app build
```

Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add app/src/routes/AudioCatalogRoute.tsx app/src/routes/audio-catalog.test.tsx app/src/api app/src/App.tsx app/src/App.css
git commit -m "feat(app): add protected audio catalog

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

### Task 9: Run the codec and processing-profile spike

**Files:**
- Create: `docs/research/audio-spikes/codec-comparison.md`
- Create: `scripts/audio-process.ts`
- Create: `scripts/audio-process.test.ts`

**Interfaces:**
- Produces a versioned processing profile consumed by sound review subjects and Task 10.

- [ ] **Step 1: Capture five representative temporary clips**

Use one each: stop `/p/`, fricative `/s/`, affricate `/tʃ/`, nasal `/m/`, vowel `/æ/`.
These are spike files and remain outside Git.

- [ ] **Step 2: Write RED technical-validation tests**

Fixtures must fail on stereo, wrong sample rate, clipping, excessive leading/trailing
silence, and an unsupported profile version.

- [ ] **Step 3: Run RED**

```bash
node --import tsx --test scripts/audio-process.test.ts
```

Expected: FAIL because processing functions do not exist.

- [ ] **Step 4: Implement probe and validation**

Use dependency-injected command execution for `ffprobe`/`ffmpeg`. The script must first
check the binaries and emit:

```text
[audio-process] ffmpeg and ffprobe are required; install them before processing audio
```

- [ ] **Step 5: Compare codecs on target devices**

Encode WAV, AAC, Opus, and MP3. Record:

- browser support;
- start latency;
- audible padding/clicks;
- intelligibility;
- file size;
- measured peak/clipping;
- silence behavior.

Select one codec and exact thresholds in `codec-comparison.md`. Do not choose based only on
file size.

- [ ] **Step 6: Make the profile executable**

Add a named profile such as `rw-isolated-sound-v1` with exact filter and encode arguments.
`audio-process.ts` must apply only that profile and output deterministic filenames.

- [ ] **Step 7: Run GREEN**

```bash
node --import tsx --test scripts/audio-process.test.ts
pnpm test:scripts
```

Expected: PASS.

- [ ] **Step 8: Commit**

```bash
git add docs/research/audio-spikes/codec-comparison.md scripts/audio-process.ts scripts/audio-process.test.ts
git commit -m "feat(audio): define deterministic media processing profile

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

### Task 10: Record, process, review, and release the 44 sound assets

**Files:**
- Modify: `content/audio/sounds.json`
- Add: `content/audio/masters/*.wav`
- Add: `content/audio/playback/*.<selected-codec>`
- Modify: `content/audio/manifest.json`
- Create: `docs/research/audio-spikes/recording-session.md`
- Modify: `docs/research/2026-06-21-audio-inventory-slp-review-packet.md`
- Modify: `content/manifest.json`

**Interfaces:**
- Consumes: approved inventory, processing profile, SLP policy.
- Produces: 44 approved learner-facing runtime entries.

- [ ] **Step 1: Seek inventory approval**

Send the existing SLP packet. Record one disposition:

- approved as written;
- approved with changes;
- needs revision;
- unavailable before recording.

Apply requested inventory changes before capture where possible.

- [ ] **Step 2: Record the capture chain**

In `recording-session.md`, record exact DJI model, receiver, recording device/app, gain,
distance, room, date, recorder consent/provenance, and whether the recorder preserves
cot–caught and wine–whine contrasts naturally.

- [ ] **Step 3: Capture and select takes**

Record multiple sound-only takes. Never coach a merged speaker to manufacture a dialect
contrast; use another qualified speaker or revise the target after SLP decision.

- [ ] **Step 4: Process all selected masters**

```bash
pnpm audio:process --input <approved-takes-directory> --profile rw-isolated-sound-v1
```

Expected: 44 valid masters and 44 playback encodes, or a precise per-sound failure list.

- [ ] **Step 5: Record recorder and owner reviews**

Populate checksum-bound review records. Pending SLP rows remain absent from the public
runtime manifest and available only in the protected catalog.

- [ ] **Step 6: Obtain post-recording SLP approval**

Provide the protected catalog and review packet. For each approved sound, record reviewer,
timestamp, notes, and the current subject hash. Replace and reprocess rejected sounds.

- [ ] **Step 7: Raise learner-facing coverage**

Generate the manifest and set:

```json
"recorded_sound_targets": { "v1_target": 44, "required_now": 44 },
"grapheme_pattern_mappings": { "v1_target": 12, "required_now": 12 }
```

This step is prohibited until all 44 current subjects have SLP approval.

- [ ] **Step 8: Verify**

```bash
pnpm audio:manifest
pnpm audio:manifest:check
pnpm content:validate
pnpm --filter app build
```

Expected: 44 learner-facing audio entries; all checks pass.

- [ ] **Step 9: Commit**

```bash
git add content/audio content/manifest.json docs/research/audio-spikes/recording-session.md docs/research/2026-06-21-audio-inventory-slp-review-packet.md
git commit -m "content(audio): add approved instructional sound set

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

### Task 11: Add CI/build integrity and complete target-device QA

**Files:**
- Modify: `.github/workflows/ci.yml`
- Modify: `package.json`
- Create: `scripts/audio-dist-check.ts`
- Create: `scripts/audio-dist-check.test.ts`
- Create: `docs/research/audio-spikes/device-qa-matrix.md`
- Modify: `docs/state/workflow-state.md`

**Interfaces:**
- Produces a release gate that proves generated data, source assets, app distribution, and
  target-device behavior match.

- [ ] **Step 1: Write RED dist-integrity tests**

Test missing, extra, and hash-mismatched files under a temporary `dist/audio` directory.

- [ ] **Step 2: Run RED**

```bash
node --import tsx --test scripts/audio-dist-check.test.ts
```

Expected: FAIL because the checker does not exist.

- [ ] **Step 3: Implement dist checker**

The checker reads `content/audio/manifest.json`, resolves each `/audio/...` URL under
`app/dist`, verifies count and SHA-256, and rejects extra generated media.

- [ ] **Step 4: Add CI commands**

After `pnpm content:validate`, add:

```yaml
- run: pnpm audio:manifest:check
- run: pnpm --filter app build
- run: pnpm audio:dist:check
```

- [ ] **Step 5: Run full automated gate**

```bash
pnpm lint
pnpm typecheck
pnpm test
pnpm content:validate
pnpm audio:manifest:check
pnpm --filter app build
pnpm audio:dist:check
```

Expected: all pass.

- [ ] **Step 6: Execute manual QA matrix**

Record exact models, OS/browser versions, and date for:

- primary iPadOS Safari;
- macOS Safari;
- desktop Chrome;
- mobile Chrome;
- mobile Safari.

For catalog and practice, verify gesture gating, first play, repeated taps, VoiceOver,
labels, busy/focus state, headphones/Bluetooth, mute/volume, slow/offline failure,
intelligibility, and recovery.

- [ ] **Step 7: Update workflow state**

Map each acceptance criterion to automated or manual evidence. Distinguish:

- software complete;
- recording complete;
- SLP approved;
- target-device verified;
- PR merge-ready.

- [ ] **Step 8: Commit**

```bash
git add .github/workflows/ci.yml package.json scripts/audio-dist-check.ts scripts/audio-dist-check.test.ts docs/research/audio-spikes/device-qa-matrix.md docs/state/workflow-state.md
git commit -m "ci(audio): verify generated and deployed audio integrity

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

## Final Verification and Review Gate

- [ ] Run:

```bash
pnpm lint
pnpm typecheck
pnpm test
pnpm content:validate
pnpm audio:manifest:check
pnpm --filter app build
pnpm audio:dist:check
git diff --check
git status --short --branch
```

- [ ] Verify `content/manifest.json` reports 44/44 recordings and 12/12 mappings.
- [ ] Verify public runtime data contains no reviewer identity or notes.
- [ ] Verify every learner-facing sound has current checksum-bound SLP approval.
- [ ] Run an independent adversarial code/content/device-evidence review.
- [ ] Update `rw-1gz.8.2` with exact evidence; close it only when software, media, approval,
  and device gates are all complete.
- [ ] If authorized, push and open a draft PR.
- [ ] After CI is green, stop and report PR number, checks, review verdict, media/SLP status,
  and device matrix. Do not merge without explicit confirmation for that PR.

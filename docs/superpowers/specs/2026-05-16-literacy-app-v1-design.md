# Literacy App — v1.0 Design

**Date:** 2026-05-16
**Status:** Approved-in-conversation; pending written-spec review
**Scope:** v1.0 (with explicit forward path to v1.1, v1.2, v1.5, v2.0)

---

## 1. Vision & scope

### Vision

An evidence-based literacy practice app for K–2 readers, designed around short daily co-engagement sessions between a guardian (parent in v1.0; teacher in v2.0) and a student. The app handles content sequencing, scoring, and progress; the adult brings presence and encouragement.

### Audience

Co-engagement is the default: a guardian sits with a student during practice. "Solo after setup" is supported but not the design center. Classroom use is a v2.0 product.

### v1.0 scope — in

- **Grades:** Kindergarten and 1st.
- **Pillars covered:** phonemic awareness, phonics/decoding, irregular high-frequency ("heart") words, early fluency.
- **Drill modes:** four (PA, Phonics, Heart Words, Fluency).
- **Learning algorithm:** mastery-keyed scheduler combining spaced retrieval, interleaving, and prerequisite gating.
- **Motivation:** mastery skill-map fills in over time; one calm celebration per real milestone. No streaks, no coins, no avatars, no carnival rewards.
- **Session shape:** daily plan with per-skill targets, clear "you're done" signal, optional bonus round, optional 5-minute focus timer.
- **Devices:** mobile web first; PWA-installable; same codebase Capacitor-wraps as iOS/Android later.

### v1.0 scope — out (deferred)

- **v1.1:** 50-state standards crosswalk + per-state content filter.
- **v1.2:** scope/sequence migrates from JSON to D1 (foundation for in-app curriculum admin).
- **v1.5:** complete recorded audio for all words/sentences; Capacitor wrap for app-store presence.
- **v2.0:** teacher/classroom role; 2nd grade content; vocabulary + early comprehension modes.

### Research grounding

The design follows the National Reading Panel's five-pillar framework, the Science of Reading consensus for systematic explicit phonics, and the cognitive-science literature on spaced retrieval and interleaving (including studies showing efficacy in 4–5-year-olds). Specific design implications:

- PA instruction always pairs sounds with letters (more effective than audio-only PA).
- Phonics is systematic and explicit, following a defined scope/sequence.
- Heart-words instruction marks regular vs irregular parts ("which part is the heart") rather than treating words as pure visual gestalt.
- Sessions are short, distributed across days, and have a clear stop.
- The skill order moves PA → letter-sounds → blending → digraphs → blends → vowel teams → syllable types, cumulatively.

Sources are listed in §11.

---

## 2. System architecture

### Shape

A React + Vite SPA served from Cloudflare Pages, talking to a Cloudflare Workers API (Hono) backed by D1 (SQLite). Content lives as versioned JSON in the repo; audio files live in R2.

### Frontend

- **React + Vite + TypeScript** (strict). Vite chosen over Next.js because the app is authenticated (no SEO), needs to wrap cleanly as a static SPA for Capacitor, and has a small enough surface that Next's opinions cost more than they buy.
- **Routing:** `react-router`.
- **State:** Zustand for app/session state; TanStack Query for server cache.
- **Styling:** Tailwind. Typography uses Lexend (designed for early readers).
- **PWA:** `vite-plugin-pwa` for installability and offline content/audio cache.
- **Audio:** Web Audio API for phonemes; `<audio>` for longer clips.
- **Mic:** `webkitSpeechRecognition` where available, graceful fallback elsewhere.

### Backend

- **Cloudflare Workers + Hono.** Endpoints: auth, student CRUD, attempt logging, plan fetch, progress sync.
- **DB:** Cloudflare D1 (SQLite).
- **Auth:** guardian magic-link via Resend or Cloudflare Email Routing. HttpOnly Secure SameSite=Lax session cookies. No student logins, ever.
- **Static assets:** Cloudflare R2 for audio; Pages for SPA.

### Content as data

- Scope/sequence, skills, items, heart-words, decodable-lists live as JSON in `/content/` in the repo. Diffable, PR-reviewable, no migrations when content changes.
- Audio files in R2, referenced by stable IDs in `/content/audio/manifest.json`.
- DB stores *student activity* (attempts, mastery state, plans). Never content.
- v1.2 migrates the scope/sequence into D1 to enable in-app content editing; the schema shape stays identical.

### Deployment

- GitHub → Cloudflare Pages on push to `main`.
- Workers deployed via `wrangler` from CI.
- Single production environment to start (no staging). A staging/preview environment becomes worth it once breakage would affect users beyond the immediate testers.

### Why this shape

The boundary "content = JSON in repo, activity = D1, audio = R2" keeps each piece independently understandable, cheaply replaceable, and lets curriculum change without DB migrations. The whole stack sits inside Cloudflare's free tier indefinitely at this scale.

---

## 3. Data model

Designed so v2.0's teacher/student model is the *same shape* — `guardian.role = 'teacher'`, students grouped via `classroom_id`. No rename, no migration.

### Naming conventions

- `guardian` — adult role (parent v1.0; teacher v2.0). Appears in URLs and code; UI never displays the literal word "guardian," it shows the person's name.
- `student` — child role. Appears in URLs and code; UI category labels read "Add a student," "Pick a student"; otherwise UI shows the student's first name.
- `classroom` — v2.0 grouping. URL/data only; UI reads "Class."

### Schema (D1 / SQLite)

```sql
guardian (
  id            TEXT PRIMARY KEY,     -- ULID
  email         TEXT UNIQUE NOT NULL,
  role          TEXT NOT NULL,        -- 'parent' | 'teacher' (v2.0)
  display_name  TEXT,
  created_at    INTEGER NOT NULL,     -- epoch ms
  last_seen_at  INTEGER
)

auth_token (
  token_hash    TEXT PRIMARY KEY,     -- hashed, never raw
  guardian_id   TEXT NOT NULL REFERENCES guardian(id),
  expires_at    INTEGER NOT NULL,
  consumed_at   INTEGER
)

session (
  id            TEXT PRIMARY KEY,
  guardian_id   TEXT NOT NULL REFERENCES guardian(id),
  expires_at    INTEGER NOT NULL,
  created_at    INTEGER NOT NULL
)

student (
  id            TEXT PRIMARY KEY,
  guardian_id   TEXT NOT NULL REFERENCES guardian(id),
  classroom_id  TEXT,                 -- NULL v1.0; used in v2.0
  display_name  TEXT NOT NULL,        -- first name; no PII required
  grade         TEXT NOT NULL,        -- 'K' | '1' (v1.0); '2' (v2.0)
  birth_month   TEXT,                 -- optional 'YYYY-MM'
  prefs_json    TEXT NOT NULL,        -- mic, focus timer, scaffolding, state, etc.
  created_at    INTEGER NOT NULL,
  archived_at   INTEGER
)

skill_mastery (
  student_id    TEXT NOT NULL REFERENCES student(id),
  skill_id      TEXT NOT NULL,        -- FK into content JSON
  level         INTEGER NOT NULL,     -- 0 new → 4 overlearned
  streak        INTEGER NOT NULL,
  ease          REAL NOT NULL,
  due_at        INTEGER NOT NULL,
  last_seen_at  INTEGER,
  PRIMARY KEY (student_id, skill_id)
)

item_mastery (
  student_id    TEXT NOT NULL REFERENCES student(id),
  item_id       TEXT NOT NULL,        -- FK into content JSON
  skill_id      TEXT NOT NULL,
  level         INTEGER NOT NULL,
  streak        INTEGER NOT NULL,
  ease          REAL NOT NULL,
  due_at        INTEGER NOT NULL,
  last_seen_at  INTEGER,
  PRIMARY KEY (student_id, item_id)
)

practice_session (
  id            TEXT PRIMARY KEY,
  student_id    TEXT NOT NULL REFERENCES student(id),
  plan_json     TEXT NOT NULL,        -- the generated plan (Section 6)
  started_at    INTEGER NOT NULL,
  completed_at  INTEGER,
  bonus_count   INTEGER NOT NULL DEFAULT 0
)

attempt (                              -- append-only; source of truth
  id                   TEXT PRIMARY KEY,
  practice_session_id  TEXT NOT NULL REFERENCES practice_session(id),
  student_id           TEXT NOT NULL REFERENCES student(id),
  skill_id             TEXT NOT NULL,
  item_id              TEXT NOT NULL,
  result               TEXT NOT NULL,  -- 'correct' | 'incorrect' | 'skipped'
  scoring_source       TEXT NOT NULL,  -- 'parent' | 'mic_auto' | 'mic_then_parent_override'
  duration_ms          INTEGER,
  shown_at             INTEGER NOT NULL,
  scored_at            INTEGER NOT NULL
)
```

### Key decisions

- **`guardian` and `student` from day one** — no rename when v2.0 ships.
- **No content tables.** `skill_id` and `item_id` are FKs into versioned JSON files in v1.0; v1.2 promotes them to DB rows with the same IDs.
- **Mastery split into skill-level and item-level** — the scheduler needs both ("ready to move past short-a?" vs "show 'cat' again today?").
- **Minimal student PII.** First name + grade + optional birth month. No last name, no email, no exact birthday. Keeps COPPA exposure small.
- **`attempt` is append-only** — replayable to recompute mastery if the SRS algorithm changes.
- **ULIDs** for all IDs (sortable by time, no central authority).

---

## 4. Content model & scope/sequence

All content lives in `/content/*.json`, version-controlled and PR-reviewable. v1.2 promotes it to D1 with the same shape.

### File layout

```
/content/
  skills.json
  scope-sequence.json
  scheduler-config.json
  state-curricula.json        # state → typical curriculum adoption
  items/
    phonemes.json
    graphemes.json
    heart-words.json
    decodable-words.json
    fluency-phrases.json
  audio/
    manifest.json             # ID → R2 URL + duration
  VERSION                     # bumped on content changes; invalidates PWA cache
```

### Skill record

```json
{
  "id": "PHON-cvc-short-a",
  "pillar": "phonics",
  "grade_band": ["K", "1"],
  "title": "Short A in CVC words",
  "prerequisites": ["PHON-letter-sound-a", "PA-blend-3-sound"],
  "alignments": {
    "ccss": ["RF.K.3.b"],
    "tx_teks": [],
    "fl_best": []
  },
  "items": ["WORD-cat", "WORD-bat", "WORD-mat", "WORD-pan", "WORD-ham"],
  "mastery_threshold": { "streak": 6, "items_correct_pct": 0.85 }
}
```

`pillar ∈ phonemic_awareness | phonics | heart_words | fluency`. `prerequisites` drives gating — a skill isn't introducible until prereqs are level ≥ 2. `alignments` is empty in v1.0; v1.1 populates it.

### Item record

```json
{
  "id": "WORD-cat",
  "type": "word",
  "text": "cat",
  "phonemes": ["/k/", "/æ/", "/t/"],
  "graphemes": ["c", "a", "t"],
  "audio": {
    "word": "AUDIO-word-cat",
    "phonemes": ["AUDIO-ph-k", "AUDIO-ph-aa", "AUDIO-ph-t"]
  }
}
```

### Heart word record

Models regular vs irregular parts — the modern science-of-reading framing.

```json
{
  "id": "HEART-said",
  "type": "heart_word",
  "text": "said",
  "regular_parts": ["s", "d"],
  "irregular_parts": ["ai"],
  "list_membership": {
    "fry": { "rank": 91 },
    "dolch": { "set": "primer" },
    "ccss_k_examples": false,
    "fundations": { "level": "K", "trick_word": true },
    "wonders": { "grade": "K", "unit": 4 }
  },
  "audio": { "word": "AUDIO-word-said" }
}
```

### State / curriculum filter

`/content/state-curricula.json` maps state → commonly-adopted curricula:

```json
{
  "TX": { "common_curricula": ["fundations", "amplify_ckla"], "standards": "tx_teks" },
  "CA": { "common_curricula": ["benchmark", "wonders"], "standards": "ccss" }
}
```

`student.prefs_json` carries the per-student filter:

```json
{
  "content_filter": {
    "state": "TX",          // optional; null = comprehensive
    "curriculum": null      // optional override
  }
}
```

**v1.0 behavior:** ship a comprehensive master heart-words pool (Fry top 300 ∪ Dolch ∪ CCSS appendix examples ∪ your existing 51 K words). `list_membership` populated for Fry / Dolch / CCSS examples; curriculum-specific fields empty. Default filter = comprehensive; scheduler prioritizes by frequency rank.

**v1.1 milestone:** populate `list_membership` for the 5–10 most-adopted curricula nationally; populate `state-curricula.json` for all 50 states + DC. Then "Settings → My state" actually filters the content pool.

**v1.x extension:** the same filter mechanism applies to phonics scope/sequence (state X teaches digraphs before blends) and decodable lists. Schema is designed for this from day one.

### Phoneme & audio manifest

```json
{
  "id": "PHONEME-aa",
  "ipa": "/æ/",
  "kid_label": "short a",
  "example_word": "cat",
  "common_graphemes": ["a"],
  "audio": "AUDIO-ph-aa"
}
```

```json
{
  "AUDIO-ph-aa":   { "url": "/audio/phonemes/aa.mp3",  "duration_ms": 380 },
  "AUDIO-word-cat":{ "url": "/audio/words/cat.mp3",    "duration_ms": 540 }
}
```

Manifest entries with `"url": null` trigger TTS fallback. Adding recordings later = drop files in R2 + update manifest; zero code change.

### Scope/sequence

```json
{
  "grade_K": {
    "units": [
      { "id": "K-U1", "title": "Letter sounds & syllable blending",
        "skills": ["PA-syllable-blend", "PHON-letter-sound-a", "PHON-letter-sound-m"] },
      { "id": "K-U2", "title": "Short vowels in CVC",
        "skills": ["PA-blend-3-sound", "PHON-cvc-short-a", "PHON-cvc-short-i"] }
    ]
  },
  "grade_1": { "...": "..." }
}
```

Units are *display groupings* for the dashboard's "where in the curriculum?" view. The scheduler operates on individual skills + prerequisites, not on unit boundaries.

### Content sources

- **IPA phoneme inventory:** standard.
- **Skill order:** synthesized from IMSE / Fundations / From Sounds to Spelling skeletons + CCSS K–1 RF standards.
- **Decodable words:** assembled from open lists (Dolch, Fry) + generated CVC/CVCC permutations filtered to real English.
- **Heart words:** existing 51 K list as seed, expanded with Fry 100–300 high-frequency irregulars and 1st-grade additions.
- **Fluency phrases:** hand-written or LLM-drafted + manually reviewed for decodability at each skill level.

---

## 5. Drill modes

All four share a common card shell: word/sound/phrase center, large tap targets at the bottom (guardian: ✓ "got it" / ✗ "try again"; student: 🎤 "say it" when mic is on), audio button, and a "skip" affordance for stuck cards.

### 5.1 Phonemic Awareness

The most research-load-bearing mode. Always pairs sound with letter(s).

- **Isolate:** "Say the first sound in `cat`."
- **Blend:** app plays `/k/ … /æ/ … /t/`, student says "cat." Phoneme cards line up on screen.
- **Segment:** card shows `cat`; student taps each phoneme box and says the sound.
- **Manipulate** (1st grade): "Say `cat` without the /k/."

Boxes on screen show the corresponding grapheme(s) as each phoneme is referenced. Scoring: mic where available, guardian override always. Logged with `scoring_source`.

### 5.2 Phonics / Decoding

- Word appears (e.g., `mat`); student decodes and reads it; guardian or mic scores.
- **Scaffolding toggle** (per-student): tap the word to hear phoneme-by-phoneme audio plus the whole word. Off by default once the student can decode that skill's items unaided.
- **Interleaving:** the scheduler mixes items from the current skill with recently-mastered items.
- **Stuck card:** after one "try again," app plays the word audio + phoneme breakdown; next attempt counts.

### 5.3 Heart Words

The modern, research-aligned version — not pure memorization.

- Word appears with regular parts in one color and irregular ("heart") parts highlighted (`s-ai-d` with `ai` as the heart).
- **First exposure to a new heart word:** short explainer card — "`said` — the `s` and `d` say their normal sounds. The `ai` part is the heart — you have to remember it says /ɛ/."
- Scoring: same as phonics.

### 5.4 Fluency

The "ramp" mode — short decodable phrase or sentence read aloud.

- **Phrase pool:** every fluency item is tagged with the skills it requires. The scheduler only picks phrases the student has the underlying skills for. No "guess from context"; every word is either decodable for that student or a previously-mastered heart word.
- Card flow: sentence appears (optional timer — off by default in K, optional in 1st), student reads aloud, guardian scores **accuracy** (✓/✗) and optionally **smoothness** (smooth / choppy).
- **Mic is not used to auto-score fluency in v1.0** — too unreliable for connected speech with young voices. Guardian always scores fluency.
- **Repeated reading:** "read it again" affordance re-shows the same sentence (research-backed gold standard). Re-reads logged separately.

### Shared card mechanics

- Big audio button (▶) always plays the model pronunciation.
- "I need a minute" pause; doesn't count as wrong.
- ~600 ms breath between cards, then auto-advance — keeps drill flow tight.
- **No sad noises or red flashes on miss.** Quiet "let's try this one again later" microcopy. Item gets resurfaced sooner.
- Bonus round (after plan complete): same modes, scheduler picks from almost-mastered + due-for-review. No new skill introductions in bonus.

---

## 6. Scheduler & learning algorithm

Two layers: per-item SRS decides which specific cards within a skill are due; the skill manager decides which skills are active, frozen, or graduated.

### Per-item SRS (modified SM-2, kid-tuned)

```
Levels: 0 new → 1 learning → 2 practicing → 3 mastered → 4 overlearned

On CORRECT:
  streak += 1
  if level == 0: level = 1, next interval = 1 day
  if level == 1 and streak >= 3: level = 2, next interval = 3 days
  if level == 2 and streak >= 5: level = 3, next interval = 7 days
  if level == 3 and streak >= 3: level = 4, next interval *= ease (capped at 60 days)
  ease *= 1.05 (capped at 2.8)

On INCORRECT:
  streak = 0
  level = max(level - 1, 1)        // never back to 0 once seen
  next interval = 1 day            // surface tomorrow, not today
  ease *= 0.92 (floor 1.3)

On SKIP:
  no streak change, next interval = 1 day, ease unchanged
```

Two kid-friendly deviations from classical SM-2:

- **One miss never demotes more than one level.** Avoids "lost a week of progress because of a sneeze."
- **Missed items return tomorrow, not later today.** Same-day retry is frustrating; overnight consolidation has stronger evidence for this age.

### Skill manager

A skill **graduates** when 80% of its items are at level ≥ 3 AND the student has ≥ 6 correct attempts on items in that skill across ≥ 2 sessions (forces distributed practice — can't burn a skill in one day).

A skill becomes **active** (introducible) when all its `prerequisites` are at skill-level ≥ 2.

At any time, a student has at most **3 active phonics/PA skills + 1 active heart-words batch + 1 active fluency band**. Caps cognitive load and keeps the scheduler from sprawling.

### Daily plan generation

```
Plan target by grade:
  K: ~8 minutes → 16 cards total
  1: ~10 minutes → 22 cards total

Composition:
  60% items from active skills (new + practicing)
  25% items due for review from mastered/overlearned skills
  15% items missed in the last 1–3 sessions

Within each bucket: pick by max(priority) where
  priority = f(due_at, level, last_seen_at).

Interleaving rule:
  Sort the final list so no two consecutive cards share the same skill_id
  unless the active-skill set is too narrow to allow it.
```

The generated plan is committed to `practice_session.plan_json` at start — reproducible and auditable.

### New skill introduction

When all currently-active phonics/PA skills hit level ≥ 2, the scheduler introduces the next skill from `scope-sequence.json` whose prerequisites are met. New skills enter with 2 starter items that day; no student sees a brand-new skill cold-loaded with 10 unknown items.

### Tunability

All thresholds live in `/content/scheduler-config.json`. The append-only `attempt` table lets us replay history against new parameters and back-test changes before shipping.

### Mastery surfacing

The skill map shows skills as nodes (gray → blue when active → green when mastered). One calm celebration fires when a skill flips to mastered: brief scale-and-fade of the chip. No sounds competing with the audio model. Respects `prefers-reduced-motion`.

---

## 7. App flows & screens

Five route areas. The student never sees guardian UI (and vice versa). URL is the audience cue: `/play/...` is student-mode (locked-down, no nav out); `/guardian/...` is adult-mode.

### Routes

| Route | Audience | Purpose |
|---|---|---|
| `/` | Anon | Landing, one button: "Sign in" |
| `/signin` | Anon | Email → magic link |
| `/guardian` | Guardian | Home: list of students; "Add a student" |
| `/guardian/add-student` | Guardian | First name, grade (K/1), optional birth month, prefs |
| `/guardian/:studentId` | Guardian | Dashboard: skill map, recent sessions, next-up preview |
| `/guardian/:studentId/settings` | Guardian | Mic, focus timer, scaffolding, audio voice, state filter, archive |
| `/play/:studentId` | Student | Plan screen: "Today: 16 things. Tap to start!" |
| `/play/:studentId/drill` | Student | Drill loop (full-screen card) |
| `/play/:studentId/done` | Student | "You're done!" + skill-up summary + Bonus Round button |

The dashboard at `/guardian/:studentId` has three stacked sections on mobile:

1. **Skill map** — grid of skill nodes colored by mastery, grouped by unit. Tap a node → small popover with item-level mastery.
2. **Recent sessions** — last 7 days (completed/abandoned, duration, counts).
3. **Next up** — preview of what tomorrow's plan will likely include.

### In-drill guardian helpers

The drill screen has a small ⚙ icon (tap-and-hold 1 s to open, kid-resistant) that lets the guardian:

- Toggle scaffolding for the current skill
- Skip the current card forever (dialect mismatch, etc.)
- Mute audio
- Re-roll the rest of today's plan

### Visual & accessibility

- One font: **Lexend** (designed for early readers; free).
- Tap targets ≥ 56 pt; everything interactive ≥ 44 pt square (Apple HIG).
- AA contrast minimum; never color-only state.
- `prefers-reduced-motion` respected — celebration animations are skipped.
- Generous whitespace; calm palette.

### What's intentionally not there

- No leaderboard, avatars, customization, or daily streak count.
- No social features.
- No notifications in v1.0 (web push is v1.1, opt-in).

---

## 8. Mic & audio

### Audio output

- **Format:** MP3 96 kbps mono. Phonemes 250–500 ms; words 400–800 ms; sentences ≤ 3 s.
- **Library:** Web Audio API for phonemes (precise timing, preloadable); `<audio>` for longer clips.
- **Preloading:** at plan generation, the app prefetches all audio for that session's items. Eliminates within-session latency on slow connections.
- **Storage estimate:** 44 phonemes + ~20 digraphs + (eventually) ~150 heart words + ~500 decodable words ≈ 5–8 MB. R2 cost effectively zero at this scale.
- **TTS fallback:** `speechSynthesis.speak()` with a curated preferred-voice list per platform (iOS: "Samantha"/"Ava (Enhanced)"; Android: "Google US English"). If no preferred voice exists, the default is used and Settings surfaces a hint about voice quality.
- **Recording spec for future audio:** 48 kHz / 24-bit mono WAV → trim → normalize to −16 LUFS → transcode to MP3 96 kbps via `ffmpeg`. A repo script (`scripts/audio-batch.ts`) batches steps 2–5 from a folder of WAVs.

### Mic input (speech recognition)

- **API:** Web Speech Recognition (`webkitSpeechRecognition`). On-device on Chromium; **audio never leaves the device or traverses our backend**.
- **Browser support matrix:**

| Browser | Status | Behavior |
|---|---|---|
| Chrome desktop | ✓ | Mic-first; guardian override on low confidence |
| Edge desktop | ✓ | Same as Chrome |
| Android Chrome | ✓ | Same as Chrome |
| iOS Safari | ✗ (still inconsistent in 2026) | Falls back to guardian-only; mic toggle hidden |
| Firefox | ✗ | Guardian-only |

- **Confidence flow:**
  ```
  Start recognition →
    transcript matches expected (case-insensitive, ignore punctuation)
      AND confidence ≥ 0.75
        → auto-mark "correct"
    transcript matches expected
      AND confidence < 0.75
        → "Did they say it right?" with ✓/✗ guardian override
    no match
      → "Did they say it right?" with ✓/✗ guardian override
    timeout / no audio after 4 s
      → guardian tap (no penalty)
  ```

- **Logging:** every mic attempt logs `scoring_source` (`mic_auto` or `mic_then_parent_override`) + transcript + confidence — for threshold tuning from real data.
- **Mic permission UX:** asked once per device, deferred until the guardian actively toggles mic on. Never asked at first launch.
- **Fluency mode:** mic is **not** used to auto-score fluency in v1.0 (too unreliable for connected speech with young voices). Guardian always scores fluency.

---

## 9. Repo layout & deployment

### File layout

```
/app/                        # React + Vite SPA
  src/
    routes/                  # react-router
    components/cards/        # PA, Phonics, HeartWord, Fluency
    components/ui/           # Button, Modal, ProgressBar, SkillNode
    drill/
      scheduler.ts           # plan generation + SRS state machine
      mastery.ts             # level/streak/ease updates
      mic.ts                 # speech recognition wrapper
      audio.ts               # web audio + tts fallback
    api/                     # client fetch wrappers
    state/                   # zustand stores
    content/                 # bundled at build from /content/*.json
  index.html
  vite.config.ts
  tailwind.config.ts

/api/                        # Cloudflare Workers (Hono)
  src/
    routes/                  # auth, student, attempt, plan
    db/                      # D1 query layer
    schema.sql               # canonical schema + migrations
  wrangler.toml

/content/                    # versioned JSON content
  skills.json
  scope-sequence.json
  scheduler-config.json
  state-curricula.json
  items/...
  audio/manifest.json
  VERSION

/scripts/
  audio-batch.ts             # WAV → trim → normalize → mp3
  content-validate.ts        # CI: every skill_id / item_id reference resolves
```

### Replacing the existing code

No coexistence, no migration plan. The first PR deletes `index.html`, `app.js`, `styles.css` and scaffolds the new structure. The only salvage is the 51-word K heart-words list, hand-converted into `/content/items/heart-words.json` with the richer schema.

### Cloudflare deployment

- `/app/` → Cloudflare Pages (static SPA, PWA-installable).
- `/api/` → Cloudflare Workers under a subdomain (e.g., `api.<domain>`).
- `/content/audio/*.mp3` (post-record) → R2, fronted by a Workers route.
- Single production environment.

---

## 10. Roadmap

### v1.0 — shippable foundation

Guardian magic-link auth; student profiles (K, 1st); all four drill modes; SRS scheduler with daily plan + bonus + clear "done"; comprehensive heart-words pool (no state filter yet); pre-recorded audio for the 44 phonemes + ~20 digraphs; TTS fallback elsewhere; mic-first scoring where supported; mastery skill-map dashboard; PWA-installable; no streaks/notifications/carnival.

### v1.1 — state crosswalk + UX polish

Populate `list_membership` for 5–10 most-adopted curricula; populate `state-curricula.json` for all 50 states + DC; Settings → State content filter; standards-alignment metadata on skill map; telemetry-driven SRS threshold tuning; opt-in practice reminders.

### v1.2 — scope/sequence to D1

Skills/items migrate from JSON-at-build to D1 (JSON files become the seed/import format). Enables in-app curriculum admin (no code deploy to edit content). Per-student S&S customization (pin/skip a skill).

### v1.5 — full audio + Capacitor wrap

Complete recorded audio for all words and fluency sentences (TTS retired). Capacitor-wrap the same codebase → iOS App Store + Google Play submissions. Native-shell additions: home-screen widgets ("practice today"), haptic feedback on scoring.

### v2.0 — classroom + 2nd grade

Teacher role (`guardian.role = 'teacher'`); classroom grouping; roster management; multi-student dashboard; light reporting (per-student progress, class skill heatmap). 2nd-grade content: advanced vowel teams, syllable types, basic morphology, more complex fluency passages. Vocabulary mode (Tier-2 word cards with picture/sentence context). Early comprehension mode (short decodable passages + 1–2 questions).

### v3.0+ (speculative)

Math practice (separate engine, same SRS/co-engagement framing). Pre-K phonological awareness (rhyme, syllable count). Parent guidance content (light coaching layer).

---

## 11. Sources

**Science of Reading / structured literacy / NRP**

- IES — [Evidence-Based Practices for Teaching Phonological and Phonemic Awareness](https://ies.ed.gov/rel-appalachia/2025/01/main-resource-file-6)
- NWEA — [What the science of reading tells us about decoding, including phonics](https://www.nwea.org/blog/2025/what-the-science-of-reading-tells-us-about-how-to-teach-decoding-including-phonics/)
- PMC — [Explicit Instruction as the Essential Tool for Executing the Science of Reading](https://pmc.ncbi.nlm.nih.gov/articles/PMC9004595/)
- Reading Rockets — [Findings of the National Reading Panel](https://www.readingrockets.org/topics/curriculum-and-instruction/articles/findings-national-reading-panel)
- IMSE — [Orton-Gillingham: Understanding Scope and Sequence](https://journal.imse.com/understanding-scope-and-sequence/)

**Spaced retrieval / interleaving**

- PMC — [Retrieval Practice and Word Learning by Children With Developmental Language Disorder](https://pmc.ncbi.nlm.nih.gov/articles/PMC11087082/)
- Frontiers — [Retrieval practice enhances learning in real primary school settings](https://www.frontiersin.org/journals/psychology/articles/10.3389/fpsyg.2025.1632206/full)

**Educational app design & screen-time for young children**

- PMC — [How educational are 'educational' apps for young children?](https://pmc.ncbi.nlm.nih.gov/articles/PMC8916741/)
- PMC — [Screen time and preschool children: promoting health and development in a digital world](https://pmc.ncbi.nlm.nih.gov/articles/PMC10186096/)

# Adversarial Review (Round 2) — PR #39 (rw-1gz.8.4: grade-1 Unit 1 content + scheduler)

- Date: 2026-06-17
- PR: #39 (DRAFT) — `[codex] Add grade 1 unit 1 content`
- Branch: `plan/rw-1gz-8-4-grade-1-content` @ `d6971a4` (`content: enforce grade 1 decodability`)
- Bead: rw-1gz.8.4
- Author harness: Codex (remediation); Round-1 review: Claude Code; this round: Claude Code (in-thread).
- Predecessor: `.agents/snapshots/rw-1gz-8-4-adversarial-review-2026-06-16.md` — Round 1 verdict BLOCKED (P1) on decodability (F-1..F-4).

## Verdict: PASS — no blockers. Clear to merge on explicit per-PR confirmation.

The remediation took path 2 (expand scope) from the Round-1 writeup: a new
`phonics_1_u1_alphabet_review` skill introduces the previously-untaught consonants
{b,f,h,j,k,l,r,v,w,x,y,z} before any word that uses them, and a machine-checked
decodability gate was added to `content-validate` so the F-1/F-3 defect class can no
longer regress. All four Round-1 findings are resolved in the content, and the count
gate is now satisfied by genuinely in-budget words.

## Round-1 findings — disposition (independently re-audited)

- F-1 (untaught consonants) — RESOLVED. Independent audit replicating the gate's
  cumulative-grapheme logic over `content/items/seed.json`: 0/200 phonics decodables
  use an untaught grapheme. Word->skill assignment respects vowel availability
  (alphabet_review uses only a/o; short_i adds i; short_e_u adds e,u).
- F-2 (blends / ck / digraphs) — RESOLVED in content. Scan for digraphs
  (ch/sh/th/wh/ck/ng/qu), doubled letters, and consonant clusters across all phonics
  items: 0 hits. Content is clean CVC. (See NIT-1: the gate itself does not yet forbid
  this class.)
- F-3 (fluency contamination) — RESOLVED. Every word in all 30 fluency sentences is
  either a cumulative tagged heart word or in-budget decodable: 0 undecodable
  non-heart words.
- F-4 (gates raised on invalid content) — RESOLVED. Live counts: decodable 200,
  heart 50, fluency 30, phonics_skills 12 — all now met with valid, in-budget content.
  required_now == v1_target legitimately. No v1_target regression vs origin/main;
  immutability intact (see below).

## Independently verified

- Decodability gate (`scripts/content-validate.ts`) — walks scope order, accumulates
  graphemes from `content/decodability-map.json`, checks `phonics_*` items fully and
  `fluency_*` words against (cumulative heart words + in-budget decodable). New unit test
  "fails when a decodable word uses graphemes not introduced before its skill" covers it.
- Immutability — origin/main has 12 skills / 86 items (all K). 0 non-deprecated K skill
  or item IDs missing on HEAD; 0 overlapping K item texts changed. The
  phonics_1_u1_mixed_short_vowels -> phonics_1_u1_alphabet_review rename is safe:
  grade-1 was never on main, so the immutability rule does not apply to it.
- Scheduler integration — grade 1 is served grade-1 active content (first card
  phonics_1_u1_alphabet_review), all cards phonics_1_u1_*, terminal_reason undefined
  while active content exists.
- Gates run green: `pnpm content:validate` ok (17 skills, 283 items); validator unit
  tests 9/9; `pnpm -r typecheck` clean; `pnpm -r test` 77/77 (api 61, app 16). PR #39 CI
  green (verify pass, both Workers Builds pass).

## Non-blocking follow-ups

- NIT-1 (gate completeness — file a follow-up before digraph/blend units land). The
  decodability gate models single-letter graphemes only, so it enforces letter
  membership, not true decodability. A word whose letters are each individually taught
  passes even if it contains an untaught digraph or blend (e.g. a future ship/duck/stop
  would pass because s,h,i,p / d,u,c,k / s,t,o,p are taught as singles). Today's content
  is clean so this is not a live defect, but the gate gives weaker protection than
  "enforce decodability" implies, and the single-letter model cannot forbid a cluster of
  already-taught letters. Before rw-1gz.8 introduces digraph/blend units, extend the
  model (declare multi-letter graphemes + a blend/cluster guard) so F-2-class
  regressions are caught by machine, not just by eye.
- NIT-2. The gate is opt-in via existsSync(decodability-map.json); deleting the map
  silently disables the whole check. Low risk (committed + covered by an injected-root
  test), but a stronger design would require the map once any grade-1 content exists.

## Verification commands run

- Independent decodability/count/immutability audit (python over content/, git show
  origin/main:...).
- `pnpm content:validate` -> ok
- `pnpm exec tsx --test scripts/content-validate.test.ts` -> 9/9
- `pnpm -r typecheck` -> clean
- `pnpm -r test` -> 77/77
- `gh pr checks 39` -> green

## Status

- Acceptance criterion "1st-grade U1 content authored + validated" is met (machine gates
  + human decodability audit both pass).
- Per repo merge policy: do not merge without explicit per-PR confirmation for #39. PR
  remains DRAFT pending the owner's call to mark ready + merge.

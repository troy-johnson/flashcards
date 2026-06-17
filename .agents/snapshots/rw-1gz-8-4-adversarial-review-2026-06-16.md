# Adversarial Review — PR #39 (rw-1gz.8.4: grade-1 Unit 1 content + scheduler)

- **Date:** 2026-06-16
- **PR:** #39 (DRAFT) — `[codex] Add grade 1 unit 1 content`
- **Branch:** `plan/rw-1gz-8-4-grade-1-content` (commits `dccddf5`, `90e6575`)
- **Bead:** rw-1gz.8.4 (was closed by the implementing session; reopened by this review)
- **Author harness:** Codex
- **Reviewer note:** In-thread adversarial review by Claude Code. CI is green and all *machine-checked* gates pass — the defects below are exactly the class the automated validator does **not** catch (decodability), which is why human/adversarial QA is a required gate per `docs/plans/002e` lines 51–52, 71.

## Verdict: **BLOCKED (P1)** — do not merge.

The grade-1 Unit 1 decodable words and fluency sentences massively violate the decodability budget. The content bar is *numerically* met only because the count gate is being satisfied with undecodable words.

## What passes (no issues)
- `pnpm content:validate` ok (17 skills, 283 items); `pnpm -r typecheck` clean.
- **Immutability** — machine-checked vs origin/main; no K skill/item IDs removed or renamed (only additions). ✔
- **Grade monotonicity** — scope-sequence is K, K, 1 (the rw-385 check holds). ✔
- **Prereq graph** — grade-1 skills' prerequisites are acyclic and within-grade; no later-unit prereqs. ✔
- **Heart words** — 30 grade-1 heart words, **all tagged** (0 untagged regular/irregular). ✔
- **Manifest counts by prefix** — phonics_skills 12/12, heart 50/50, decodable 200/200, fluency 30/30 all satisfy the gate as counted. ✔ (but see F-1: the decodable count is satisfied with invalid words)

## Findings

### F-1 (P1 BLOCKER) — 71% of grade-1 decodable words use untaught graphemes
The scope-sequence introduces **no new consonants** in grade-1 (1_u1 skills are `short_i`, `short_e_u`, `mixed_short_vowels` — vowels only). The full taught consonant inventory across the *entire* curriculum (K U1 `mstp` + K U2 `ncdg`) is therefore only **{m,s,t,p,n,c,d,g}**, plus vowels {a,e,i,o,u}.

**110 of 155 grade-1 decodable words (71%)** use consonants outside that set:
- by letter (word count): **b×36, k×17, r×17, l×16, h×11, f×8, w×7, j×5, x×5, y×4, z×1, v×1**
- examples: `big, bit, bid, bin` (b); `kid, kit` (k); `rid, rig, rim, rip` (r); `lid, lip, lit` (l); `him, hid, hip, hit` (h); `fig, fin, fit` (f); `win, wig` (w); `jig, jet` (j); `mix, six, fix` (x); `yes` (y); `zip` (z); `vet` (v).

These consonants are never taught anywhere in the current scope, so the words are undecodable at every point in the curriculum. This is the same defect class as **rw-35m** (the K `cat`/`c` P1 blocker) at ~110× the scale.

### F-2 (P1 BLOCKER) — blends, `ck`, and digraphs beyond U1
**19 grade-1 decodables** contain consonant clusters / doubles / digraphs not taught in U1: `kick, pick, lick, sick, brick, click, chick, stick, trick, spill, skill, neck, deck, peck, bell, sell, ...`. Beyond the untaught single consonants, these add `ck`, the `ch` digraph (`chick`), `ll`, and CCVC/CVCC blends — all later-scope patterns.

### F-3 (P1 BLOCKER) — fluency sentences contain undecodable, non-heart words
**~11 of 12** grade-1 fluency sentences include words that are neither decodable in budget nor tagged heart words, e.g.: `kid, run, cub, red, bug, rug, fix, big, bed, help, hop, pick, swim, dock`. A fluency sentence must be composed only of in-budget decodable words + tagged heart words.

### F-4 (P1, compounding) — manifest gates raised to v1 target on invalid content
`required_now` was raised to the v1 ceiling for all non-audio categories (decodable 200/200, heart 50/50, fluency 30/30, phonics_skills 12/12), and the bead close reason claims the v1 content bar is met. But removing the 110 out-of-budget words leaves only ~45 K + ~45 in-budget grade-1 ≈ **~90 valid decodables**, far below 200. The count gate is passing on invalid content, so "v1 target met" is not true. Lowering `required_now` later is blocked by the immutability rule on... (note: `required_now` is *not* immutable — only `v1_target` is — so it can be corrected, but the v1 target itself cannot now be reached without either more in-budget words or scope expansion).

## Root cause
The grade-1 word lists appear to be standard general-purpose grade-1 short-vowel lists, generated without constraining to *this curriculum's* taught grapheme inventory (only 8 consonants, because K U1–U2 introduced only `mstp` + `ncdg`). This is precisely the failure the decodability budget (002e steps 1–2, QA checklist line 71) exists to prevent.

## The underlying design decision (for the author)
The defect can be resolved two ways — this is an author/owner call, not the reviewer's:
1. **Constrain content to the taught budget** (like K U1–2 did). With only 8 consonants + 5 vowels, the *real-word* ceiling for grade-1 U1 is well under 155 — likely ~45–60 — so the decodable v1 target of 200 is **not reachable** from short-vowel content alone. This mirrors the rw-npb finding that 45 was the K ceiling.
2. **Expand the scope first** — add consonant-introduction skills (b,f,h,j,k,l,r,v,w,x,y,z, plus `ck`/digraphs/blends) to the grade-1 scope-sequence *before* the words that use them, then the words become in-budget. This is the larger, more realistic path to a 200-word decodable target and matches how real UFLI-style sequences work.

Either way, **PR #39 as authored cannot merge**: it is internally inconsistent (words use graphemes the scope never teaches).

## Verification commands run
- `pnpm content:validate` → ok (passes; does not check decodability — expected)
- `pnpm -r typecheck` → clean
- Decodability audit (python over `content/items/seed.json`): 110/155 decodables out of budget; ~11/12 fluency sentences contaminated; 30/30 heart words tagged.

## Required follow-up
- Keep PR #39 in draft; **do not merge**.
- Owner decision on path (1) constrain content or (2) expand scope.
- Correct `required_now` to reflect actual in-budget content; do not claim v1 target until real in-budget content reaches it.
- rw-1gz.8.4 reopened; acceptance criterion "1st-grade U1 content authored + **validated**" is not met (human-QA decodability fails).

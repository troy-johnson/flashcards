# Grade 1 Content Sequence Rationale

Date: 2026-06-16

## Purpose

This note records the source constraint for `rw-1gz.8.4`: grade-1 content must be systematic, cumulative, and classroom-sequence-aligned. Numeric manifest counts are not enough; decodable words and fluency sentences must only use graphemes already taught by the local scope sequence, except for tagged heart words.

## Sources

- IES/WWC, *Foundational Skills to Support Reading for Understanding in Kindergarten Through 3rd Grade*.
- UFLI Foundations public scope and sequence.

## Applied Constraint

The first grade-1 unit is a bridge/review unit, not an advanced phonics jump. It introduces the remaining alphabet consonants before short-vowel review:

1. Alphabet/consonant review for the missing consonants after K U1-2.
2. Short-i review.
3. Short-e/u review.
4. Grade-1 heart words.
5. Connected fluency text composed only of cumulative decodables plus tagged heart words.

`content/decodability-map.json` is the machine-readable record of graphemes introduced by each scope skill. `pnpm content:validate` now rejects decodable and fluency items that use graphemes before the scope has introduced them.

## Non-Goals

- This does not copy proprietary lesson text or word lists.
- This does not complete audio coverage; audio remains owned by `rw-1gz.8.2`.

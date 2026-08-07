# PR #226 adversarial review — round 1

Date: 2026-07-26
Target: `plan/rw-1gz-8-2-practice-tts` / commit `d0dc43e`
Profile: code review, high effort

## Review plan

Two independent fresh-context OpenCode reviews through Vercel:

- `vercel/zai/glm-5.2`: correctness, tests, specification alignment, privacy
- `vercel/moonshotai/kimi-k3`: browser TTS lifecycle, cancellation, and UX

## Verification context

- GitHub checks were green: verify and both Cloudflare Workers builds.
- The app suite and app typecheck passed independently during review.
- The current app suite contains 77 tests; the PR and Bead text saying 76 is stale.
- Recorded candidates remain operator-catalog-only. PR #226 exposes browser TTS,
  not recorded clips.

## Raw reviewer outcomes

### GLM 5.2

Verdict: **APPROVED WITH NITS**

No blocker was reported. Its important finding was that TTS completion has no
timeout. `play()` settles only when the browser emits `end` or `error`; if a
browser emits neither, the practice audio button remains busy and disabled.
Guardian scoring remains usable.

GLM also reported incomplete plan coverage:

- no deterministic preferred English voice selection;
- no focused unavailable-browser fallback test;
- no TTS-to-TTS cancellation test;
- no listener/timeout cleanup test;
- no card-level cancel-on-unmount test.

Minor observations included possible state updates after unmount, a potential
cancel-then-speak browser race, no explicit retry-after-failure assertion, dead
`getVoices` plumbing, and the stale test count. Positive findings: scoring is
isolated from playback, recorded clips are not exposed, the implementation is
privacy-safe, and the control has an accessible label, busy state, alert, and
48px target.

### Kimi K3

No verdict was produced. Two fresh-context OpenCode runs using
`vercel/moonshotai/kimi-k3` repeatedly restarted evidence gathering and emitted
the full diff without reaching findings or a verdict. Both runs were stopped.
This is recorded as a reviewer/transport failure, not interpreted as approval.
No substitute model was used.

## Synthesis

Verdict: **APPROVED WITH NITS**

Accepted important finding:

1. `app/src/audio/playback.ts` has no bounded completion path for browser TTS.
   `cancel()` also does not itself settle the in-flight promise. A missing
   `end`/`error` event can therefore leave the current card's audio button
   permanently busy. This does not block scoring or the overall practice flow,
   so it is not a release blocker for the family-and-friends beta, but it is the
   highest-priority hardening change and target-device QA item.

Accepted follow-up coverage gaps:

2. Add tests for unavailable TTS, TTS cancellation/replacement, timeout cleanup,
   unmount cancellation, and retry after failure.
3. Either implement deterministic English voice selection or explicitly amend
   the plan to defer it; the injected `getVoices` dependency is currently unused.

The feature's intended beta scope is otherwise satisfied: words and sentences
receive gesture-initiated whole-item TTS, pronunciation overrides are honored,
failure does not disable scoring, and recorded candidates remain outside the
learner flow.

## Recommendation

PR #226 may merge after the explicit per-PR merge confirmation. Prefer a small
follow-up or pre-merge patch adding a completion timeout and settling cancelled
requests, especially before broader device testing. Do not treat this review as
evidence that Kimi K3 approved the change.

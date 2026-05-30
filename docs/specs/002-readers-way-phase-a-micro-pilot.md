# Spec 002: Reader's Way Phase A Micro-Pilot

**Status:** draft, ready for owner review
**Date:** 2026-05-27
**Owner:** Troy Johnson
**Related artifacts:**
- [001-literacy-app-v1-design](001-literacy-app-v1-design.md)
- [ADR-001: Low-cost transactional email for magic-link auth](../adrs/001-low-cost-transactional-email.md)
- [Adversarial review packet](002-readers-way-phase-a-micro-pilot.adversarial-review.md)

## 1. Summary

Build **Reader's Way Phase A** as a micro-pilot release for the creator's family and a small number of educators and families at the creator's children's school.

The release validates whether the product works as a real home reading routine: short, structured, adult-supported literacy practice for Kindergarten and 1st-grade readers. Phase A prioritizes **routine viability** and **usability**. Educator credibility is still important, but it is treated as a trust/polish check rather than a full school-readiness gate.

Phase A is small in audience but not a throwaway prototype. It should use the working product name **Reader's Way**, build the intended v1.0 literacy content bar, and establish enough operational, privacy, email, and UI quality to support trusted families using real child accounts.

## 2. Goals

G1. Establish **Reader's Way** as the working product name for Phase A while keeping rename/rebrand cost low.

G2. Centralize product and brand copy so visible naming can be changed later without scattered UI rewrites.

G3. Support a free micro-pilot with:
- the creator's family,
- a few educators at the creator's children's school,
- optionally those educators' families if they have Kindergarten or 1st-grade readers.

G4. Provide lightweight guardian onboarding:
- magic-link sign-in,
- add/select child,
- choose current/upcoming grade,
- start practice.

G5. Tailor starting content lightly by grade:
- Kindergarten starts at the beginning of the Kindergarten sequence.
- 1st Grade starts with a brief Kindergarten/early decoding review path that advances quickly when the child succeeds.

G6. Implement branded, trustworthy magic-link email for real pilot use.

G7. Provide pilot-ready polish across all visible app surfaces.

G8. Build the v1.0 content bar for decoding, heart words, and fluency practice.

G9. Add restrained learning-routine telemetry sufficient to understand repeat use, completion, progress, and friction.

G10. Provide basic Privacy Policy and Terms pages appropriate for a small pilot involving children.

G11. Provide a simple public landing page that explains Reader's Way and supports invited pilot conversations.

G12. Use manual account/admin support for pilot edge cases.

## 3. Non-Goals

NG1. No payment collection in Phase A.

NG2. No self-serve account settings area for deletion, email changes, data export, or account recovery.

NG3. No formal placement test.

NG4. No parent-selected reading level beyond Kindergarten vs 1st Grade grade selection.

NG5. No classroom management model.

NG6. No roster import, Clever/ClassLink integration, Google for Education SSO, or district provisioning.

NG7. No school/district procurement package, DPA template, or formal FERPA/COPPA legal packet.

NG8. No pricing page.

NG9. No full marketing site.

NG10. No vocabulary or comprehension expansion for v1.0.

NG11. No gamification layer: no points, streaks, badges, avatars, leaderboards, coins, confetti, or reward economy.

NG12. No broad public launch readiness requirement.

## 4. Product Positioning

Working positioning statement:

> Reader's Way provides short, structured reading practice that helps young readers build calm confidence with a caring adult nearby.

Parent-facing copy should lead with plain language. Educator-facing supporting copy may mention:
- evidence-based phonics,
- decoding,
- heart words,
- fluency,
- structured literacy principles.

Tone must remain:
- calm,
- warm,
- respectful,
- school-credible,
- not cutesy,
- not clinical,
- not game-like.

The product should feel closer to a thoughtful Montessori workbook than to a points-based learning game.

## 5. Pilot Definition

Phase A is a **micro-pilot**, not a beta launch.

### Participants

- Creator's family first.
- A few educators at the creator's children's school.
- Possibly educator families with Kindergarten or 1st-grade readers.

### Timing

- Summer-flexible.
- Not fixed to a 4-6 week window.
- Readiness is measured by meaningful use and feedback cycles rather than strict calendar duration.

### Success Priorities

1. **Routine viability**
   - Families can fit practice into real home life.
   - Sessions feel repeatable without gamified pressure.
   - Adult-child co-engagement feels natural.

2. **Usability**
   - Adults can sign in, add/select child, start practice, and understand progress.
   - Children can complete drills with minimal confusion.
   - Friction points are visible enough to fix before a second-wave pilot.

3. **Credibility / polish**
   - Educators should not see anything that undermines trust.
   - Educator feedback informs polish and future school-readiness.
   - Phase A is not a full classroom validation or formal instructional efficacy study.

## 6. Design Decisions

| ID | Decision | Rationale | Consequences |
| --- | --- | --- | --- |
| D1 | Use **Reader's Way** as the working product name. | It is child-sayable, warm, progress-oriented, and not locked to flashcards or a single linear path. | The name is not final; implementation must keep copy centralized to allow later rename. |
| D2 | Centralize brand and product copy in design tokens or copy variables. | The working name may change after pilot feedback or trademark/domain review. | UI, email, landing, and onboarding copy should avoid hard-coded repeated brand strings where practical. |
| D3 | Run Phase A as a free micro-pilot. | The initial group is the creator's family and a few trusted educators/families; learning and usability signal matter more than payment friction. | Payment, pricing, and subscription UX are deferred until a broader second wave or launch path. |
| D4 | Keep future monetization paths parallel. | Family subscription and educator/school licensing are both plausible, and Phase A should gather signal for both without choosing too early. | Public pricing and procurement artifacts are deferred; landing copy should not overcommit to one revenue model. |
| D5 | Ask only for current/upcoming grade during onboarding. | Kindergarten vs 1st Grade gives useful tailoring without the friction of placement testing. | Some children may be over- or under-placed; trusted pilot context allows manual adjustment if necessary. |
| D6 | Start 1st graders with a brief review path that advances quickly. | This avoids over-placement while reducing the risk of boring review. | Scheduler/content logic must support a short review ramp for 1st-grade students. |
| D7 | Include basic Privacy Policy and Terms in Phase A. | Child data is involved even in a tiny trusted pilot. | Legal copy can be plain-language and lightweight, but cannot be skipped. |
| D8 | Use branded trust email rather than minimal dev-style email. | Magic-link email is a trust surface for parents and educators. | Email copy should include product name, sign-in purpose, expiration, and ignore-if-unrequested language. |
| D9 | Target pilot-ready whole-app polish. | Even trusted pilot users should not feel they are using a broken prototype. | All visible pilot screens need coherent responsive styling, accessible states, empty states, and error states. |
| D10 | Build the full v1.0 content bar for Phase A. | The audience is small, but the instructional promise should be real enough for repeated summer use. | Content work is a significant Phase A requirement; validation tooling remains a release gate. |
| D11 | Use restrained learning-routine telemetry. | Phase A needs evidence about usage, completion, progress, and friction without surveillance-style analytics. | Track session/progress summaries, not granular clickstream data. |
| D12 | Use manual support for account/admin operations. | Pilot participants can surface issues directly, and self-serve settings are not worth the Phase A scope cost. | Privacy/Terms and landing/contact copy must clearly provide a support/contact route. |

## 7. Functional Requirements

### 7.1 Brand and Copy Tokens

FR1. The app must expose centralized copy/config values for at least:
- `productName`: `Reader's Way`,
- short product display text if needed,
- landing headline/subtitle,
- onboarding headline/subtitle,
- magic-link email subject/body product references,
- privacy/contact support display name where practical.

FR2. Pilot-visible UI must reference the centralized product/copy values instead of scattering hard-coded product name strings across components.

FR3. The copy system must allow a future rename without changing core routing, account data, or instructional content data.

### 7.2 Onboarding

FR4. A guardian must be able to sign in with a magic link.

FR5. A guardian must be able to add a child/student profile.

FR6. A guardian must be able to select an existing child/student profile.

FR7. When adding a student, the guardian must select the child's current/upcoming grade from:
- Kindergarten,
- 1st Grade.

FR8. The app must start Kindergarten students at the beginning of the Kindergarten sequence.

FR9. The app must start 1st Grade students on a brief review path covering Kindergarten/early decoding foundations.

FR10. The 1st Grade review path must advance quickly when the student succeeds, rather than forcing a long linear Kindergarten replay.

FR11. Phase A must not include a formal placement test or parent-selected reading level.

### 7.3 Practice Experience

FR12. A guardian/student pair must be able to start a practice session after sign-in and student selection.

FR13. Practice must remain adult-supported in framing and copy.

FR14. Practice must avoid points, streaks, badges, avatars, confetti, coins, leaderboards, or other reward-economy mechanics.

FR15. Completion/progress views must communicate visible mastery/progress without exaggerated praise or game rewards.

### 7.4 Content

FR16. Phase A content must target the v1.0 content bar:
- Kindergarten Units 1-2,
- 1st Grade Unit 1 phonics,
- approximately 12 phonics skills,
- approximately 50 heart words with regular/irregular tagging,
- approximately 200 decodable words,
- approximately 30 fluency sentences,
- audio for 44 phonemes and common digraphs including `sh`, `ch`, `th`, `wh`, `ck`, `ng`, `qu`, `ll`, `ss`, `ff`, `zz`, and `ph`,
- TTS fallback for words and sentences.

FR17. Content authoring should use the approved hybrid approach:
- UFLI scaffold,
- LLM gap-fill,
- validation via content validation script.

FR18. Vocabulary and comprehension content are deferred beyond v1.0.

### 7.5 Magic-Link Email

FR19. Phase A must use a real transactional email sender for pilot magic links.

FR20. Magic-link email must be branded with the working Reader's Way identity.

FR21. Magic-link email copy must clearly state:
- why the recipient is receiving the email,
- how to sign in,
- link expiration or time sensitivity,
- that the recipient can ignore the email if they did not request it.

FR22. The implementation should preserve the provider abstraction from ADR-001.

FR23. Phase A does not require advanced retries, admin email observability, or a full email platform UI.

### 7.6 Landing Page

FR24. Phase A must include a simple public landing page for Reader's Way.

FR25. The landing page must explain:
- what Reader's Way is,
- who it is for,
- short adult-supported reading practice,
- evidence-based phonics/decoding/heart word/fluency focus,
- privacy stance including no ads and no selling data,
- pilot or early-access status,
- contact or waitlist path.

FR26. The landing page must not include public pricing, school procurement claims, or a full marketing-site information architecture.

### 7.7 Privacy and Terms

FR27. Phase A must include basic Privacy Policy and Terms pages.

FR28. Privacy/Terms content must cover:
- guardian accounts,
- child/student profile data,
- practice/session data,
- restrained telemetry,
- email/magic-link usage,
- contact route for account/student deletion and data questions,
- no ads,
- no selling data,
- pilot/early-access status.

FR29. Phase A does not require a DPA template or school procurement legal packet.

### 7.8 Telemetry

FR30. Phase A telemetry must track learning-routine signals with restraint:
- sessions started,
- sessions completed,
- session duration or approximate duration,
- drill completion,
- retry/accuracy summaries,
- progress over time,
- obvious failure/friction points.

FR31. Phase A telemetry must not implement broad surveillance-style granular click tracking.

FR32. Telemetry must support the core Phase A questions:
- Are families actually using this?
- Where do they get stuck?
- Is practice progressing?

### 7.9 UI Polish and Accessibility

FR33. All pilot-visible screens must be coherent, responsive, and accessible enough for trusted pilot use.

FR34. Pilot-visible screens include:
- landing page,
- sign-in,
- magic-link requested/check-email state,
- auth error/expired-link states,
- add/select child,
- grade selection,
- practice start,
- drill flow,
- completion/progress view,
- empty states,
- error states,
- Privacy Policy,
- Terms.

FR35. UI polish must include mobile and desktop sanity checks.

FR36. UI polish must preserve the existing accessibility direction:
- semantic HTML where practical,
- visible focus states,
- keyboard-accessible controls,
- contrast appropriate for WCAG 2.1 AA target,
- reduced-motion awareness,
- screen-reader-friendly status messaging for practice feedback where applicable.

### 7.10 Manual Account/Admin Support

FR37. Phase A must provide a clear contact route for pilot account/admin issues.

FR38. Self-serve account deletion, student deletion, email change, and data export are deferred.

FR39. The operator must be able to handle pilot support requests manually using existing operational/admin access or direct database changes as appropriate for the trusted pilot scale.

## 8. Acceptance Criteria

AC1. Product name references visible to pilot users display **Reader's Way** via centralized copy/config values.

AC2. A future product rename can be performed by changing centralized copy/config values for common app, landing, onboarding, and email surfaces, without searching through unrelated instructional logic.

AC3. A guardian can complete magic-link sign-in with a real transactional sender in a deployed/pilot environment.

AC4. Magic-link email contains Reader's Way branding, sign-in purpose, expiration/time-sensitivity language, and ignore-if-unrequested language.

AC5. A guardian can add a child and select either Kindergarten or 1st Grade.

AC6. Kindergarten students are assigned to the beginning of the Kindergarten sequence.

AC7. 1st Grade students are assigned to a brief review path that can advance quickly after successful performance.

AC8. A guardian can select a child and start a practice session.

AC9. A child can complete a practice session and reach a completion/progress state without encountering gamified reward mechanics.

AC10. No pilot-visible UI includes points, streaks, badges, avatars, coins, confetti-as-reward, leaderboards, or reward-economy language.

AC11. The v1.0 content bar exists in validated content files or assets: K Units 1-2, 1st Grade Unit 1 phonics, approximately 12 phonics skills, approximately 50 tagged heart words, approximately 200 decodable words, approximately 30 fluency sentences, phoneme/digraph audio coverage, and TTS fallback.

AC12. Content validation passes for the Phase A content set.

AC13. A simple Reader's Way landing page exists and includes positioning, audience, privacy stance, pilot/early-access status, and contact/waitlist path.

AC14. Basic Privacy Policy and Terms pages exist and cover the data/support topics listed in FR28.

AC15. Learning-routine telemetry records sessions started/completed, completion/progress summaries, and friction/error signals without broad clickstream tracking.

AC16. Pilot-visible screens listed in FR34 have mobile and desktop sanity coverage.

AC17. Pilot-visible interactive controls are keyboard reachable and have visible focus states.

AC18. Privacy/Terms or app support copy gives pilot users a direct contact route for account deletion, student deletion, email/account changes, and data questions.

AC19. No self-serve account settings area is required to satisfy Phase A.

AC20. Phase A can be used by the creator's family and a few trusted educator/family testers without payment setup.

## 9. Resolved Questions

| Question | Resolution |
| --- | --- |
| What is the working product name? | Reader's Way. |
| Is the name final? | No. Keep copy centralized so it can change later. |
| Is Phase A paid? | No. The initial micro-pilot is free. |
| What happens in a broader second wave? | Free or free-limited with clear paid-later expectation. |
| Which market wedge leads? | Family-first, school-credible. |
| Which revenue model wins? | Unknown. Keep family subscription and educator/school licensing paths open. |
| Who participates in Phase A? | Creator's family, a few educators at the creator's children's school, and possibly those educators' families. |
| Is Phase A fixed to 4-6 weeks? | No. It is summer-flexible and based on meaningful use/feedback cycles. |
| What is the primary pilot evidence? | Routine viability and usability. |
| How important is educator credibility? | Important as polish/trust validation, not the main Phase A gate. |
| Does onboarding include placement testing? | No. Ask only K vs 1st Grade. |
| How do 1st graders start? | Short K/early decoding review path that advances quickly. |
| What telemetry level is allowed? | Restrained learning-routine telemetry, not granular surveillance-style click tracking. |
| What privacy/legal surface is required? | Basic Privacy Policy and Terms. |
| What account management is required? | Manual support only. |
| What marketing surface is required? | Simple landing page only. |
| What content scope is required? | Full v1.0 content bar, with vocab/comprehension deferred. |

## 10. Open Questions for Later Phases

OQ1. What final product name should be used after pilot feedback, domain review, and trademark/common-law search?

OQ2. What family subscription price and packaging should be tested in the second wave or public launch?

OQ3. What small educator/classroom license should be tested before district-level procurement?

OQ4. When should self-serve account deletion, change email, and data export become required?

OQ5. What exact classroom/teacher data model should be introduced after the guardian/student micro-pilot?

OQ6. What formal accessibility audit/remediation evidence should be captured at the end of Phase A?

## 11. Adversarial Review Record

**Packet:** [002-readers-way-phase-a-micro-pilot.adversarial-review.md](002-readers-way-phase-a-micro-pilot.adversarial-review.md)
**Review rounds:** 1 (scope stress test), 2 (doc consistency pass)
**Verdict:** APPROVED WITH NITS

Summary: The spec is coherent and implementable. Round 1 identified three planning nits to carry forward: define the exact centralized-copy file surface, convert "advances quickly" into scheduler/content thresholds, and identify the specific telemetry storage/reporting mechanism. Round 2 verified numbering, cross-references, and internal consistency.

## 12. Scope Control Notes

- Phase A may look broad because it includes content, email, privacy, landing, UI polish, and telemetry. This is intentional: the pilot group is tiny, but they will use real child accounts in a real home routine.
- Public-launch features remain explicitly deferred.
- School-readiness is prepared for through tone, content seriousness, privacy basics, and educator feedback, not through classroom product scope.

# Research Source Registry

This registry is the preferred starting point for Reader's Way educational, speech-language, literacy, and learning-science research.

It is not a bibliography of everything relevant. Each source must support a concrete project claim, state its limits, and be traceable to the artifact that consumes it.

## Governance

### Evidence tiers

| Tier | Evidence type | Appropriate use |
|---|---|---|
| A | Systematic review, meta-analysis, government evidence synthesis, or consensus report with transparent methods | Product requirements, instructional strategy, and high-impact decisions |
| B | Peer-reviewed primary research or major scholarly synthesis | Specific mechanisms, thresholds, populations, and unresolved questions |
| C | Authoritative professional standard, clinical practice portal, technical standard, or research-based curriculum implementation resource | Terminology, implementation details, professional guardrails, and platform behavior |
| D | Practitioner summary, trade article, vendor material, or unsystematic overview | Orientation only; never the sole support for a requirement |

### Entry requirements

Every added source must include:

- a stable source ID;
- evidence tier and type;
- authors or issuing organization;
- publication date;
- canonical URL or DOI;
- date last verified;
- population and scope;
- exact claims the source supports;
- claims it does **not** support;
- material limitations or controversy; and
- consuming specs, ADRs, plans, or research notes.

### Maintenance rules

- Prefer DOI, publisher, government, university, standards-body, or professional-association URLs.
- Do not cite search-result snippets, AI summaries, or Wikipedia as evidence.
- A source without a consuming claim does not belong in this registry.
- When evidence conflicts, preserve the disagreement; do not silently select the preferred result.
- Verify web links when a consuming artifact changes and at least annually.
- Record exact device, browser, OS, and test date for platform-behavior evidence.
- Educational and clinical decisions must distinguish evidence about typical instruction from evidence about diagnosis or treatment.
- Dialect or accent differences are not disorders. Claims about a speech inventory must name the reference variety and known mergers or contrasts.

## Foundational literacy

### `IES-FOUNDATIONAL-2016`

- **Tier/type:** A — What Works Clearinghouse practice guide and evidence synthesis
- **Source:** Foorman, B. R., et al. (2016). *Foundational Skills to Support Reading for Understanding in Kindergarten Through 3rd Grade*. Institute of Education Sciences.
- **Canonical URL:** https://ies.ed.gov/ncee/wwc/Docs/PracticeGuide/wwc_foundationalreading_040717.pdf
- **Last verified:** 2026-06-21
- **Population/scope:** Kindergarten through grade 3; foundational reading instruction.
- **Supports:** Explicit teaching of sound segments; linking phonemes to letters; systematic decoding instruction; teaching digraphs as letter combinations representing one sound; cumulative practice.
- **Does not support:** One universal 44-phoneme English inventory; Reader's Way's exact sound list; a 44+12 combined asset count; a specific recording codec or browser implementation.
- **Limitations:** Practice-guide recommendations aggregate evidence across interventions and do not prescribe one curriculum.
- **Consumed by:** Spec 002 FR16–FR17; ADR-002; audio inventory research; content-authoring plan.

### `NICHD-NRP-2000`

- **Tier/type:** A — congressionally commissioned research synthesis
- **Source:** National Reading Panel. (2000). *Teaching Children to Read*.
- **Canonical URL:** https://www.nichd.nih.gov/sites/default/files/publications/pubs/nrp/Documents/report.pdf
- **Last verified:** 2026-06-21
- **Population/scope:** Beginning readers and readers with difficulties; phonemic awareness, phonics, fluency, vocabulary, and comprehension.
- **Supports:** Explicit phonemic-awareness instruction and systematic phonics as components of effective beginning reading instruction.
- **Does not support:** Treating the five components as a complete product design; one phoneme inventory; UFLI-specific scope decisions.
- **Limitations:** Published in 2000; later research and methodological critiques must be considered for narrow claims.
- **Consumed by:** Spec 001; Spec 002; content and practice design.

### `EHRI-PA-2001`

- **Tier/type:** A — peer-reviewed meta-analysis
- **Source:** Ehri, L. C., Nunes, S. R., Willows, D. M., Schuster, B. V., Yaghoub-Zadeh, Z., & Shanahan, T. (2001). Phonemic awareness instruction helps children learn to read. *Reading Research Quarterly, 36*(3), 250–287.
- **DOI:** https://doi.org/10.1598/RRQ.36.3.2
- **Last verified:** 2026-06-21
- **Population/scope:** Preschool and school-age children across phonemic-awareness interventions.
- **Supports:** Teaching children to analyze and manipulate phonemes can improve phonemic awareness and reading outcomes; connecting sounds and letters is instructionally useful.
- **Does not support:** Runtime audio design, isolated-sound recording standards, or automatic speech scoring.
- **Limitations:** Intervention and participant heterogeneity; predates current speech technology.
- **Consumed by:** Foundational-practice rationale and future phoneme-scaffolding decisions.

### `EHRI-PHONICS-2001`

- **Tier/type:** A — peer-reviewed meta-analysis
- **Source:** Ehri, L. C., Nunes, S. R., Stahl, S. A., & Willows, D. M. (2001). Systematic phonics instruction helps students learn to read. *Review of Educational Research, 71*(3), 393–447.
- **DOI:** https://doi.org/10.3102/00346543071003393
- **Last verified:** 2026-06-21
- **Population/scope:** 38 experiments and 66 treatment-control comparisons.
- **Supports:** Systematic phonics improves beginning reading outcomes relative to unsystematic or no-phonics instruction.
- **Does not support:** One exclusive phonics program, a particular sound wall, or an audio asset count.
- **Limitations:** Effects vary by learner group, outcome, and instructional timing.
- **Consumed by:** Content-sequence and explicit-instruction rationale.

### `NASEM-PREVENTING-1998`

- **Tier/type:** A — National Academies consensus report
- **Source:** Snow, C. E., Burns, M. S., & Griffin, P. (Eds.). (1998). *Preventing Reading Difficulties in Young Children*.
- **Canonical URL:** https://nap.nationalacademies.org/catalog/6023/preventing-reading-difficulties-in-young-children
- **Last verified:** 2026-06-21
- **Population/scope:** Early language and literacy development; prevention of reading difficulty.
- **Supports:** Integrating language, phonological awareness, alphabet knowledge, and responsive instruction.
- **Does not support:** A current browser implementation or exact content inventory.
- **Limitations:** Older synthesis; use alongside newer evidence reviews.
- **Consumed by:** Broad product and intervention rationale.

## Speech, language, and dialect

### `ASHA-WRITTEN-LANGUAGE`

- **Tier/type:** C — professional clinical practice portal with evidence map
- **Organization:** American Speech-Language-Hearing Association
- **Canonical URL:** https://www.asha.org/practice-portal/clinical-topics/written-language-disorders/
- **Last verified:** 2026-06-21
- **Population/scope:** Preschool and school-age spoken/written language relationships, assessment, and intervention.
- **Supports:** Distinguishing phonemes from graphemes; the role of phonological processing in decoding and spelling; interprofessional collaboration.
- **Does not support:** Product diagnosis, replacing an SLP, or one universal pronunciation model.
- **Limitations:** Clinical guidance is broader than typical-reader instructional design.
- **Consumed by:** Audio inventory terminology; SLP review packet; future speech-scoring research.

### `ASHA-SPEECH-SOUND-DISORDERS`

- **Tier/type:** C — professional clinical practice portal
- **Organization:** American Speech-Language-Hearing Association
- **Canonical URL:** https://www.asha.org/practice-portal/clinical-topics/articulation-and-phonology/
- **Last verified:** 2026-06-21
- **Population/scope:** Speech sound assessment and intervention across linguistic profiles.
- **Supports:** Considering dialect, accent, multilingual development, phonemic/allophonic variation, and community speech norms; dialect difference is not disorder.
- **Does not support:** Labeling Mainstream American English as accent-neutral or using it as a diagnostic norm for every child.
- **Limitations:** Clinical assessment guidance does not define a literacy-app sound inventory.
- **Consumed by:** Audio reference-variety guardrails; SLP review packet; automatic-scoring investigation `rw-gx3`.

### `UFLI-SOUND-WALL-2022`

- **Tier/type:** C — university literacy institute implementation resource
- **Organization:** University of Florida Literacy Institute
- **Canonical URL:** https://ufli.education.ufl.edu/wp-content/uploads/2023/09/UFLI-Sound-Wall-rev.pdf
- **Companion page:** https://ufli.education.ufl.edu/foundations/printable-resources/
- **Last verified:** 2026-06-21
- **Population/scope:** UFLI Foundations sound-wall implementation; phoneme articulation, place/manner, and grapheme mappings.
- **Supports:** The project's 44 instructional sound targets; separate phoneme cards and grapheme cards; place/manner metadata; `/θ/` and `/ð/` as separate targets; dialect-sensitive pronunciation adjustments.
- **Does not support:** Calling all 44 targets dialect-independent phonemes; a production recording protocol; a combined 56-file requirement.
- **Limitations:** Curriculum implementation resource, not a systematic review. Its inventory includes contrast choices that some American English speakers merge.
- **Consumed by:** Audio inventory research; ADR-002 revision; recording review packet.

### `UFLI-FOUNDATIONS`

- **Tier/type:** C — university-developed structured literacy curriculum and implementation resources
- **Organization:** University of Florida Literacy Institute
- **Canonical URL:** https://ufli.education.ufl.edu/foundations/
- **Toolbox:** https://ufli.education.ufl.edu/foundations/toolbox/
- **Last verified:** 2026-06-21
- **Population/scope:** Explicit, systematic foundational reading instruction.
- **Supports:** The project's curriculum scaffold, cumulative sequence, and sound–spelling implementation terminology.
- **Does not support:** Every Reader's Way product decision or an inference that all UFLI materials are independent peer-reviewed evidence.
- **Limitations:** Program resources combine research grounding with authored curriculum decisions.
- **Consumed by:** Spec 002 FR17; content sequence; audio inventory.

### `IPA-CHART`

- **Tier/type:** C — international phonetic standard
- **Organization:** International Phonetic Association
- **Canonical URL:** https://www.internationalphoneticassociation.org/content/ipa-chart
- **Last verified:** 2026-06-21
- **Population/scope:** Standard symbols for representing speech sounds.
- **Supports:** Stable IPA notation and distinctions such as `/θ/` versus `/ð/`.
- **Does not support:** Which contrasts a literacy curriculum should teach, how many phonemes English has, or how a sound should be modeled for a child.
- **Limitations:** Not an instructional sequence or dialect inventory.
- **Consumed by:** Inventory identifiers and SLP review packet.

### `LABOV-NORTH-AMERICAN-2006`

- **Tier/type:** B — major scholarly sociophonetic atlas
- **Source:** Labov, W., Ash, S., & Boberg, C. (2006). *The Atlas of North American English*.
- **Publisher URL:** https://www.degruyter.com/document/doi/10.1515/9783110206838/html
- **Last verified:** 2026-06-21
- **Population/scope:** Regional phonological variation in North American English.
- **Supports:** American English is not one invariant accent; mergers such as cot–caught and wine–whine vary by region and speaker.
- **Does not support:** Selecting one pedagogical inventory as universally correct.
- **Limitations:** Descriptive atlas data are not an instructional effectiveness study.
- **Consumed by:** Reference-variety and dialect-risk notes in the audio inventory.

## Learning experience and co-engagement

### `HIRSH-PASEK-APPS-2015`

- **Tier/type:** A — peer-reviewed integrative review
- **Source:** Hirsh-Pasek, K., et al. (2015). Putting education in “educational” apps. *Psychological Science in the Public Interest, 16*(1), 3–34.
- **DOI:** https://doi.org/10.1177/1529100615569721
- **Open copy:** https://pmc.ncbi.nlm.nih.gov/articles/PMC8916741/
- **Last verified:** 2026-06-21
- **Population/scope:** Young children's learning with educational apps.
- **Supports:** Active, engaged, meaningful, socially interactive learning; avoiding distractors unrelated to learning goals.
- **Does not support:** A specific phonics sequence or speech model.
- **Limitations:** Broad learning-science framework; individual product features require more specific evidence.
- **Consumed by:** UI engagement research and guardian/student co-engagement design.

## Audio and browser standards

### `WEB-SPEECH-SPEC`

- **Tier/type:** C — web platform specification
- **Organization:** Web Speech Community Group
- **Canonical URL:** https://webaudio.github.io/web-speech-api/
- **Last verified:** 2026-06-21
- **Scope:** Browser speech synthesis and recognition APIs.
- **Supports:** Voice enumeration may initially be empty; `voiceschanged`, cancellation, language selection, start/end/error events, and local/remote voice metadata.
- **Does not support:** Uniform voice availability, pronunciation quality, privacy behavior, or preserved user activation after asynchronous work on every browser.
- **Limitations:** Implementation support and behavior vary; real-device tests remain required.
- **Consumed by:** Audio playback design and target-device spike.

### `WEBKIT-IOS-MEDIA-2016`

- **Tier/type:** C — browser-engine policy documentation
- **Organization:** WebKit
- **Canonical URL:** https://webkit.org/blog/6784/new-video-policies-for-ios/
- **Last verified:** 2026-06-21
- **Scope:** iOS media playback and user-gesture policies.
- **Supports:** Audible media playback must respect user-gesture and autoplay restrictions.
- **Does not support:** Web Speech synthesis behavior specifically or current-version parity without testing.
- **Limitations:** Published in 2016; exact current behavior must be recorded through device QA.
- **Consumed by:** ADR-002 and audio device-spike requirements.

### `MDN-AUDIO-CODECS`

- **Tier/type:** C — web platform implementation reference
- **Organization:** MDN Web Docs
- **Canonical URL:** https://developer.mozilla.org/en-US/docs/Web/Media/Guides/Formats/Audio_codecs
- **Last verified:** 2026-07-07
- **Population/scope:** Browser audio codec support, codec characteristics, and implementation caveats.
- **Supports:** Codec/container support considerations for AAC, MP3, Opus, and WAV; codec-latency caveats used in the codec comparison spike.
- **Does not support:** Actual Reader's Way target-device playback quality, final codec approval, or speech-sound intelligibility for children.
- **Limitations:** Browser support tables and implementation notes are not a substitute for iPadOS Safari, mobile Safari, desktop Safari, and Chrome listening checks.
- **Consumed by:** `docs/research/audio-spikes/codec-comparison.md`.

### `MDN-MEDIA-CONTAINERS`

- **Tier/type:** C — web platform implementation reference
- **Organization:** MDN Web Docs
- **Canonical URL:** https://developer.mozilla.org/en-US/docs/Web/Media/Guides/Formats/Containers
- **Last verified:** 2026-07-07
- **Population/scope:** Browser media container support and audio-only container behavior.
- **Supports:** WAV/LPCM container-support discussion and general container-selection tradeoffs in the codec comparison spike.
- **Does not support:** Final Reader's Way runtime asset approval or target-device latency/quality claims.
- **Limitations:** General platform documentation; exact app behavior depends on device, browser, OS, network, and playback implementation.
- **Consumed by:** `docs/research/audio-spikes/codec-comparison.md`.

### `WEBKIT-SAFARI-15-MEDIA`

- **Tier/type:** C — browser-engine release notes
- **Organization:** WebKit
- **Canonical URL:** https://webkit.org/blog/11989/new-webkit-features-in-safari-15/
- **Last verified:** 2026-07-07
- **Population/scope:** Safari 15 media feature history.
- **Supports:** Historical context for Safari WebM/Opus media support used when comparing Opus compatibility risk.
- **Does not support:** Current iPadOS Safari Ogg Opus parity or Reader's Way final codec approval.
- **Limitations:** Release-note evidence is version-specific and does not replace current target-device QA.
- **Consumed by:** `docs/research/audio-spikes/codec-comparison.md`.

### `WEBKIT-SAFARI-18-4-MEDIA`

- **Tier/type:** C — browser-engine release notes
- **Organization:** WebKit
- **Canonical URL:** https://webkit.org/blog/16574/webkit-features-in-safari-18-4/
- **Last verified:** 2026-07-07
- **Population/scope:** Safari 18.4 media feature updates.
- **Supports:** Current WebKit Ogg Opus/Vorbis support context used when comparing Opus compatibility risk.
- **Does not support:** Reader's Way target-device playback quality, older Safari support, or final codec approval.
- **Limitations:** Release-note evidence is implementation-specific; Reader's Way still needs manual checks on named target devices and browsers.
- **Consumed by:** `docs/research/audio-spikes/codec-comparison.md`.

## Future automatic speech scoring

### `AUTOMATED-SSD-SLR-2022`

- **Tier/type:** A/B — systematic literature review; publication venue and peer-review status must be verified before it supports a product requirement
- **Source:** Deka, C., et al. (2022). *AI-Based Automated Speech Therapy Tools for Persons with Speech Sound Disorders: A Systematic Literature Review*.
- **Preprint:** https://arxiv.org/abs/2204.10325
- **Last verified:** 2026-06-21
- **Population/scope:** Automated speech-therapy tools and stakeholder involvement.
- **Supports:** Automated systems need clinical validation; relatively few studies compare systems with expert SLP judgment; stakeholder role is often under-specified.
- **Does not support:** Deploying automatic child-speech scoring, choosing a provider, or an acceptable accuracy threshold.
- **Limitations:** Preprint link; heterogeneous systems and populations; not evidence that automation is safe or effective for Reader's Way.
- **Consumed by:** Investigation `rw-gx3` only.

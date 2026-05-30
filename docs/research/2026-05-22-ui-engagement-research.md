# UI engagement & illustration — research grounding for K–2 literacy app

Date: 2026-05-22

## Problem

The literacy app v1.0 design (see `docs/specs/001-literacy-app-v1-design.md`) takes a strong anti-carnival stance — no streaks, coins, avatars, leaderboards, or reward animations. The visual direction is "calm and literary."

This raises a design question: where, if anywhere, do small illustrative elements belong, and how should they be deployed without violating the engagement principles the rest of the design is built on? Edutainment apps for this age routinely add decorative characters, animated rewards, and playful backgrounds; the question is whether the research justifies that, or argues against it.

This note collects the relevant research and translates it into concrete rules for the design prompt and the eventual UI.

## The research consensus

### Four-pillar framework for educational apps

Hirsh-Pasek, Zosh, Golinkoff, Gray, Robb & Kaufman (2015), "Putting Education in 'Educational' Apps," *Psychological Science in the Public Interest* 16(1) — the most-cited paper on this question.

Apps produce learning when they support four conditions:

1. **Active** — minds-on engagement, not tap-and-watch.
2. **Engaged in the learning goal** — attention focused on the target, not on distractors.
3. **Meaningful** — connects to what the child already knows.
4. **Socially interactive** — a co-engaging adult, or contingent feedback that simulates one.

Critical finding from the same paper, replicated continuously since: **digital "enhancements" that are not tied to the learning goal reduce learning.** Books with decorative interactive features produce worse comprehension than plain books. Apps with reward animations between problems produce worse transfer than apps without them.

### Seductive details effect

Harp & Mayer (1998), "How seductive details do their damage," *Journal of Educational Psychology* 90(3), and subsequent replications (Rey 2012 meta-analysis; Sundararajan & Adesope 2020 meta-analysis).

Interesting-but-irrelevant material — a cute character on the side, a fun animation between problems, a decorative background — measurably reduces learning, even when learners report enjoying the experience more. The effect is *larger* for younger learners with smaller working memories and for content that is genuinely difficult (decoding for a K–1 reader qualifies on both counts).

### Cognitive Load Theory and multimedia learning

Sweller, Ayres & Kalyuga (2011), *Cognitive Load Theory*. Mayer's twelve principles of multimedia learning (Mayer 2014, *The Cambridge Handbook of Multimedia Learning*).

Working memory is the bottleneck for K–2 learners. Every pixel that is not the target competes with the target. The principles most relevant to a literacy practice app:

- **Coherence principle:** people learn better when extraneous material is excluded, not balanced.
- **Signaling principle:** cues that highlight the essential target (a gentle pulse, a soft arrow) increase learning. This is the one place where adding visual elements helps rather than hurts.
- **Spatial contiguity:** related elements should be close together (e.g., the grapheme appearing inside its phoneme box, not next to it in a legend).
- **Modality principle:** narration paired with visuals beats text alongside visuals for non-readers. Strong support for the app's audio-first design.
- **Redundancy principle:** simultaneous narration and on-screen text duplicating the narration *reduces* learning. The audio model and the word on screen should not compete.

### Self-Determination Theory and the overjustification effect

Deci & Ryan (2000), "The 'what' and 'why' of goal pursuits," *Psychological Inquiry* 11(4). Lepper, Greene & Nisbett (1973), "Undermining children's intrinsic interest with extrinsic reward," *Journal of Personality and Social Psychology* 28(1).

External reward economies (stars, badges, coins, points, streaks) measurably erode intrinsic motivation over time. Children who were already curious about a task become less curious when the task is paired with extrinsic rewards. The effect is documented across hundreds of studies and is one of the most robust findings in motivation psychology.

This is the research basis for the v1.0 spec's anti-carnival stance: it is not an aesthetic preference, it is an evidence-based protection of long-term motivation.

### What actually sustains engagement at this age

Synthesized across: Csikszentmihalyi's flow research; Kidd, Piantadosi & Aslin (2012) on the "Goldilocks effect" in infant attention; Bandura's self-efficacy literature; PBS Kids and Sesame Workshop internal design research; the National Reading Panel and follow-up literacy literature.

- Challenge calibrated to current skill (the SRS scheduler in §6 does this directly).
- Predictable session structure with a clear endpoint (the daily plan + "you're done" signal in §5–§7).
- Immediate, specific, contingent feedback (audio model + ✓/✗ at the moment of attempt).
- **Visible mastery progress on something real** — Bandura's self-efficacy work shows competence is more motivating than reward, when the competence is legible. A skill map filling in is the direct application.
- Co-engagement with a trusted adult (the entire premise of the app — robustly supported in Hirsh-Pasek's fourth pillar).
- Repetition with small variation — young children find this engaging, not boring, because it builds predictive models. The SRS naturally produces this.
- Brief acknowledgment of real milestones, not constant praise. Praise inflation reduces effect; one calm celebration per real mastery flip is the sweet spot.

## Translation to illustration rules

The research permits illustration only when it does one of three jobs:

1. **It is the content** — phoneme tiles, grapheme cards, the heart-word visual indicator. These are functional manipulatives, the digital analog of physical Elkonin boxes and letter tiles, both of which are well-validated in literacy research.
2. **It signals where to attend** — Mayer's signaling principle. A gentle highlight on the next phoneme box, a soft pulse on the current target. These increase learning.
3. **It provides calm affective framing** — a single quiet visual rhythm that says "this is a focused space." Borrowed from mindfulness-app design. Must not move during the drill itself.

The research forbids illustration that:

- Decorates without teaching (backgrounds, scenery, characters not doing instructional work).
- Animates during the learning moment (steals attention from the target).
- Functions as a reward (stars, sparkles, confetti — both the seductive-details and overjustification literatures flag these).
- Introduces a host who comments or narrates beyond contingent feedback. The research on hosts is mixed: a *very* calm, consistent host (Daniel Tiger, Bluey) can work for this age, but production cost is high and the benefit is modest. v1.0 does without; v1.5+ could revisit if a single-character host fits the budget.

## Concrete illustration permissions for v1.0

Permitted:

- Phoneme tiles / Elkonin boxes as the central manipulative on PA and Phonics cards.
- A small "heart" glyph adjacent to the irregular part of a heart word.
- One quiet, non-animating unit motif per skill-map cluster (helps non-reading children orient on the dashboard).
- A single calm illustrative element (a leaf, an arch, a soft sun) at the "Today: N things" and "You're done" screens — and only there.
- A subtle attention signal (gentle pulse or color shift on the current target) during multi-step PA/segmenting prompts. This is Mayer's signaling principle, the only research-supported addition to the drill card.
- A near-imperceptible warm-tone fade during the 600 ms inter-card breath, as a regulation cue borrowed from mindfulness apps.

Forbidden in v1.0:

- Characters that react to scoring.
- Backgrounds with scenery, characters, or decorative pattern on the drill card.
- Sparkles, stars, confetti, badges, fireworks, or any icon that functions as a reward.
- Animation during the drill except for the signaling cue above.
- A host narrator or mascot.

## How this shows up in the design prompt

The combined prompt at `docs/design/2026-05-22-ui-prompt.md` carries an "Illustration philosophy (research-grounded)" section that encodes these rules. The prompt is designed to be handed to Figma Make, Claude Design, and Google Stitch in parallel, with each tool proposing its own palette inside the calm/literary direction.

## Sources

**Educational app design**

- Hirsh-Pasek, K., Zosh, J. M., Golinkoff, R. M., Gray, J. H., Robb, M. B., & Kaufman, J. (2015). Putting education in "educational" apps: Lessons from the science of learning. *Psychological Science in the Public Interest, 16*(1), 3–34. [https://pmc.ncbi.nlm.nih.gov/articles/PMC8916741/](https://pmc.ncbi.nlm.nih.gov/articles/PMC8916741/)

**Seductive details and extraneous load**

- Harp, S. F., & Mayer, R. E. (1998). How seductive details do their damage: A theory of cognitive interest in science learning. *Journal of Educational Psychology, 90*(3), 414–434.
- Rey, G. D. (2012). A review of research and a meta-analysis of the seductive detail effect. *Educational Research Review, 7*(3), 216–237.
- Sundararajan, N., & Adesope, O. (2020). Keep it coherent: A meta-analysis of the seductive details effect. *Educational Psychology Review, 32*, 707–734.

**Multimedia learning and cognitive load**

- Mayer, R. E. (2014). *The Cambridge Handbook of Multimedia Learning* (2nd ed.). Cambridge University Press.
- Sweller, J., Ayres, P., & Kalyuga, S. (2011). *Cognitive Load Theory*. Springer.

**Motivation**

- Deci, E. L., & Ryan, R. M. (2000). The "what" and "why" of goal pursuits: Human needs and the self-determination of behavior. *Psychological Inquiry, 11*(4), 227–268.
- Lepper, M. R., Greene, D., & Nisbett, R. E. (1973). Undermining children's intrinsic interest with extrinsic reward: A test of the "overjustification" hypothesis. *Journal of Personality and Social Psychology, 28*(1), 129–137.

**Attention and engagement at this age**

- Kidd, C., Piantadosi, S. T., & Aslin, R. N. (2012). The Goldilocks effect: Human infants allocate attention to visual sequences that are neither too simple nor too complex. *PLoS ONE, 7*(5), e36399.
- Bandura, A. (1997). *Self-Efficacy: The Exercise of Control*. W. H. Freeman.

**Already cited in the v1.0 spec (§11)**

- IES — Evidence-Based Practices for Teaching Phonological and Phonemic Awareness.
- Reading Rockets — Findings of the National Reading Panel.
- PMC — Explicit Instruction as the Essential Tool for Executing the Science of Reading.
- PMC — How educational are 'educational' apps for young children?
- PMC — Screen time and preschool children: promoting health and development in a digital world.

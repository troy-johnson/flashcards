/**
 * Single source of truth for Reader's Way brand/UI copy (Spec 002 FR1–FR3).
 * Brand chrome ONLY — instructional content (skills, words, sentences, audio)
 * lives in content/ and must never move here (FR3/AC2).
 *
 * A product rename should require editing only this file.
 */

export const productName = "Reader's Way";

export const productPositioning =
  "Short, structured reading practice that helps young readers build calm confidence with a caring adult nearby.";

export const landing = {
  eyebrow: productName,
  headline: "Short, calm reading practice with your child.",
  subtitle:
    "Daily 8–10 minute sessions for kindergarten and 1st-grade readers. You sit with your child; the app handles what comes next.",
  audience: "For kindergarten and 1st-grade readers practicing with a parent, guardian, or other caring adult.",
  practice: "Short, structured reading practice with an adult nearby to listen, encourage, and record how it went.",
  instruction: "Evidence-informed practice builds phonemic awareness, phonics and decoding, heart words, and reading fluency.",
  privacy: "There are no ads, and we never sell guardian or child data.",
  pilot: "Reader's Way is an invite-only early-access pilot.",
  storyHeading: "For caring adults and young readers",
  privacyHeading: "Private, early-access practice",
  stepsHeading: "How it works",
  steps: [
    {
      title: "Set up your child.",
      body: "First name, grade, a few preferences. About a minute."
    },
    {
      title: "Sit together for 8–10 minutes a day.",
      body: "The app shows one card at a time — a sound, a word, a short sentence. You tap to mark what they got."
    },
    {
      title: "Watch the skill map fill in.",
      body: "Mastery builds gradually across phonemic awareness, phonics, heart words, and fluency."
    }
  ],
  antiGamification: "No streaks, no coins, no leaderboards. Practice is the point — there's nothing else to chase.",
  ctaPrompt: "Interested in the invite-only pilot?",
  contactCta: "Contact the pilot team",
  signInCta: "Sign in",
  methodologyLink: "Methodology",
  privacyLink: "Privacy Policy",
  termsLink: "Terms of Use"
} as const;

export const methodology = {
  eyebrow: "For professional review",
  title: "Methodology and SLP review",
  introduction:
    "Reader's Way is an adult-supported foundational-reading practice tool for kindergarten and 1st-grade readers. This page separates the evidence-backed principles we rely on from the implementation choices we are asking a speech-language pathologist to validate.",
  reviewPurpose:
    "The cited sources support broad instructional and professional principles. They do not independently validate Reader's Way, prescribe its exact sound inventory, or establish clinical efficacy.",
  principlesHeading: "Evidence-backed principles",
  principles: [
    {
      heading: "Phonemic awareness and letter–sound connections",
      body:
        "Beginning readers benefit from explicit practice hearing and manipulating speech sounds and connecting those sounds to letters. Reader's Way translates that principle into short, adult-supported prompts rather than asking a child to navigate technical terminology.",
      sourceIds: ["ies-foundational", "nrp", "ufli-phonemic-awareness"]
    },
    {
      heading: "Systematic phonics and decoding",
      body:
        "Practice follows a cumulative sequence: children blend sounds, connect common sound–spelling patterns, read decodable words, and then apply those skills in text. New material is constrained by what has already been introduced.",
      sourceIds: ["ies-foundational", "nrp", "ufli-foundations"]
    },
    {
      heading: "Heart words and fluency",
      body:
        "Regular and irregular high-frequency words are practiced alongside decoding, and children read short connected text to build accuracy and fluency. The app highlights the part of a heart word that needs special attention without presenting the whole word as visually irregular.",
      sourceIds: ["ies-foundational"]
    },
    {
      heading: "Adult co-engagement and professional collaboration",
      body:
        "A caring adult presents the prompt, listens, and records the practice result. Speech-language expertise is used to review sound models and linguistic safeguards; the app does not take on an SLP's diagnostic or clinical role.",
      sourceIds: ["ufli-phonemic-awareness", "asha-written-language", "asha-speech-sounds"]
    }
  ],
  choicesHeading: "Reader's Way implementation choices",
  choices: [
    "Sessions are designed for about 8–10 minutes with a caring adult present.",
    "The adult records Correct, Try again, or Skip; Reader's Way does not automatically score a child's speech and does not record the child's voice in the pilot.",
    "Practice rotates phonemic awareness, systematic phonics and decoding, heart words, and fluency using simple mastery and due-date signals. This scheduler is a product implementation, not a clinical assessment.",
    "The audio inventory contains 44 instructional sound targets and 12 grapheme-pattern mappings derived from UFLI implementation resources. That inventory is a pedagogical reference set, not a claim that English has one universal, dialect-independent inventory.",
    "Recorded isolated sounds are intended to model a target sound. Browser speech synthesis is a gesture-triggered fallback for whole words and sentences; it is not used as the authoritative model for isolated phonemes."
  ],
  boundariesHeading: "Audio, dialect, and release boundaries",
  boundaries: [
    "Every speaker has an accent, and dialect difference is not a disorder. Review must consider the named reference variety, regional and community variation, mergers and contrasts, and the possibility that a child's linguistic system differs from the model.",
    "Reader's Way is an educational practice tool, not diagnosis or speech therapy. It does not determine whether a child has a speech sound, language, or reading disorder and should not replace individualized assessment or treatment.",
    "A recorded clip cannot become learner-facing until the current recorder, owner, and SLP approvals all match its checksum-bound review subject. Replacing the bytes or relevant production metadata makes the prior approval stale. Rejection or requested changes keep the clip out of learner practice.",
    "Browser voices and pronunciation vary by device and browser. Whole-item TTS is therefore treated as a convenient fallback, not proof that a pronunciation or isolated sound is clinically or instructionally appropriate."
  ],
  reviewHeading: "What we ask the SLP to validate",
  reviewIntroduction:
    "Please review the inventory and each candidate recording with these questions in mind:",
  reviewItems: [
    "Do the target identifiers, IPA symbols, example words, and production notes describe the intended instructional sounds accurately?",
    "Do the isolated recordings model the intended sound cleanly, without adding a misleading schwa, clipping, excessive duration, or distracting coarticulation?",
    "Are the 12 grapheme-pattern mappings instructionally sound, including mappings with more than one possible sound or a sequence of sounds?",
    "Are the reference-variety and dialect notes respectful and sufficient, and do they avoid treating accent or dialect differences as errors or disorders?",
    "Is each candidate suitable for kindergarten and 1st-grade listening on ordinary phones, tablets, and computers?",
    "For each checksum-bound candidate, is the appropriate disposition approve, request changes, or reject—and what exact note should accompany that decision?"
  ],
  sourcesHeading: "Evidence base and limits",
  sources: [
    {
      id: "ies-foundational",
      label: "IES/What Works Clearinghouse: Foundational Skills to Support Reading for Understanding in Kindergarten Through 3rd Grade",
      href: "https://ies.ed.gov/ncee/wwc/Docs/PracticeGuide/wwc_foundationalreading_040717.pdf",
      note: "Supports explicit sound-segment work, letter–sound connections, decoding, high-frequency-word instruction, and connected-text practice; it does not prescribe Reader's Way or its exact inventory."
    },
    {
      id: "nrp",
      label: "National Reading Panel: Teaching Children to Read",
      href: "https://www.nichd.nih.gov/sites/default/files/publications/pubs/nrp/Documents/report.pdf",
      note: "Supports explicit phonemic-awareness instruction, systematic phonics, and fluency as components of beginning reading instruction; it is not a complete product design."
    },
    {
      id: "ufli-foundations",
      label: "University of Florida Literacy Institute: UFLI Foundations",
      href: "https://ufli.education.ufl.edu/foundations/",
      note: "Supports the cumulative instructional scaffold and sound–spelling terminology; it is a university-developed curriculum resource, not independent validation of every Reader's Way choice."
    },
    {
      id: "ufli-sound-wall",
      label: "University of Florida Literacy Institute: UFLI Sound Wall",
      href: "https://ufli.education.ufl.edu/wp-content/uploads/2023/09/UFLI-Sound-Wall-rev.pdf",
      note: "Grounds the 44 instructional targets, separate sound and grapheme representations, and place/manner review context; its inventory is not dialect-independent."
    },
    {
      id: "ufli-phonemic-awareness",
      label: "University of Florida Literacy Institute: Phonemic Awareness routines",
      href: "https://ufli.education.ufl.edu/resources/teaching-resources/instructional-activities/phonemic-awareness/",
      note: "Supports routines that distinguish an adult's modeled sounds from the child's blending response; Reader's Way translates the educator routine for caregivers."
    },
    {
      id: "asha-written-language",
      label: "ASHA Practice Portal: Written Language Disorders",
      href: "https://www.asha.org/practice-portal/clinical-topics/written-language-disorders/",
      note: "Supports phoneme/grapheme terminology, phonological-processing context, and interprofessional collaboration; it does not support product diagnosis."
    },
    {
      id: "asha-speech-sounds",
      label: "ASHA Practice Portal: Speech Sound Disorders—Articulation and Phonology",
      href: "https://www.asha.org/practice-portal/clinical-topics/articulation-and-phonology/",
      note: "Supports dialect-, accent-, multilingual-, phonemic-, and allophonic-variation safeguards and the SLP's clinical role; it does not define a literacy-app inventory."
    },
    {
      id: "web-speech",
      label: "Web Speech Community Group: Web Speech API specification",
      href: "https://webaudio.github.io/web-speech-api/",
      note: "Documents browser speech-synthesis behavior; it does not guarantee voice availability, pronunciation quality, or consistent behavior across devices."
    }
  ]
} as const;

export const onboarding = {
  headline: "Add your child",
  subtitle: "First name, grade, a few preferences. About a minute."
} as const;

export const magicLinkEmail = {
  /** Subject line for the magic-link email (FR20, FR21). */
  subject: `Sign in to ${productName}`,
  /** Greeting/purpose line (FR21: why the recipient is receiving this). */
  purpose: `You asked to sign in to ${productName}. Use the button or link below to finish signing in.`,
  /** Call to action label. */
  cta: `Sign in to ${productName}`,
  /** Expiration/time-sensitivity language (FR21). */
  expiry: "This link expires in 15 minutes for your security.",
  /** Ignore-if-unrequested language (FR21). */
  ignore: `If you did not request this, you can safely ignore this email — no one can sign in without this link.`
} as const;

export const support = {
  /** Display name used in privacy/contact copy where practical (FR1). */
  displayName: productName,
  /** Owner-confirmed pilot support destination. */
  email: "support@troyjohnson.dev"
} as const;

/**
 * Owner-approved July 15, 2026; published for the early-access pilot July 16, 2026.
 * Plain-language Phase A privacy copy for Spec 002 FR27–FR29.
 */
export const privacyPolicyDraft = {
  title: "Privacy Policy",
  status: "Effective July 16, 2026",
  introduction:
    `${productName} is an early-access reading-practice pilot for young readers and the caring adults who practice with them. This policy explains the limited information the pilot uses and why.`,
  sections: [
    {
      heading: "Guardian accounts",
      paragraphs: [
        "A guardian signs in with an email address and a time-limited magic link. We use that email to provide account access, send requested sign-in links, and respond to support questions."
      ]
    },
    {
      heading: "Child profiles",
      paragraphs: [
        "A guardian may create a child profile with a first name or nickname, current or upcoming grade, and limited practice preferences. Do not enter a child's full legal name or other information the app does not request."
      ]
    },
    {
      heading: "Practice and session data",
      paragraphs: [
        `We store the child's assigned practice cards, guardian-recorded results, sessions started and completed, approximate session duration, retries, and progress summaries so the app can choose useful practice and show progress. ${productName} does not record a child's voice or use automatic speech scoring in this pilot.`
      ]
    },
    {
      heading: "Restrained telemetry",
      paragraphs: [
        "We collect a small set of routine and reliability signals to understand whether families use the pilot, where practice gets stuck, and whether it progresses. We do not use advertising trackers or broad surveillance-style click tracking."
      ]
    },
    {
      heading: "How data is used and shared",
      paragraphs: [
        `We use pilot data only to provide, secure, support, and improve ${productName}. There are no ads, and we do not sell guardian or child data. Service providers may process limited data only when needed to operate the app, such as delivering requested magic-link email or hosting the service.`
      ]
    },
    {
      heading: "Questions and deletion requests",
      paragraphs: [
        `A guardian can contact ${support.displayName} support to ask about data or request deletion of an account or child profile. Requests are handled manually during the pilot and may require verification that the requester controls the guardian account.`
      ]
    },
    {
      heading: "Early-access pilot",
      paragraphs: [
        `${productName} is a small, invite-only early-access pilot. This policy may change as the product and its safeguards develop; guardians will be told about material changes before broader use.`
      ]
    }
  ]
} as const;

/**
 * Owner-approved July 15, 2026; published for the early-access pilot July 16, 2026.
 * Plain-language Phase A terms for Spec 002 FR27–FR29.
 */
export const termsOfUseDraft = {
  title: "Terms of Use",
  status: "Effective July 16, 2026",
  introduction:
    `These terms apply to the invite-only ${productName} early-access pilot. By using the pilot, a guardian agrees to use it responsibly and to supervise the child's practice.`,
  sections: [
    {
      heading: "Pilot purpose",
      paragraphs: [
        `${productName} provides short, adult-supported reading practice. It is an educational practice tool, not a school, tutoring service, clinical service, diagnosis, or substitute for professional advice.`
      ]
    },
    {
      heading: "Guardian responsibility",
      paragraphs: [
        "A guardian is responsible for the account, for entering accurate and minimal profile information, and for supervising a child's use. Do not share magic links or use another person's account without permission."
      ]
    },
    {
      heading: "Acceptable use",
      paragraphs: [
        "Do not misuse the service, attempt to access another household's information, interfere with operation or security, upload harmful material, or use the pilot for unlawful purposes."
      ]
    },
    {
      heading: "Early-access availability",
      paragraphs: [
        `The pilot may change, pause, or end as ${productName} learns from early use. Features and content may be incomplete, and uninterrupted or error-free availability is not promised.`
      ]
    },
    {
      heading: "No warranties; limited responsibility",
      paragraphs: [
        `The pilot is provided as available for trusted early use. To the extent permitted by law, ${productName} makes no additional warranties and is not responsible for indirect or consequential losses arising from use of the pilot. Rights that cannot legally be limited remain unaffected.`
      ]
    },
    {
      heading: "Support and ending use",
      paragraphs: [
        `Support, account changes, and deletion requests are handled manually during the pilot. A guardian may stop using ${productName} at any time and may contact support to request account or child-profile deletion.`
      ]
    },
    {
      heading: "Changes to these terms",
      paragraphs: [
        "These terms may change as the pilot develops. Guardians will be told about material changes before broader use or before continued use requires new agreement."
      ]
    }
  ]
} as const;

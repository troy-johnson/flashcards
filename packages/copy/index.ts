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
  pilot: "Reader's Way is an invite-only early-access pilot."
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

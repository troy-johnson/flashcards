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
    "Daily 8–10 minute sessions for kindergarten and 1st-grade readers. You sit with your child; the app handles what comes next."
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
  displayName: productName
} as const;

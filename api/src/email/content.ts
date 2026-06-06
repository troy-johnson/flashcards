import { magicLinkEmail } from "copy";

export interface MagicLinkEmailContent {
  subject: string;
  text: string;
}

/** Composes the magic-link email body from centralized copy (Spec 002 FR1, FR20, FR21). */
export const buildMagicLinkEmail = (url: string): MagicLinkEmailContent => ({
  subject: magicLinkEmail.subject,
  text: [
    magicLinkEmail.purpose,
    "",
    `${magicLinkEmail.cta}: ${url}`,
    "",
    magicLinkEmail.expiry,
    "",
    magicLinkEmail.ignore
  ].join("\n")
});

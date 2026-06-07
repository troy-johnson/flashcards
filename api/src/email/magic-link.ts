import type { Env } from "../types";
import { buildMagicLinkEmail } from "./content";

export interface IssuedMagicLink {
  url: string;
  /** True when the link was only logged (dev-log issuer) and the caller may echo it to the client. */
  echoable: boolean;
}

export const issueMagicLink = async (
  env: Env,
  recipient: string,
  token: string,
  fetchImpl: typeof fetch = (...args) => fetch(...args)
): Promise<IssuedMagicLink> => {
  const url = `${env.APP_ORIGIN}/auth/consume?token=${encodeURIComponent(token)}`;
  if (env.AUTH_EMAIL_ISSUER === "dev-log") {
    const email = buildMagicLinkEmail(url);
    console.log(`[magic-link] ${email.subject}\n${email.text}`);
    return { url, echoable: true };
  }
  if (env.AUTH_EMAIL_ISSUER === "resend") {
    if (!env.RESEND_API_KEY || !env.EMAIL_FROM) {
      throw new Error("resend issuer requires RESEND_API_KEY and EMAIL_FROM");
    }
    const email = buildMagicLinkEmail(url);
    const res = await fetchImpl("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${env.RESEND_API_KEY}`, "content-type": "application/json" },
      body: JSON.stringify({ from: env.EMAIL_FROM, to: [recipient], subject: email.subject, text: email.text })
    });
    if (!res.ok) throw new Error(`resend send failed: ${res.status}`);
    return { url, echoable: false };
  }
  throw new Error(`email issuer ${env.AUTH_EMAIL_ISSUER} is not supported`);
};

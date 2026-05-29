import type { Env } from "../types";

export interface IssuedMagicLink {
  url: string;
  /** True when the link was only logged (dev-log issuer) and the caller may echo it to the client. */
  echoable: boolean;
}

export const issueMagicLink = async (env: Env, email: string, token: string): Promise<IssuedMagicLink> => {
  const url = `${env.APP_ORIGIN}/auth/consume?token=${encodeURIComponent(token)}`;
  if (env.AUTH_EMAIL_ISSUER === "dev-log") {
    console.log(`[magic-link] ${url}`);
    return { url, echoable: true };
  }
  throw new Error(`email issuer ${env.AUTH_EMAIL_ISSUER} is deferred from 001a for ${email}`);
};

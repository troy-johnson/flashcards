import type { Env } from "../types";

export const issueMagicLink = async (env: Env, email: string, token: string): Promise<void> => {
  const url = `${env.APP_ORIGIN}/auth/consume?token=${encodeURIComponent(token)}`;
  if (env.AUTH_EMAIL_ISSUER === "dev-log") {
    console.log(`[magic-link] ${url}`);
    return;
  }
  throw new Error(`email issuer ${env.AUTH_EMAIL_ISSUER} is deferred from 001a for ${email}`);
};

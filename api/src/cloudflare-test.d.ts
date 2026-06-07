declare module "cloudflare:test" {
  import type app from "./index";
  export const env: {
    DB: D1Database;
    APP_ORIGIN: string;
    DIAG_GUARDIAN_EMAIL: string;
    AUTH_EMAIL_ISSUER: "dev-log" | "resend";
    RESEND_API_KEY?: string;
    EMAIL_FROM?: string;
  };
  export const SELF: typeof app;
}

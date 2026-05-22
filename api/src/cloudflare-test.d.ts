declare module "cloudflare:test" {
  import type app from "./index";
  export const env: {
    DB: D1Database;
    APP_ORIGIN: string;
    DIAG_GUARDIAN_EMAIL: string;
    AUTH_EMAIL_ISSUER: "dev-log";
  };
  export const SELF: typeof app;
}

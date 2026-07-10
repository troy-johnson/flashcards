export type Env = {
  DB: D1Database;
  APP_ORIGIN: string;
  DIAG_GUARDIAN_EMAIL: string;
  AUTH_EMAIL_ISSUER: "dev-log" | "resend";
  AUTH_ACCESS_MODE: "open" | "allowlist";
  GUARDIAN_EMAIL_ALLOWLIST?: string;
  RESEND_API_KEY?: string;
  EMAIL_FROM?: string;
};

export type AuthenticatedGuardian = {
  id: string;
  email: string;
  display_name: string | null;
};

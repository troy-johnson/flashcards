export type Env = {
  DB: D1Database;
  APP_ORIGIN: string;
  DIAG_GUARDIAN_EMAIL: string;
  AUTH_EMAIL_ISSUER: "dev-log";
};

export type AuthenticatedGuardian = {
  id: string;
  email: string;
  display_name: string | null;
};

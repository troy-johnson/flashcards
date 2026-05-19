import { ApiError } from "../api/client";
import { getCurrentGuardian } from "../api/literacy";
import type { Guardian } from "../api/types";

export type AuthState = {
  status: "unknown" | "anonymous" | "authenticated" | "error";
  guardian: Guardian | null;
  error: string | null;
};

export const authState: AuthState = {
  status: "unknown",
  guardian: null,
  error: null
};

export const resetAuthState = (): void => {
  authState.status = "unknown";
  authState.guardian = null;
  authState.error = null;
};

export const loadAuthState = async (): Promise<AuthState> => {
  try {
    const { guardian } = await getCurrentGuardian();
    authState.status = "authenticated";
    authState.guardian = guardian;
    authState.error = null;
  } catch (err) {
    authState.guardian = null;
    if (err instanceof ApiError && err.status === 401) {
      authState.status = "anonymous";
      authState.error = null;
    } else {
      authState.status = "error";
      authState.error = err instanceof Error ? err.message : String(err);
      console.error("[auth] failed to load current guardian", err);
    }
  }
  return authState;
};

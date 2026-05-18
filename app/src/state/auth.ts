import { getCurrentGuardian } from "../api/literacy";
import type { Guardian } from "../api/types";

export type AuthState = {
  status: "unknown" | "anonymous" | "authenticated";
  guardian: Guardian | null;
};

export const authState: AuthState = {
  status: "unknown",
  guardian: null
};

export const resetAuthState = (): void => {
  authState.status = "unknown";
  authState.guardian = null;
};

export const loadAuthState = async (): Promise<AuthState> => {
  try {
    const { guardian } = await getCurrentGuardian();
    authState.status = "authenticated";
    authState.guardian = guardian;
  } catch {
    authState.status = "anonymous";
    authState.guardian = null;
  }
  return authState;
};

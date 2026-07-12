import type { AuthenticatedGuardian } from "../types";

type OperatorPolicyEnv = { DIAG_GUARDIAN_EMAIL?: string | null };

export type GuardianCapabilities = { operator_tools: boolean };

export function guardianCapabilities(
  env: OperatorPolicyEnv,
  guardian: Pick<AuthenticatedGuardian, "email">
): GuardianCapabilities {
  const configuredEmail = env.DIAG_GUARDIAN_EMAIL;
  const operatorTools = configuredEmail != null
    && configuredEmail.trim() !== ""
    && configuredEmail === guardian.email;

  return { operator_tools: operatorTools };
}

export function canUseOperatorTools(
  env: OperatorPolicyEnv,
  guardian: Pick<AuthenticatedGuardian, "email">
): boolean {
  return guardianCapabilities(env, guardian).operator_tools;
}

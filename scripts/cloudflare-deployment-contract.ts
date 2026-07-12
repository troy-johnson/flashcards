import assert from "node:assert/strict";

type Binding = {
  name?: unknown;
  type?: unknown;
  database_id?: unknown;
};

type VersionMetadata = {
  resources?: {
    script_runtime?: {
      assets?: {
        not_found_handling?: unknown;
      };
    };
    bindings?: Binding[];
  };
};

const requiredApiBindings = {
  DB: "d1",
  AUTH_RATE_LIMITER: "ratelimit",
  DIAG_GUARDIAN_EMAIL: "secret_text",
  GUARDIAN_EMAIL_ALLOWLIST: "secret_text",
  RESEND_API_KEY: "secret_text",
} as const;

const productionDatabaseId = "e6b236d6-e3ae-4ff8-9a7e-4874c8419c96";

const bindingsOf = (version: VersionMetadata) =>
  version.resources?.bindings ?? [];

export const assertFrontendProductionVersion = (
  version: VersionMetadata,
): void => {
  assert.equal(
    version.resources?.script_runtime?.assets?.not_found_handling,
    "single-page-application",
    "frontend candidate must provide Static Assets with single-page-application fallback",
  );

  const apiBinding = bindingsOf(version)[0];
  assert.equal(
    apiBinding,
    undefined,
    `frontend candidate must not contain API binding ${String(apiBinding?.name)}`,
  );
};

export const assertApiProductionVersion = (version: VersionMetadata): void => {
  const bindings = bindingsOf(version);

  for (const [required, expectedType] of Object.entries(requiredApiBindings)) {
    const binding = bindings.find((candidate) => candidate.name === required);
    assert.ok(binding, `API candidate is missing ${required}`);
    assert.equal(
      binding.type,
      expectedType,
      `${required} must be ${expectedType}`,
    );
  }

  const database = bindings.find((binding) => binding.name === "DB");
  assert.equal(
    database?.database_id,
    productionDatabaseId,
    "API candidate must bind the production D1 database",
  );
};

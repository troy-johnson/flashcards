import assert from "node:assert/strict";
import test from "node:test";

import {
  assertApiProductionVersion,
  assertFrontendProductionVersion,
} from "./cloudflare-deployment-contract.ts";

const frontendVersion = {
  resources: {
    script: { handlers: null },
    script_runtime: {
      assets: { not_found_handling: "single-page-application" },
    },
    bindings: [],
  },
};

const apiVersion = {
  resources: {
    script: { handlers: ["fetch"] },
    script_runtime: {},
    bindings: [
      {
        name: "DB",
        type: "d1",
        database_id: "e6b236d6-e3ae-4ff8-9a7e-4874c8419c96",
      },
      { name: "AUTH_RATE_LIMITER", type: "ratelimit" },
      { name: "DIAG_GUARDIAN_EMAIL", type: "secret_text" },
      { name: "GUARDIAN_EMAIL_ALLOWLIST", type: "secret_text" },
      { name: "RESEND_API_KEY", type: "secret_text" },
    ],
  },
};

test("frontend deployment accepts only a static-assets SPA artifact", () => {
  assert.doesNotThrow(() => assertFrontendProductionVersion(frontendVersion));

  assert.throws(
    () =>
      assertFrontendProductionVersion({
        ...apiVersion,
        resources: {
          ...apiVersion.resources,
          bindings: [
            ...apiVersion.resources.bindings,
            { name: "APP_ORIGIN", type: "plain_text" },
          ],
        },
      }),
    /single-page-application|API binding/,
  );

  assert.throws(
    () =>
      assertFrontendProductionVersion({
        resources: {
          ...frontendVersion.resources,
          bindings: [{ name: "DB", type: "d1" }],
        },
      }),
    /API binding DB/,
  );
});

test("API deployment rejects a candidate missing any required production binding", () => {
  assert.doesNotThrow(() => assertApiProductionVersion(apiVersion));

  const withoutOperatorSecret = {
    ...apiVersion,
    resources: {
      ...apiVersion.resources,
      bindings: apiVersion.resources.bindings.filter(
        (binding) => binding.name !== "DIAG_GUARDIAN_EMAIL",
      ),
    },
  };

  assert.throws(
    () => assertApiProductionVersion(withoutOperatorSecret),
    /DIAG_GUARDIAN_EMAIL/,
  );

  const plaintextOperatorDesignation = {
    ...apiVersion,
    resources: {
      ...apiVersion.resources,
      bindings: apiVersion.resources.bindings.map((binding) =>
        binding.name === "DIAG_GUARDIAN_EMAIL"
          ? { name: binding.name, type: "plain_text" }
          : binding,
      ),
    },
  };

  assert.throws(
    () => assertApiProductionVersion(plaintextOperatorDesignation),
    /DIAG_GUARDIAN_EMAIL must be secret_text/,
  );
});

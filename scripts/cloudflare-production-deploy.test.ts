import assert from "node:assert/strict";
import test from "node:test";

import { runProductionDeployment } from "./cloudflare-production-deploy.ts";

const versionId = "11111111-2222-4333-8444-555555555555";

const apiBindingsWithoutOperator = [
  {
    name: "DB",
    type: "d1",
    database_id: "e6b236d6-e3ae-4ff8-9a7e-4874c8419c96",
  },
  { name: "AUTH_RATE_LIMITER", type: "ratelimit" },
  { name: "GUARDIAN_EMAIL_ALLOWLIST", type: "secret_text" },
  { name: "RESEND_API_KEY", type: "secret_text" },
];

test("API production deployment stops before traffic when candidate validation fails", async () => {
  const commands: string[][] = [];
  const run = async (_command: string, args: string[]) => {
    commands.push(args);
    if (args.includes("upload")) {
      return { stdout: `Worker Version ID: ${versionId}`, stderr: "" };
    }
    if (args.includes("view")) {
      return {
        stdout: JSON.stringify({
          resources: { script_runtime: {}, bindings: apiBindingsWithoutOperator },
        }),
        stderr: "",
      };
    }
    return { stdout: "", stderr: "" };
  };

  await assert.rejects(
    () =>
      runProductionDeployment("api", {
        env: { DIAG_GUARDIAN_EMAIL: "operator@example.com" },
        run,
      }),
    /DIAG_GUARDIAN_EMAIL/,
  );

  assert.equal(commands.some((args) => args.includes("deploy")), false);
});

test("frontend production deployment validates assets before deploying the exact candidate", async () => {
  const commands: string[][] = [];
  const run = async (_command: string, args: string[]) => {
    commands.push(args);
    if (args.includes("upload")) {
      return { stdout: `Worker Version ID: ${versionId}`, stderr: "" };
    }
    if (args.includes("view")) {
      return {
        stdout: JSON.stringify({
          resources: {
            script: { handlers: null },
            script_runtime: {
              assets: { not_found_handling: "single-page-application" },
            },
            bindings: [],
          },
        }),
        stderr: "",
      };
    }
    return { stdout: "", stderr: "" };
  };

  await runProductionDeployment("frontend", {
    env: { VITE_API_ORIGIN: "https://api.example.com" },
    run,
  });

  const upload = commands.find((args) => args.includes("upload"));
  assert.ok(upload?.includes("app/wrangler.toml"));
  assert.ok(
    commands.some(
      (args) => args.includes("deploy") && args.includes(versionId),
    ),
  );
});

test("frontend production deployment rejects a missing API origin before building or uploading", async () => {
  const commands: string[][] = [];
  const run = async (_command: string, args: string[]) => {
    commands.push(args);
    return { stdout: `Worker Version ID: ${versionId}`, stderr: "" };
  };

  await assert.rejects(
    () => runProductionDeployment("frontend", { env: {}, run }),
    /VITE_API_ORIGIN/,
  );

  assert.equal(commands.length, 0);
});

test("frontend production deployment forwards the supplied API origin to the build", async () => {
  const commands: string[][] = [];
  const buildOrigins: Array<string | undefined> = [];
  const apiOrigin = "https://api.example.com";
  const run = async (
    _command: string,
    args: string[],
    options?: { env?: NodeJS.ProcessEnv },
  ) => {
    commands.push(args);
    if (args.includes("build")) {
      buildOrigins.push(options?.env?.VITE_API_ORIGIN);
    }
    if (args.includes("upload")) {
      return { stdout: `Worker Version ID: ${versionId}`, stderr: "" };
    }
    if (args.includes("view")) {
      return {
        stdout: JSON.stringify({
          resources: {
            script: { handlers: null },
            script_runtime: {
              assets: { not_found_handling: "single-page-application" },
            },
            bindings: [],
          },
        }),
        stderr: "",
      };
    }
    return { stdout: "", stderr: "" };
  };

  await runProductionDeployment("frontend", {
    env: { VITE_API_ORIGIN: apiOrigin },
    run,
  });

  assert.deepEqual(buildOrigins, [apiOrigin]);
  assert.ok(
    commands.findIndex((args) => args.includes("build")) <
      commands.findIndex((args) => args.includes("upload")),
  );
});

import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import assert from "node:assert/strict";
import test from "node:test";

import {
  assertFrontendProductionBundle,
  runProductionDeployment,
} from "./cloudflare-production-deploy.ts";

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

const apiBindingsWithOperator = [
  ...apiBindingsWithoutOperator,
  { name: "DIAG_GUARDIAN_EMAIL", type: "secret_text" },
];

const createFrontendBundleFixture = async (): Promise<string> => {
  const directory = await mkdtemp(join(tmpdir(), "readers-way-build-test-"));
  await writeFile(
    join(directory, "index.js"),
    `const apiOrigin = "https://api.readersway.troyjohnson.dev";`,
  );
  return directory;
};

test("frontend production bundle rejects the old API origin and localhost fallback", async () => {
  const directory = await mkdtemp(join(tmpdir(), "readers-way-bundle-test-"));
  try {
    await writeFile(
      join(directory, "index.js"),
      `const apiOrigin = "https://api-flashcards.troyjohnson.workers.dev";`,
    );

    await assert.rejects(
      () => assertFrontendProductionBundle(directory),
      /must embed https:\/\/api\.readersway\.troyjohnson\.dev/,
    );
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
});

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

test("API production deployment applies configured routes after deploying the candidate", async () => {
  const commands: string[][] = [];
  const run = async (_command: string, args: string[]) => {
    commands.push(args);
    if (args.includes("upload")) {
      return { stdout: `Worker Version ID: ${versionId}`, stderr: "" };
    }
    if (args.includes("view")) {
      return {
        stdout: JSON.stringify({
          resources: { script_runtime: {}, bindings: apiBindingsWithOperator },
        }),
        stderr: "",
      };
    }
    return { stdout: "", stderr: "" };
  };

  await runProductionDeployment("api", {
    env: { DIAG_GUARDIAN_EMAIL: "operator@example.com" },
    run,
  });

  const versionDeployIndex = commands.findIndex(
    (args) => args.includes("versions") && args.includes("deploy"),
  );
  const triggerDeployIndex = commands.findIndex(
    (args) => args.includes("triggers") && args.includes("deploy"),
  );

  assert.ok(versionDeployIndex >= 0);
  assert.ok(triggerDeployIndex > versionDeployIndex);
  assert.deepEqual(commands[triggerDeployIndex], [
    "exec",
    "wrangler",
    "triggers",
    "deploy",
    "--config",
    "api/wrangler.toml",
    "--env",
    "production",
  ]);
});

test("frontend production deployment validates assets before deploying the exact candidate", async () => {
  const commands: string[][] = [];
  const frontendDistDirectory = await createFrontendBundleFixture();
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

  try {
    await runProductionDeployment("frontend", {
      env: { VITE_API_ORIGIN: "https://api.readersway.troyjohnson.dev" },
      frontendDistDirectory,
      run,
    });

    const upload = commands.find((args) => args.includes("upload"));
    assert.ok(upload?.includes("app/wrangler.toml"));
    assert.ok(
      commands.some(
        (args) => args.includes("deploy") && args.includes(versionId),
      ),
    );

    const versionDeployIndex = commands.findIndex(
      (args) => args.includes("versions") && args.includes("deploy"),
    );
    const triggerDeployIndex = commands.findIndex(
      (args) => args.includes("triggers") && args.includes("deploy"),
    );

    assert.ok(versionDeployIndex >= 0);
    assert.ok(triggerDeployIndex > versionDeployIndex);
    assert.deepEqual(commands[triggerDeployIndex], [
      "exec",
      "wrangler",
      "triggers",
      "deploy",
      "--config",
      "app/wrangler.toml",
    ]);
  } finally {
    await rm(frontendDistDirectory, { recursive: true, force: true });
  }
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

test("frontend production deployment rejects the cross-site workers.dev API origin", async () => {
  const commands: string[][] = [];
  const run = async (_command: string, args: string[]) => {
    commands.push(args);
    return { stdout: `Worker Version ID: ${versionId}`, stderr: "" };
  };

  await assert.rejects(
    () =>
      runProductionDeployment("frontend", {
        env: { VITE_API_ORIGIN: "https://api-flashcards.troyjohnson.workers.dev" },
        run,
      }),
    /same-site.*api\.readersway\.troyjohnson\.dev/i,
  );

  assert.equal(commands.length, 0);
});

test("frontend production deployment forwards the supplied API origin to the build", async () => {
  const commands: string[][] = [];
  const buildOrigins: Array<string | undefined> = [];
  const apiOrigin = "https://api.readersway.troyjohnson.dev";
  const frontendDistDirectory = await createFrontendBundleFixture();
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

  try {
    await runProductionDeployment("frontend", {
      env: { VITE_API_ORIGIN: apiOrigin },
      frontendDistDirectory,
      run,
    });

    assert.deepEqual(buildOrigins, [apiOrigin]);
    assert.ok(
      commands.findIndex((args) => args.includes("build")) <
        commands.findIndex((args) => args.includes("upload")),
    );
  } finally {
    await rm(frontendDistDirectory, { recursive: true, force: true });
  }
});

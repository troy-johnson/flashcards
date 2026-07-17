import { spawn } from "node:child_process";
import { mkdtemp, readdir, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { pathToFileURL } from "node:url";

import {
  assertApiProductionVersion,
  assertFrontendProductionVersion,
} from "./cloudflare-deployment-contract.ts";

type Target = "api" | "frontend";
type CommandResult = { stdout: string; stderr: string };
type CommandRunnerOptions = { env?: NodeJS.ProcessEnv };
type CommandRunner = (
  command: string,
  args: string[],
  options?: CommandRunnerOptions,
) => Promise<CommandResult>;

type DeploymentDependencies = {
  env: Partial<NodeJS.ProcessEnv>;
  run: CommandRunner;
  frontendDistDirectory?: string;
};

export const productionApiOrigin =
  "https://api.readersway.troyjohnson.dev";

const versionIdPattern =
  /\b[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\b/i;

const frontendTextExtensions = new Set([".css", ".html", ".js", ".json", ".map", ".svg"]);

const frontendTextFiles = async (directory: string): Promise<string[]> => {
  const entries = await readdir(directory, { withFileTypes: true });
  const files: string[] = [];
  for (const entry of entries) {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) {
      files.push(...(await frontendTextFiles(path)));
      continue;
    }
    const extension = entry.name.slice(entry.name.lastIndexOf(".")).toLowerCase();
    if (frontendTextExtensions.has(extension)) files.push(path);
  }
  return files;
};

export const assertFrontendProductionBundle = async (
  directory = join(process.cwd(), "app", "dist"),
  expectedApiOrigin = productionApiOrigin,
): Promise<void> => {
  const files = await frontendTextFiles(directory);
  const contents = await Promise.all(files.map((path) => readFile(path, "utf8")));
  const bundle = contents.join("\n");

  if (!bundle.includes(expectedApiOrigin)) {
    throw new Error(
      `frontend production bundle must embed ${expectedApiOrigin}`,
    );
  }

  for (const forbiddenOrigin of [
    "http://localhost:8787",
    "https://api-flashcards.troyjohnson.workers.dev",
  ]) {
    if (bundle.includes(forbiddenOrigin)) {
      throw new Error(
        `frontend production bundle must not embed ${forbiddenOrigin}`,
      );
    }
  }
};

const defaultRunner: CommandRunner = (command, args, options) =>
  new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      env: options?.env ?? process.env,
      stdio: ["ignore", "pipe", "pipe"],
    });
    let stdout = "";
    let stderr = "";

    child.stdout.setEncoding("utf8");
    child.stderr.setEncoding("utf8");
    child.stdout.on("data", (chunk) => {
      stdout += chunk;
      process.stdout.write(chunk);
    });
    child.stderr.on("data", (chunk) => {
      stderr += chunk;
      process.stderr.write(chunk);
    });
    child.on("error", reject);
    child.on("close", (code) => {
      if (code === 0) {
        resolve({ stdout, stderr });
        return;
      }
      reject(new Error(`${command} exited with status ${String(code)}`));
    });
  });

const uploadVersion = async (
  target: Target,
  run: CommandRunner,
  secretsFile?: string,
) => {
  const config = target === "api" ? "api/wrangler.toml" : "app/wrangler.toml";
  const args = [
    "exec",
    "wrangler",
    "versions",
    "upload",
    "--config",
    config,
    "--message",
    `Validated ${target} production candidate`,
  ];
  if (target === "api") {
    args.push("--env", "production");
  }
  if (secretsFile) {
    args.push("--secrets-file", secretsFile);
  }

  const result = await run("pnpm", args);
  const versionId = result.stdout.match(versionIdPattern)?.[0];
  if (!versionId) {
    throw new Error("Wrangler upload did not return a Worker version ID");
  }
  return { config, versionId };
};

const inspectVersion = async (
  target: Target,
  config: string,
  versionId: string,
  run: CommandRunner,
) => {
  const args = [
    "exec",
    "wrangler",
    "versions",
    "view",
    versionId,
    "--config",
    config,
    "--json",
  ];
  if (target === "api") {
    args.push("--env", "production");
  }

  const result = await run("pnpm", args);
  return JSON.parse(result.stdout) as Parameters<
    typeof assertApiProductionVersion
  >[0];
};

const deployVersion = async (
  target: Target,
  config: string,
  versionId: string,
  run: CommandRunner,
) => {
  const args = [
    "exec",
    "wrangler",
    "versions",
    "deploy",
    versionId,
    "--config",
    config,
    "--message",
    `Deploy validated ${target} production candidate`,
    "--yes",
  ];
  if (target === "api") {
    args.push("--env", "production");
  }
  await run("pnpm", args);
};

export const runProductionDeployment = async (
  target: Target,
  dependencies: Partial<DeploymentDependencies> = {},
): Promise<void> => {
  const env = dependencies.env ?? process.env;
  const run = dependencies.run ?? defaultRunner;
  let temporaryDirectory: string | undefined;

  try {
    let secretsFile: string | undefined;
    if (target === "frontend") {
      const apiOrigin = env.VITE_API_ORIGIN?.trim();
      if (!apiOrigin) {
        throw new Error(
          "VITE_API_ORIGIN must be configured in the frontend production build environment",
        );
      }
      if (apiOrigin !== productionApiOrigin) {
        throw new Error(
          `VITE_API_ORIGIN must use the same-site production API origin ${productionApiOrigin}`,
        );
      }
      await run(
        "pnpm",
        ["--filter", "app", "build"],
        {
          env: { ...process.env, ...env, VITE_API_ORIGIN: apiOrigin },
        },
      );
      await assertFrontendProductionBundle(dependencies.frontendDistDirectory);
    } else {
      const operatorEmail = env.DIAG_GUARDIAN_EMAIL?.trim();
      if (!operatorEmail) {
        throw new Error(
          "DIAG_GUARDIAN_EMAIL must be configured in the API production build environment",
        );
      }
      temporaryDirectory = await mkdtemp(join(tmpdir(), "readers-way-deploy-"));
      secretsFile = join(temporaryDirectory, "secrets.json");
      await writeFile(
        secretsFile,
        JSON.stringify({ DIAG_GUARDIAN_EMAIL: operatorEmail }),
        { mode: 0o600 },
      );
    }

    const candidate = await uploadVersion(target, run, secretsFile);
    const metadata = await inspectVersion(
      target,
      candidate.config,
      candidate.versionId,
      run,
    );

    if (target === "api") {
      assertApiProductionVersion(metadata);
    } else {
      assertFrontendProductionVersion(metadata);
    }

    await deployVersion(
      target,
      candidate.config,
      candidate.versionId,
      run,
    );
  } finally {
    if (temporaryDirectory) {
      await rm(temporaryDirectory, { recursive: true, force: true });
    }
  }
};

const isMain =
  process.argv[1] !== undefined &&
  pathToFileURL(process.argv[1]).href === import.meta.url;

if (isMain) {
  const target = process.argv[2];
  if (target !== "api" && target !== "frontend") {
    throw new Error("Usage: tsx scripts/cloudflare-production-deploy.ts api|frontend");
  }
  runProductionDeployment(target).catch((error: unknown) => {
    console.error(error);
    process.exitCode = 1;
  });
}

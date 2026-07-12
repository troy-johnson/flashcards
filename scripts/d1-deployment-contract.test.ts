import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { test } from "node:test";
import { resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");
const wranglerConfig = readFileSync(resolve(root, "api/wrangler.toml"), "utf8");
const ciWorkflow = readFileSync(resolve(root, ".github/workflows/ci.yml"), "utf8");
const deploymentSetup = readFileSync(resolve(root, "docs/state/deployment-setup.md"), "utf8");
const operatorPlan = readFileSync(resolve(root, "docs/plans/005a-production-operator-capabilities.md"), "utf8");

const tomlSection = (section: string) => {
  const header = `[${section}]`;
  const start = wranglerConfig.indexOf(header);
  assert.notEqual(start, -1, `missing ${header}`);

  const remainder = wranglerConfig.slice(start + header.length);
  const nextSection = remainder.search(/^\s*\[{1,2}[^\n]+\]{1,2}\s*$/m);
  return nextSection === -1 ? remainder : remainder.slice(0, nextSection);
};

const environmentDatabase = (environment: "preview" | "production") => {
  const marker = `[[env.${environment}.d1_databases]]`;
  const start = wranglerConfig.indexOf(marker);
  assert.notEqual(start, -1, `missing ${marker}`);

  const remainder = wranglerConfig.slice(start + marker.length);
  const nextSection = remainder.search(/\n\[/);
  const block = nextSection === -1 ? remainder : remainder.slice(0, nextSection);
  const value = (key: "database_name" | "database_id") => {
    const match = block.match(new RegExp(`^${key}\\s*=\\s*"([^"]+)"`, "m"));
    assert.ok(match, `missing ${key} in ${marker}`);
    return match[1];
  };

  return { name: value("database_name"), id: value("database_id") };
};

test("preview and production bind distinct remote D1 databases", () => {
  const preview = environmentDatabase("preview");
  const production = environmentDatabase("production");

  assert.equal(production.name, "literacy_prod");
  assert.equal(production.id, "e6b236d6-e3ae-4ff8-9a7e-4874c8419c96");
  assert.notEqual(production.id, preview.id);
});

test("production enrollment is allowlisted while local and preview stay open", () => {
  assert.match(
    wranglerConfig,
    /\[vars\][\s\S]*?AUTH_ACCESS_MODE\s*=\s*"open"[\s\S]*?\[\[d1_databases\]\]/,
  );
  assert.match(
    wranglerConfig,
    /\[env\.preview\.vars\][\s\S]*?AUTH_ACCESS_MODE\s*=\s*"open"[\s\S]*?\[\[env\.preview\.d1_databases\]\]/,
  );
  assert.match(
    wranglerConfig,
    /\[env\.production\.vars\][\s\S]*?AUTH_ACCESS_MODE\s*=\s*"allowlist"[\s\S]*?\[\[env\.production\.d1_databases\]\]/,
  );
});

test("production operator designation is secret-backed without committing a real address", () => {
  assert.match(
    tomlSection("vars"),
    /^DIAG_GUARDIAN_EMAIL\s*=\s*"local-guardian@example\.com"\s*$/m,
  );
  assert.match(
    tomlSection("env.preview.vars"),
    /^DIAG_GUARDIAN_EMAIL\s*=\s*"pilot-guardian@example\.com"\s*$/m,
  );
  assert.doesNotMatch(
    tomlSection("env.production.vars"),
    /^DIAG_GUARDIAN_EMAIL\s*=/m,
  );

  const committedDesignations = [
    ...wranglerConfig.matchAll(/^DIAG_GUARDIAN_EMAIL\s*=\s*"([^"]+)"\s*$/gm),
  ].map((match) => match[1]);
  assert.deepEqual(committedDesignations, [
    "local-guardian@example.com",
    "pilot-guardian@example.com",
  ]);
});

test("production operator secret instructions use the versioned Worker workflow", () => {
  for (const instructions of [deploymentSetup, operatorPlan]) {
    assert.match(
      instructions,
      /wrangler versions upload --env production[\s\S]*wrangler versions secret put DIAG_GUARDIAN_EMAIL --env production[\s\S]*wrangler versions view <version-id> --env production --json[\s\S]*wrangler deployments status --env production --json/,
    );
    assert.match(
      instructions,
      /version ID returned by (?:the )?secret command/i,
    );
    assert.match(
      instructions,
      /stale[\s\S]{0,100}preview bindings/i,
    );
    assert.match(
      instructions,
      /never deploy/i,
    );
    assert.match(
      instructions,
      /(?:production traffic remains|100% of production traffic)/i,
    );
    assert.doesNotMatch(
      instructions,
      /wrangler secret put DIAG_GUARDIAN_EMAIL --env production/,
    );
  }
});

test("production config includes the public magic-link abuse limiter", () => {
  assert.match(
    wranglerConfig,
    /\[\[env\.production\.ratelimits\]\][\s\S]*?name\s*=\s*"AUTH_RATE_LIMITER"[\s\S]*?namespace_id\s*=\s*"917403"[\s\S]*?\[env\.production\.ratelimits\.simple\][\s\S]*?limit\s*=\s*10[\s\S]*?period\s*=\s*60/,
  );
});

test("the automatic main-branch migration path explicitly targets preview only", () => {
  assert.match(
    ciWorkflow,
    /wrangler d1 migrations apply literacy_preview --env preview --remote/,
  );
  assert.doesNotMatch(ciWorkflow, /wrangler d1 migrations apply literacy_prod/);
});

test("production migrations require a gated manual workflow", () => {
  const workflowPath = resolve(root, ".github/workflows/migrate-production-d1.yml");
  assert.ok(existsSync(workflowPath), "missing manual production D1 workflow");

  const workflow = readFileSync(workflowPath, "utf8");
  assert.match(workflow, /workflow_dispatch:/);
  assert.doesNotMatch(workflow, /^\s+push:/m);
  assert.match(workflow, /environment: production-d1/);
  assert.match(workflow, /EXTERNAL_GUARDIAN_PILOT/);
  assert.match(workflow, /CONFIRM_DATABASE/);
  assert.match(
    workflow,
    /wrangler d1 info literacy_prod --env production --json/,
  );
  assert.match(
    workflow,
    /wrangler d1 time-travel info literacy_prod --env production --json/,
  );
  assert.match(
    workflow,
    /wrangler d1 migrations apply literacy_prod --env production --remote/,
  );
  assert.match(workflow, /FROM d1_migrations/);
  assert.doesNotMatch(
    workflow,
    /https:\/\/api-flashcards\.troyjohnson\.workers\.dev\/auth\/me/,
  );
  assert.doesNotMatch(workflow, /name IN \('guardian', 'auth_token'/);
});

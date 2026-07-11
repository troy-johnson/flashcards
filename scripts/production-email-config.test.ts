import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const wranglerConfig = readFileSync(
  new URL("../api/wrangler.toml", import.meta.url),
  "utf8"
);

const productionVars = wranglerConfig.match(
  /\[env\.production\.vars\]([\s\S]*?)(?=\n\[|$)/
)?.[1];

test("production sends magic links through a configured email provider", () => {
  assert.ok(productionVars, "api/wrangler.toml must define env.production.vars");
  assert.match(productionVars, /AUTH_EMAIL_ISSUER = "resend"/);
  assert.match(productionVars, /EMAIL_FROM = "[^"]*@troyjohnson\.dev>"/);
  assert.doesNotMatch(productionVars, /EMAIL_FROM = "[^"]*@example\.com>"/);
  assert.doesNotMatch(productionVars, /EMAIL_FROM = "[^"]*@resend\.dev>"/);
});

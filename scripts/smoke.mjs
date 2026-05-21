import { chromium, request } from "playwright";
import crypto from "node:crypto";
import { execFileSync } from "node:child_process";

const APP = process.env.SMOKE_APP_ORIGIN || "http://localhost:5173";
const API = process.env.SMOKE_API_ORIGIN || "http://localhost:8787";
const DEPLOYED = process.env.SMOKE_DEPLOYED_WORKER || "";
const REPO = process.env.SMOKE_REPO || "/Users/troyjohnson/projects/flashcards";

const fail = (msg) => { console.error("FAIL:", msg); process.exit(1); };
const ok = (msg) => console.log("PASS:", msg);
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const d1 = (sql) => {
  execFileSync("pnpm", ["--filter", "api", "exec", "wrangler", "d1", "execute", "literacy_preview", "--local", "--command", sql], {
    cwd: REPO,
    stdio: ["ignore", "pipe", "pipe"]
  });
};

const seedGuardianWithToken = (email) => {
  const guardianId = "g_" + crypto.randomBytes(6).toString("hex");
  const token = crypto.randomBytes(32).toString("hex");
  const hash = crypto.createHash("sha256").update(token).digest("hex");
  const now = new Date().toISOString();
  const expires = new Date(Date.now() + 15 * 60 * 1000).toISOString();
  d1(`DELETE FROM auth_token WHERE guardian_id IN (SELECT id FROM guardian WHERE email = '${email}')`);
  d1(`DELETE FROM session WHERE guardian_id IN (SELECT id FROM guardian WHERE email = '${email}')`);
  d1(`DELETE FROM student WHERE guardian_id IN (SELECT id FROM guardian WHERE email = '${email}')`);
  d1(`DELETE FROM guardian WHERE email = '${email}'`);
  d1(`INSERT INTO guardian (id, email, role, created_at) VALUES ('${guardianId}', '${email}', 'guardian', '${now}')`);
  d1(`INSERT INTO auth_token (token_hash, guardian_id, expires_at) VALUES ('${hash}', '${guardianId}', '${expires}')`);
  return { token, guardianId };
};

const browser = await chromium.launch();
const ctx = await browser.newContext();
const page = await ctx.newPage();
page.on("pageerror", (err) => console.log("[page-error]", err.message));

try {
  // 0. App health
  await page.goto(APP + "/");
  await page.waitForSelector("text=Sign in");
  ok("app landing rendered");

  // 1. Sign in via /signin form (validates /auth/start contract end-to-end)
  await page.click("a:has-text('Sign in')");
  await page.waitForSelector("input[name=email]");
  await page.fill("input[name=email]", "smoke-guardian@example.com");
  await page.locator("form").filter({ has: page.locator("input[name=email]") }).getByRole("button", { name: /Send magic link/i }).click();
  await page.waitForSelector("text=Check your email");
  ok("/auth/start accepted email and rendered confirmation");

  // 2. Seed a known token for the same guardian and use the magic-link path
  // (the /auth/start above issued a token to stdout; we ignore it and seed our own)
  let { token } = seedGuardianWithToken("smoke-guardian@example.com");
  await page.goto(`${APP}/auth/consume?token=${token}`);
  await page.waitForURL(APP + "/guardian", { timeout: 10000 });
  ok("app /auth/consume → API /auth/consume → /guardian (cookie set)");

  // 3. Add a student
  await page.click("a:has-text('Add a student')");
  await page.waitForSelector("input[name=display_name]");
  console.log("[debug] add-student url=" + page.url());
  await page.fill("input[name=display_name]", "Ada");
  await page.selectOption("select[name=grade]", "K");
  const responsePromise = page.waitForResponse((r) => r.url().endsWith("/students") && r.request().method() === "POST", { timeout: 10000 }).catch((e) => ({ status: () => "no-response", _err: e.message }));
  await page.getByRole("button", { name: "Create student" }).click();
  const res = await responsePromise;
  console.log("[debug] POST /students =", res.status?.() ?? res);
  await page.waitForSelector("text=Ada is ready");
  ok("created student Ada");

  // 4. Open dashboard
  await page.click("a:has-text('Open dashboard')");
  await page.waitForSelector("text=Start practice");
  ok("opened student dashboard");

  // 5. Start practice → drill
  await page.click("a:has-text('Start practice')");
  await page.waitForSelector("h1:has-text('Today:')");
  const todayHeader = await page.textContent("h1");
  if (!/Today: \d+ things/.test(todayHeader || "")) fail(`play start header: ${todayHeader}`);
  ok(`play start: ${todayHeader.trim()}`);
  await page.click("button:has-text('Start')");
  await page.waitForSelector(".phonics-card");
  ok("entered drill");

  // 6. Tap through all cards
  let taps = 0;
  for (;;) {
    const done = await page.locator("text=/You['’]re done/").count();
    if (done > 0) break;
    if (taps > 20) fail("did not reach done after 20 taps");
    await page.click("button[data-result='correct']");
    taps += 1;
    await sleep(250);
  }
  ok(`reached done page after ${taps} taps`);

  // 7. /guardian/diag should deny non-DIAG guardian
  await page.goto(APP + "/guardian/diag");
  await page.waitForSelector("text=Diagnostics");
  await page.waitForSelector("text=may not have access", { timeout: 5000 });
  ok("/guardian/diag denies non-DIAG guardian");

  // 8. Sign out, sign in as DIAG guardian (local-guardian@example.com), expect 200
  await page.click("a:has-text('Back to dashboard')");
  await page.waitForURL(APP + "/guardian");
  await page.click("button:has-text('Sign out')");
  await page.waitForURL(APP + "/");

  ({ token } = seedGuardianWithToken("local-guardian@example.com"));
  await page.goto(`${APP}/auth/consume?token=${token}`);
  await page.waitForURL(APP + "/guardian");
  await page.goto(APP + "/guardian/diag");
  await page.waitForSelector("text=Diagnostics");
  const blocked = await page.locator("text=may not have access").count();
  if (blocked !== 0) fail("DIAG guardian unexpectedly blocked from /guardian/diag");
  ok("/guardian/diag accessible to DIAG guardian");

  // 9. Deployed-worker parity (HTTP-only)
  if (DEPLOYED) {
    const req = await request.newContext();
    const me = await req.get(DEPLOYED + "/auth/me");
    if (me.status() !== 401) fail(`deployed /auth/me expected 401, got ${me.status()}`);
    ok("deployed /auth/me returns 401 unauthenticated");
    const diag = await req.get(DEPLOYED + "/guardian/diag");
    if (diag.status() !== 401) fail(`deployed /guardian/diag expected 401, got ${diag.status()}`);
    ok("deployed /guardian/diag returns 401 unauthenticated");
  }

  console.log("\nSMOKE: ALL PASS");
} catch (err) {
  console.error("\nSMOKE: ERROR", err);
  try {
    console.error("page url:", page.url());
    const body = await page.evaluate(() => document.body.innerText.slice(0, 500));
    console.error("page body:", body);
  } catch {}
  await page.screenshot({ path: "/tmp/smoke-fail.png", fullPage: true }).catch(() => {});
  process.exit(1);
} finally {
  await browser.close();
}

/**
 * Walk every reachable screen and capture screenshots + a full-flow video.
 *
 * Usage:
 *   pnpm dev   # in another terminal: both app:5173 and api:8787
 *   node scripts/walkthrough.mjs
 *
 * Output: docs/design/walkthrough/<timestamp>/
 *   - mobile/*.png, desktop/*.png — per-route stills
 *   - flow.webm                   — mobile end-to-end recording
 */

import { chromium } from "playwright";
import { mkdir, rename, readdir } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");
const APP = "http://localhost:5173";
const API = "http://localhost:8787";

const stamp = new Date().toISOString().replace(/[:.]/g, "-").slice(0, 19);
const outDir = join(ROOT, "docs/design/walkthrough", stamp);
const mobileDir = join(outDir, "mobile");
const desktopDir = join(outDir, "desktop");
await mkdir(mobileDir, { recursive: true });
await mkdir(desktopDir, { recursive: true });

const log = (msg) => console.log(`[walkthrough] ${msg}`);
const wait = (ms) => new Promise((r) => setTimeout(r, ms));

const shot = async (page, dir, name) => {
  const file = join(dir, `${name}.png`);
  await page.screenshot({ path: file, fullPage: true });
  log(`  · ${name}`);
};

/**
 * Tour for a given viewport. Records video into <dir>/video/ if recordVideo set.
 */
const tour = async (browser, label, dir, viewport, recordVideo) => {
  const context = await browser.newContext({
    viewport,
    recordVideo: recordVideo ? { dir: join(outDir, "video-raw"), size: viewport } : undefined
  });
  const page = await context.newPage();
  page.on("pageerror", (err) => log(`!! pageerror (${label}): ${err.message}`));

  log(`-- ${label} (${viewport.width}x${viewport.height})`);

  // Public ------------------------------------------------------------
  await page.goto(APP);
  await page.waitForLoadState("networkidle");
  await shot(page, dir, "01-landing");

  await page.goto(`${APP}/signin`);
  await page.waitForSelector('input[name="email"]');
  await shot(page, dir, "02-signin-idle");

  await page.fill('input[name="email"]', `walkthrough-${label}@example.com`);
  await page.click('button[type="submit"]');
  await page.waitForSelector(".dev-magic-link a", { timeout: 5000 });
  await shot(page, dir, "03-signin-sent");

  const link = await page.locator(".dev-magic-link a").getAttribute("href");
  if (!link) throw new Error("no dev magic link rendered on /signin");
  await page.goto(link);
  await page.waitForURL("**/guardian");

  // Guardian ----------------------------------------------------------
  await page.waitForLoadState("networkidle");
  await shot(page, dir, "04-guardian-dashboard");

  await page.goto(`${APP}/guardian/diag`);
  await page.waitForLoadState("networkidle");
  await shot(page, dir, "05-guardian-diag");

  await page.goto(`${APP}/guardian/add-student`);
  await page.waitForSelector('input[name="display_name"]');
  await shot(page, dir, "06-add-student-form");

  await page.fill('input[name="display_name"]', `Demo ${label}`);
  await page.selectOption('select[name="grade"]', "K");
  await page.click('button:has-text("Create student")');
  await Promise.race([
    page.waitForSelector('[role="status"]', { timeout: 5000 }).catch(() => null),
    page.waitForSelector('[role="alert"]', { timeout: 5000 }).catch(() => null)
  ]);
  await wait(200);
  await shot(page, dir, "07-add-student-success");

  // Pick any student to drill into the per-student screens.
  await page.goto(`${APP}/guardian`);
  await page.waitForLoadState("networkidle");
  const firstStudent = await page
    .locator('a[href^="/guardian/"]:not([href$="/diag"]):not([href$="/add-student"])')
    .first();
  const href = await firstStudent.getAttribute("href");
  if (!href) throw new Error("no student link found on /guardian after add-student");
  const studentId = href.replace("/guardian/", "");

  await page.goto(`${APP}/guardian/${studentId}`);
  await page.waitForLoadState("networkidle");
  await shot(page, dir, "08-student-dashboard");

  await page.goto(`${APP}/guardian/${studentId}/settings`);
  await page.waitForLoadState("networkidle");
  await shot(page, dir, "09-student-settings");

  // Practice flow -----------------------------------------------------
  await page.goto(`${APP}/play/${studentId}`);
  await page.waitForLoadState("networkidle");
  await shot(page, dir, "10-play-start");

  // Try to enter the drill. May land on an error state if content
  // isn't seeded — capture whatever we see.
  try {
    await page.click('button:has-text("Start")', { timeout: 2000 });
    await page.waitForLoadState("networkidle");
  } catch {
    log("  · could not click Start (no practice session?)");
  }
  await shot(page, dir, "11-play-drill");

  await page.goto(`${APP}/play/${studentId}/done`);
  await page.waitForLoadState("networkidle");
  await shot(page, dir, "12-play-done");

  await context.close();

  // Move the auto-named video to a stable path.
  if (recordVideo) {
    const rawDir = join(outDir, "video-raw");
    const files = await readdir(rawDir);
    const webm = files.find((f) => f.endsWith(".webm"));
    if (webm) await rename(join(rawDir, webm), join(outDir, "flow.webm"));
  }
};

// ---------------------------------------------------------------------
const browser = await chromium.launch();

await tour(browser, "mobile", mobileDir, { width: 390, height: 844 }, true);
await tour(browser, "desktop", desktopDir, { width: 1280, height: 800 }, false);

await browser.close();
log(`done — see ${outDir}`);

# Reader's Way Copy Package Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Create a shared `copy` workspace package that is the single source of truth for Reader's Way brand/UI copy, and wire the app landing surface and the magic-link email to it.

**Architecture:** A new TypeScript-only pnpm workspace package `packages/copy` exports typed copy constants. The `app` (Vite/React) and `api` (Cloudflare Worker/Hono) packages depend on it via `workspace:*` and import named constants instead of hard-coding brand strings. A future rename edits one file, type-checked across both consumers.

**Tech Stack:** pnpm workspaces, TypeScript (bundler module resolution), Vite, Vitest, Hono.

**Resolves:** Spec 002 planning nit 1 (FR1–FR3, G2, D2, AC1, AC2). Brand/UI chrome only — instructional content stays in `content/`.

---

### Task 1: Create the `copy` workspace package

**Files:**
- Create: `packages/copy/package.json`
- Create: `packages/copy/index.ts`
- Create: `packages/copy/tsconfig.json`
- Modify: `pnpm-workspace.yaml`

- [ ] **Step 1: Add the package directory to the workspace globs**

Replace the contents of `pnpm-workspace.yaml` with:

```yaml
packages:
  - app
  - api
  - packages/*
```

- [ ] **Step 2: Create the package manifest**

Create `packages/copy/package.json`. The `exports`/`types` point at the raw `.ts`; consumers use bundler resolution and transpile it themselves (Vite transpiles linked workspace deps; wrangler/esbuild bundles the worker; both tsconfigs use bundler resolution).

```json
{
  "name": "copy",
  "private": true,
  "version": "0.0.0",
  "type": "module",
  "exports": {
    ".": "./index.ts"
  },
  "types": "./index.ts"
}
```

- [ ] **Step 3: Create a tsconfig for the package**

Create `packages/copy/tsconfig.json`:

```json
{
  "extends": "../../tsconfig.base.json",
  "compilerOptions": {
    "noEmit": true
  },
  "include": ["index.ts"]
}
```

- [ ] **Step 4: Write the copy constants**

Create `packages/copy/index.ts`. This is the FR1 surface — brand/UI chrome only.

```ts
/**
 * Single source of truth for Reader's Way brand/UI copy (Spec 002 FR1–FR3).
 * Brand chrome ONLY — instructional content (skills, words, sentences, audio)
 * lives in content/ and must never move here (FR3/AC2).
 *
 * A product rename should require editing only this file.
 */

export const productName = "Reader's Way";

export const productPositioning =
  "Short, structured reading practice that helps young readers build calm confidence with a caring adult nearby.";

export const landing = {
  eyebrow: productName,
  headline: "Short, calm reading practice with your child.",
  subtitle:
    "Daily 8–10 minute sessions for kindergarten and 1st-grade readers. You sit with your child; the app handles what comes next."
} as const;

export const onboarding = {
  headline: "Add your child",
  subtitle: "First name, grade, a few preferences. About a minute."
} as const;

export const magicLinkEmail = {
  /** Subject line for the magic-link email (FR20, FR21). */
  subject: `Sign in to ${productName}`,
  /** Greeting/purpose line (FR21: why the recipient is receiving this). */
  purpose: `You asked to sign in to ${productName}. Use the button or link below to finish signing in.`,
  /** Call to action label. */
  cta: `Sign in to ${productName}`,
  /** Expiration/time-sensitivity language (FR21). */
  expiry: "This link expires in 15 minutes for your security.",
  /** Ignore-if-unrequested language (FR21). */
  ignore: `If you did not request this, you can safely ignore this email — no one can sign in without this link.`
} as const;

export const support = {
  /** Display name used in privacy/contact copy where practical (FR1). */
  displayName: productName
} as const;
```

- [ ] **Step 5: Install so the workspace links the new package**

Run: `pnpm install`
Expected: completes without error; `packages/copy` is recognized as a workspace package (no "copy" unmet peer warnings).

- [ ] **Step 6: Commit**

```bash
git add pnpm-workspace.yaml packages/copy/package.json packages/copy/index.ts packages/copy/tsconfig.json
git commit -m "feat(copy): add shared brand/copy workspace package"
```

---

### Task 2: Consume `copy` in the app landing surface

**Files:**
- Modify: `app/package.json` (add dependency)
- Modify: `app/src/App.tsx` (LandingRoute)
- Test: `app/src/copy.test.ts` (new)

- [ ] **Step 1: Add the workspace dependency**

In `app/package.json`, add `copy` to `dependencies` (keep existing entries):

```json
  "dependencies": {
    "copy": "workspace:*",
    "react": "^19.2.6",
    "react-dom": "^19.2.6"
  },
```

Run: `pnpm install`
Expected: `app/node_modules/copy` is symlinked to `packages/copy`.

- [ ] **Step 2: Write the failing cross-package resolution test**

This test proves the workspace import resolves and transpiles in the app's Vitest/bundler context — the real integration risk.

Create `app/src/copy.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { productName, landing } from "copy";

describe("copy package", () => {
  it("exposes the product name as the single source of truth", () => {
    expect(productName).toBe("Reader's Way");
  });

  it("uses the product name in the landing eyebrow", () => {
    expect(landing.eyebrow).toBe(productName);
  });
});
```

- [ ] **Step 3: Run the test to verify it passes resolution**

Run: `pnpm --filter app exec vitest run src/copy.test.ts`
Expected: PASS (both assertions). If it fails with "Cannot find module 'copy'", re-run `pnpm install` and confirm Task 1 Step 2 `exports` field.

- [ ] **Step 4: Replace hard-coded landing copy with the package**

In `app/src/App.tsx`, add the import near the top (after the existing `import "./App.css";` line is fine, but imports must precede it — place with the other imports):

```tsx
import { landing } from "copy";
```

Then in `LandingRoute`, replace the hard-coded hero strings. Change:

```tsx
          <p className="eyebrow">Literacy practice</p>
          <h1>Short, calm reading practice with your child.</h1>
          <p className="landing-lede">
            Daily 8&ndash;10 minute sessions for kindergarten and 1st-grade readers.
            You sit with your child; the app handles what comes next.
          </p>
```

to:

```tsx
          <p className="eyebrow">{landing.eyebrow}</p>
          <h1>{landing.headline}</h1>
          <p className="landing-lede">{landing.subtitle}</p>
```

- [ ] **Step 5: Typecheck and build the app**

Run: `pnpm --filter app typecheck`
Expected: PASS (no errors).

Run: `pnpm --filter app build`
Expected: Vite build succeeds (proves the linked `.ts` package transpiles in the production bundle).

- [ ] **Step 6: Commit**

```bash
git add app/package.json app/src/App.tsx app/src/copy.test.ts pnpm-lock.yaml
git commit -m "feat(app): source landing brand copy from copy package"
```

---

### Task 3: Build the magic-link email content from `copy` in the api

**Files:**
- Modify: `api/package.json` (add dependency)
- Create: `api/src/email/content.ts`
- Test: `api/src/email/content.test.ts` (new)
- Modify: `api/src/email/magic-link.ts`

- [ ] **Step 1: Add the workspace dependency**

In `api/package.json`, add `copy` to `dependencies` (keep existing entries):

```json
  "dependencies": {
    "@hono/zod-validator": "^0.4.2",
    "copy": "workspace:*",
    "hono": "^4.6.16",
    "ulid": "^2.3.0",
    "zod": "^3.24.1"
  },
```

Run: `pnpm install`
Expected: `api/node_modules/copy` is symlinked to `packages/copy`.

- [ ] **Step 2: Write the failing email-content test**

Create `api/src/email/content.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { buildMagicLinkEmail } from "./content";

describe("buildMagicLinkEmail", () => {
  const email = buildMagicLinkEmail("https://app.test/auth/consume?token=abc");

  it("brands the subject with the product name (FR20)", () => {
    expect(email.subject).toBe("Sign in to Reader's Way");
  });

  it("includes purpose, the sign-in link, expiry, and ignore language (FR21)", () => {
    expect(email.text).toContain("Reader's Way");
    expect(email.text).toContain("https://app.test/auth/consume?token=abc");
    expect(email.text.toLowerCase()).toContain("expires");
    expect(email.text.toLowerCase()).toContain("ignore");
  });
});
```

- [ ] **Step 3: Run the test to verify it fails**

Run: `pnpm --filter api exec vitest run src/email/content.test.ts`
Expected: FAIL with "Cannot find module './content'".

- [ ] **Step 4: Implement the email content builder**

Create `api/src/email/content.ts`:

```ts
import { magicLinkEmail } from "copy";

export interface MagicLinkEmailContent {
  subject: string;
  text: string;
}

/** Composes the magic-link email body from centralized copy (Spec 002 FR1, FR20, FR21). */
export const buildMagicLinkEmail = (url: string): MagicLinkEmailContent => ({
  subject: magicLinkEmail.subject,
  text: [
    magicLinkEmail.purpose,
    "",
    `${magicLinkEmail.cta}: ${url}`,
    "",
    magicLinkEmail.expiry,
    "",
    magicLinkEmail.ignore
  ].join("\n")
});
```

- [ ] **Step 5: Run the test to verify it passes**

Run: `pnpm --filter api exec vitest run src/email/content.test.ts`
Expected: PASS (both assertions).

- [ ] **Step 6: Use the builder in the dev-log issuer**

In `api/src/email/magic-link.ts`, import the builder and log the composed subject so the centralized copy is exercised on the dev path (the real transport stays deferred). Add the import:

```ts
import { buildMagicLinkEmail } from "./content";
```

Change the dev-log branch from:

```ts
  if (env.AUTH_EMAIL_ISSUER === "dev-log") {
    console.log(`[magic-link] ${url}`);
    return { url, echoable: true };
  }
```

to:

```ts
  if (env.AUTH_EMAIL_ISSUER === "dev-log") {
    const email = buildMagicLinkEmail(url);
    console.log(`[magic-link] ${email.subject}\n${email.text}`);
    return { url, echoable: true };
  }
```

- [ ] **Step 7: Typecheck and run the api test suite**

Run: `pnpm --filter api typecheck`
Expected: PASS.

Run: `pnpm --filter api test`
Expected: PASS (existing auth/practice tests plus the new content test).

- [ ] **Step 8: Commit**

```bash
git add api/package.json api/src/email/content.ts api/src/email/content.test.ts api/src/email/magic-link.ts pnpm-lock.yaml
git commit -m "feat(api): build magic-link email copy from copy package"
```

---

### Task 4: Full-workspace verification

**Files:** none (verification only)

- [ ] **Step 1: Run the whole workspace gate**

Run: `pnpm -r typecheck && pnpm -r test`
Expected: typecheck passes in `app` and `api`; all tests pass. (`copy` has no test/typecheck script and is skipped by `-r`, which is expected — it is type-checked through its consumers.)

- [ ] **Step 2: Confirm no stray hard-coded product name remains in wired surfaces**

Run: `grep -rn "Literacy practice" app/src`
Expected: no matches (the landing eyebrow now comes from `copy`).

- [ ] **Step 3: Final commit if anything changed**

```bash
git add -A
git commit -m "chore: verify copy package wiring across workspace" --allow-empty
```

---

## Self-review notes

- **FR1** (centralized values: productName, landing headline/subtitle, onboarding headline/subtitle, email subject/body, support display name) — covered by `packages/copy/index.ts` (Task 1 Step 4).
- **FR2** (UI references centralized values, no scattered brand strings) — landing wired in Task 2; `grep` guard in Task 4 Step 2.
- **FR3 / AC2** (rename without touching routing/account/content) — single-file edit; instructional content untouched (no changes under `content/`).
- **AC1** (product name visible via centralized config) — `landing.eyebrow = productName` rendered in LandingRoute.
- **Onboarding copy** constants exist for future AddStudentRoute wiring; not yet rendered (AddStudentRoute wiring is optional follow-up, not required by AC1/AC2). Left as exported constants so the future change is a one-liner.

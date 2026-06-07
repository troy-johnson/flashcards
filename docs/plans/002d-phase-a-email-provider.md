# Reader's Way Transactional Email Provider Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use the project's TDD implementation workflow (RED/GREEN/REFACTOR with per-stage checkpoint commits). Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Deliver real magic-link email to pilot guardians by adding a `resend` transactional issuer behind the existing pluggable email abstraction, while preserving `dev-log` for local development and internal smoke tests.

**Architecture:** `api/src/email/magic-link.ts` already branches on `env.AUTH_EMAIL_ISSUER` and composes copy via `buildMagicLinkEmail` (`api/src/email/content.ts`, from the copy package). Add a `resend` branch that POSTs to the Resend HTTP API using `EMAIL_FROM` and a `RESEND_API_KEY` secret. A non-2xx provider response throws (treated as sign-in failure by the auth route). The public auth API (`/auth/start`) stays provider-agnostic — it only reads `issued.echoable`.

**Tech Stack:** Hono on Cloudflare Workers, Resend HTTP API, Vitest (`@cloudflare/vitest-pool-workers`), TypeScript.

**Resolves:** Spec 002 FR19, FR22, FR23 / AC3. Implements ADR-001 (`docs/adrs/001-low-cost-transactional-email.md`). Beads epic `rw-1gz.7`.

**Out of scope:** Retries, bounce/delivery webhooks, admin email observability, an email-platform UI (FR23), and magic-link rate-limiting (ADR-001 guardrail — tracked separately before broad access, not required at micro-pilot scale).

---

### Task 1: Widen environment typings and the issuer union

**Files:**
- Modify: `api/src/types.ts`
- Modify: `api/src/cloudflare-test.d.ts`

- [ ] **Step 1: Widen the issuer union and add provider config to `Env`**

In `api/src/types.ts`, change `AUTH_EMAIL_ISSUER: "dev-log";` to a union and add the provider fields:

```ts
  AUTH_EMAIL_ISSUER: "dev-log" | "resend";
  /** Resend API key — set as a Cloudflare Worker secret; only required when AUTH_EMAIL_ISSUER === "resend". */
  RESEND_API_KEY?: string;
  /** Verified sender identity, e.g. "Reader's Way <signin@mail.example.com>". */
  EMAIL_FROM?: string;
```

- [ ] **Step 2: Mirror the test env typing**

In `api/src/cloudflare-test.d.ts`, widen `AUTH_EMAIL_ISSUER` to `"dev-log" | "resend"` and add optional `RESEND_API_KEY?: string;` and `EMAIL_FROM?: string;` so tests can override per-case.

- [ ] **Step 3: Typecheck**

Run: `pnpm --filter api typecheck` — expected PASS (the existing `dev-log` branch still narrows correctly).

- [ ] **Step 4: Commit** — `chore(api): widen email issuer env typings for resend`

---

### Task 2: Implement the `resend` issuer (RED → GREEN)

**Files:**
- Test: `api/src/email/magic-link.test.ts` (new)
- Modify: `api/src/email/magic-link.ts`

- [ ] **Step 1: Write the failing tests**

Create `api/src/email/magic-link.test.ts`. **Mock the outbound call with `vi.stubGlobal("fetch", …)`** — do NOT use `cloudflare:test`'s `fetchMock`: this repo's `api/src/cloudflare-test.d.ts` is a hand-written `declare module "cloudflare:test"` exporting only `env`/`SELF`, so `import { fetchMock }` would not typecheck. `vi.stubGlobal` needs no type changes and keeps this a pure unit test of `issueMagicLink`. Cover the four cases:

```ts
import { afterEach, describe, expect, it, vi } from "vitest";
import { issueMagicLink } from "./magic-link";
import type { Env } from "../types";

const baseEnv = { APP_ORIGIN: "https://app.test" } as unknown as Env;

afterEach(() => vi.unstubAllGlobals());

describe("issueMagicLink", () => {
  it("dev-log: returns an echoable url and sends no email", async () => {
    const fetchSpy = vi.fn();
    vi.stubGlobal("fetch", fetchSpy);
    const issued = await issueMagicLink({ ...baseEnv, AUTH_EMAIL_ISSUER: "dev-log" } as Env, "g@example.com", "tok123");
    expect(issued.echoable).toBe(true);
    expect(issued.url).toContain("/auth/consume?token=tok123");
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it("resend: POSTs a branded email and returns a non-echoable url on 2xx", async () => {
    const fetchSpy = vi.fn(async () => new Response(JSON.stringify({ id: "re_123" }), { status: 200 }));
    vi.stubGlobal("fetch", fetchSpy);
    const env = { ...baseEnv, AUTH_EMAIL_ISSUER: "resend", RESEND_API_KEY: "rk_test", EMAIL_FROM: "Reader's Way <signin@mail.test>" } as Env;
    const issued = await issueMagicLink(env, "g@example.com", "tok123");

    expect(issued.echoable).toBe(false);
    const [url, init] = fetchSpy.mock.calls[0]!;
    expect(url).toBe("https://api.resend.com/emails");
    const body = JSON.parse((init as RequestInit).body as string);
    expect(body.from).toBe("Reader's Way <signin@mail.test>");
    expect(body.to).toEqual(["g@example.com"]);
    expect(body.subject).toBe("Sign in to Reader's Way");
    expect(body.text).toContain("/auth/consume?token=tok123");
  });

  it("resend: throws (sign-in failure) on a non-2xx provider response", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => new Response("boom", { status: 500 })));
    const env = { ...baseEnv, AUTH_EMAIL_ISSUER: "resend", RESEND_API_KEY: "rk_test", EMAIL_FROM: "x <x@mail.test>" } as Env;
    await expect(issueMagicLink(env, "g@example.com", "tok123")).rejects.toThrow();
  });

  it("resend: throws when configuration is missing", async () => {
    const env = { ...baseEnv, AUTH_EMAIL_ISSUER: "resend" } as Env; // no key / from
    await expect(issueMagicLink(env, "g@example.com", "tok123")).rejects.toThrow();
  });
});
```

- [ ] **Step 2: Run the tests — confirm RED**

Run: `pnpm --filter api exec vitest run src/email/magic-link.test.ts` — expected FAIL (resend branch still throws "deferred from 001a").

- [ ] **Step 3: Implement the `resend` branch (GREEN)**

In `api/src/email/magic-link.ts`, reuse `buildMagicLinkEmail` for branded copy and add the provider branch before the final throw:

```ts
import { buildMagicLinkEmail } from "./content";
// ...
  if (env.AUTH_EMAIL_ISSUER === "resend") {
    if (!env.RESEND_API_KEY || !env.EMAIL_FROM) {
      throw new Error("resend issuer requires RESEND_API_KEY and EMAIL_FROM");
    }
    const email = buildMagicLinkEmail(url);
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { authorization: `Bearer ${env.RESEND_API_KEY}`, "content-type": "application/json" },
      body: JSON.stringify({ from: env.EMAIL_FROM, to: [email_to], subject: email.subject, text: email.text })
    });
    if (!res.ok) throw new Error(`resend send failed: ${res.status}`);
    return { url, echoable: false };
  }
```
(Bind the recipient address — the function's `email` parameter — to a local like `email_to` to avoid shadowing the composed-content `email`.)

- [ ] **Step 4: Run the tests — confirm GREEN**, then `pnpm --filter api test` (full suite, no regressions).

- [ ] **Step 5: REFACTOR** — extract the recipient/compose lines for readability if needed; tests stay green.

- [ ] **Step 6: Commit** — `feat(api): add resend magic-link email issuer (ADR-001)`

---

### Task 3: Deployment configuration (manual, documented — not flipped in code)

**Files:**
- Modify: `api/wrangler.toml` (add `EMAIL_FROM` var; document the secret)
- Modify: `docs/state/deployment-setup.md` (record the steps)

- [ ] **Step 1: Declare `EMAIL_FROM`** as a non-secret `[vars]` entry in `api/wrangler.toml` for the relevant environment(s). Leave `AUTH_EMAIL_ISSUER` at `dev-log` until verification is complete.

- [ ] **Step 2: Document the secret + flip procedure** in `docs/state/deployment-setup.md`:
  - `wrangler secret put RESEND_API_KEY` for `api-flashcards`.
  - Verify sender domain in Resend.
  - Send a real test magic link to the operator's address.
  - Only then set `AUTH_EMAIL_ISSUER=resend` for the pilot environment.
  - Keep `dev-log` out of public production except deliberate internal windows (ADR-001 guardrail).

- [ ] **Step 3: Commit** — `docs(deploy): record resend secret + issuer flip procedure`

> AC3 ("a guardian can complete magic-link sign-in with a real transactional sender in a deployed/pilot environment") is satisfied operationally by Step 2 against a deployed Worker; the code path is proven by Task 2 tests.

---

### Task 4: Full-workspace verification

- [ ] **Step 1:** `pnpm -r typecheck && pnpm -r test` — all green.
- [ ] **Step 2:** Confirm `/auth/start` is unchanged in shape: `dev-log` still returns `{ devMagicLink }`; `resend` returns `204` (no echo). Covered by existing `auth.test.ts` (dev-log) + new `magic-link.test.ts` (resend).
- [ ] **Step 3:** Update `docs/state/workflow-state.md` and close `rw-1gz.7` once Task 2 is merged (Task 3 secret/flip is an operator step tracked in the epic).

---

## Self-review notes

- **FR19/AC3** — real Resend sender wired; operational flip documented (Task 3).
- **FR22** — `/auth/start` stays provider-agnostic; only `issueMagicLink` knows the provider; swapping providers is a single-file change.
- **FR23** — no retries/observability/UI; explicitly out of scope.
- **ADR-001 guardrails** — non-2xx => sign-in failure (Task 2 test); short TTL unchanged (15 min in `auth.ts`); rate-limiting deferred and noted, not silently dropped.
- **Brand copy** — reuses `buildMagicLinkEmail` so subject/body stay sourced from the copy package (FR20–21 already shipped).

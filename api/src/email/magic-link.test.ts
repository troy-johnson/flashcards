import { describe, expect, it, vi } from "vitest";
import { issueMagicLink } from "./magic-link";
import type { Env } from "../types";

const baseEnv = { APP_ORIGIN: "https://app.test" } as unknown as Env;

describe("issueMagicLink", () => {
  it("dev-log: returns an echoable url and sends no email", async () => {
    const fetchMock = vi.fn();
    const issued = await issueMagicLink(
      { ...baseEnv, AUTH_EMAIL_ISSUER: "dev-log" } as Env,
      "g@example.com",
      "tok123",
      fetchMock
    );
    expect(issued.echoable).toBe(true);
    expect(issued.url).toContain("/auth/consume?token=tok123");
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("resend: POSTs a branded email and returns a non-echoable url on 2xx", async () => {
    const fetchMock = vi.fn(async () => new Response(JSON.stringify({ id: "re_123" }), { status: 200 }));
    const env = {
      ...baseEnv,
      AUTH_EMAIL_ISSUER: "resend",
      RESEND_API_KEY: "rk_test",
      EMAIL_FROM: "Reader's Way <signin@mail.test>"
    } as Env;
    const issued = await issueMagicLink(env, "g@example.com", "tok123", fetchMock);

    expect(issued.echoable).toBe(false);
    const [url, init] = fetchMock.mock.calls[0]! as unknown as [string, RequestInit];
    expect(url).toBe("https://api.resend.com/emails");
    expect(init.method).toBe("POST");
    const headers = init.headers as Record<string, string>;
    expect(headers.Authorization).toBe("Bearer rk_test");
    const body = JSON.parse(init.body as string);
    expect(body.from).toBe("Reader's Way <signin@mail.test>");
    expect(body.to).toEqual(["g@example.com"]);
    expect(body.subject).toBe("Sign in to Reader's Way");
    expect(body.text).toContain("/auth/consume?token=tok123");
  });

  it("resend: throws (sign-in failure) on a non-2xx provider response", async () => {
    const fetchMock = vi.fn(async () => new Response("boom", { status: 500 }));
    const env = {
      ...baseEnv,
      AUTH_EMAIL_ISSUER: "resend",
      RESEND_API_KEY: "rk_test",
      EMAIL_FROM: "x <x@mail.test>"
    } as Env;
    await expect(issueMagicLink(env, "g@example.com", "tok123", fetchMock)).rejects.toThrow();
  });

  it("resend: throws when configuration is missing", async () => {
    const env = { ...baseEnv, AUTH_EMAIL_ISSUER: "resend" } as Env; // no key / from
    await expect(issueMagicLink(env, "g@example.com", "tok123", vi.fn())).rejects.toThrow();
  });
});

import { describe, expect, it } from "vitest";

import { onJwt, onRedirect, onSession, onSignIn } from "./oauth-callbacks";

describe("oauth callbacks", () => {
  it("onSignIn always allows sign-in", async () => {
    expect(await onSignIn({ account: null })).toBe(true);
    expect(await onSignIn({ account: { provider: "cognito" } })).toBe(true);
  });

  it("onRedirect enforces same-origin and handles relative URLs", async () => {
    const base = "http://localhost:6060";

    const dash = await onRedirect({ url: "/dashboard", baseUrl: base });
    expect(dash).toMatch(/^http:\/\/localhost:6060\/dashboard/);

    const evil = await onRedirect({ url: "https://evil.com", baseUrl: base });
    expect(evil).toBe(base);

    const invalid = await onRedirect({ url: "not-a-url", baseUrl: base });
    expect(invalid).toBe(base);
  });

  it("onRedirect loop detection caps at 2", async () => {
    const base = "http://localhost:6060";

    const step1 = await onRedirect({ url: "/profile/setup", baseUrl: base });
    expect(new URL(step1).searchParams.get("r")).toBe("1");

    const step2 = await onRedirect({ url: step1, baseUrl: base });
    expect(new URL(step2).searchParams.get("r")).toBe("2");

    const step3 = await onRedirect({ url: step2, baseUrl: base });
    expect(step3).toBe(`${base}/dashboard`);
  });

  it("onJwt attaches user.id to token when present", async () => {
    const token0: any = {};
    const token1 = await onJwt({ token: token0, user: null });
    expect(token1.id).toBeUndefined();

    const token2: any = {};
    const token3 = await onJwt({ token: token2, user: { id: "u1" } });
    expect(token3.id).toBe("u1");
  });

  it("onSession exposes token id on session.user.id", async () => {
    const session = await onSession({
      session: { user: { name: "Test" } },
      token: { id: "u42" },
    });
    expect(session.user.id).toBe("u42");
    expect(session.user.name).toBe("Test");
  });
});

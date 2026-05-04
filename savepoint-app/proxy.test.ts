import { NextRequest } from "next/server";
import { afterEach, describe, expect, it } from "vitest";

import { handleForcedSignOut } from "./proxy";

const CUTOVER_ISO = "2026-06-01T12:00:00.000Z";
const cutoverMs = new Date(CUTOVER_ISO).getTime();

const PRE_CUTOVER = new Date(cutoverMs - 60_000);
const POST_CUTOVER = new Date(cutoverMs + 60_000);

function makeRequest(url: string, cookieHeader?: string): NextRequest {
  return new NextRequest(
    url,
    cookieHeader ? { headers: { cookie: cookieHeader } } : undefined
  );
}

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("handleForcedSignOut()", () => {
  describe("pre-cutover: env unset", () => {
    it("returns false when env is unset and legacy session cookie is present", () => {
      vi.stubEnv("AUTH_MIGRATION_CUTOVER_AT", "");
      const req = makeRequest(
        "http://localhost/dashboard",
        "next-auth.session-token=abc"
      );
      expect(handleForcedSignOut(req, PRE_CUTOVER)).toBe(false);
    });
  });

  describe("pre-cutover: cutover in the future", () => {
    it("returns false when now is before cutover and legacy cookie is present", () => {
      vi.stubEnv("AUTH_MIGRATION_CUTOVER_AT", CUTOVER_ISO);
      const req = makeRequest(
        "http://localhost/dashboard",
        "next-auth.session-token=abc"
      );
      expect(handleForcedSignOut(req, PRE_CUTOVER)).toBe(false);
    });
  });

  describe("post-cutover: no legacy cookies", () => {
    it("returns false when post-cutover but no legacy cookies are present", () => {
      vi.stubEnv("AUTH_MIGRATION_CUTOVER_AT", CUTOVER_ISO);
      const req = makeRequest(
        "http://localhost/dashboard",
        "some-other-cookie=xyz"
      );
      expect(handleForcedSignOut(req, POST_CUTOVER)).toBe(false);
    });

    it("returns false when post-cutover and request has no cookies at all", () => {
      vi.stubEnv("AUTH_MIGRATION_CUTOVER_AT", CUTOVER_ISO);
      const req = makeRequest("http://localhost/dashboard");
      expect(handleForcedSignOut(req, POST_CUTOVER)).toBe(false);
    });
  });

  describe("post-cutover: legacy session cookies", () => {
    it("returns true when next-auth.session-token is present", () => {
      vi.stubEnv("AUTH_MIGRATION_CUTOVER_AT", CUTOVER_ISO);
      const req = makeRequest(
        "http://localhost/dashboard",
        "next-auth.session-token=abc123"
      );
      expect(handleForcedSignOut(req, POST_CUTOVER)).toBe(true);
    });

    it("returns true when __Secure-next-auth.session-token is present", () => {
      vi.stubEnv("AUTH_MIGRATION_CUTOVER_AT", CUTOVER_ISO);
      const req = makeRequest(
        "http://localhost/dashboard",
        "__Secure-next-auth.session-token=abc123"
      );
      expect(handleForcedSignOut(req, POST_CUTOVER)).toBe(true);
    });
  });

  describe("post-cutover: legacy CSRF cookies", () => {
    it("returns true when next-auth.csrf-token is present", () => {
      vi.stubEnv("AUTH_MIGRATION_CUTOVER_AT", CUTOVER_ISO);
      const req = makeRequest(
        "http://localhost/dashboard",
        "next-auth.csrf-token=token123"
      );
      expect(handleForcedSignOut(req, POST_CUTOVER)).toBe(true);
    });

    it("returns true when __Host-next-auth.csrf-token is present", () => {
      vi.stubEnv("AUTH_MIGRATION_CUTOVER_AT", CUTOVER_ISO);
      const req = makeRequest(
        "http://localhost/dashboard",
        "__Host-next-auth.csrf-token=token123"
      );
      expect(handleForcedSignOut(req, POST_CUTOVER)).toBe(true);
    });
  });

  describe("post-cutover: /login path suppression", () => {
    it("returns false when on /login with auth_migrated=1 already set (don't re-fire)", () => {
      vi.stubEnv("AUTH_MIGRATION_CUTOVER_AT", CUTOVER_ISO);
      const req = makeRequest(
        "http://localhost/login",
        "next-auth.session-token=abc; auth_migrated=1"
      );
      expect(handleForcedSignOut(req, POST_CUTOVER)).toBe(false);
    });

    it("returns true when on /login with legacy cookie but auth_migrated not yet set (first hit)", () => {
      vi.stubEnv("AUTH_MIGRATION_CUTOVER_AT", CUTOVER_ISO);
      const req = makeRequest(
        "http://localhost/login",
        "next-auth.session-token=abc"
      );
      expect(handleForcedSignOut(req, POST_CUTOVER)).toBe(true);
    });
  });

  describe("malformed env var", () => {
    it("returns false when AUTH_MIGRATION_CUTOVER_AT is not a valid date", () => {
      vi.stubEnv("AUTH_MIGRATION_CUTOVER_AT", "not-a-date");
      const req = makeRequest(
        "http://localhost/dashboard",
        "next-auth.session-token=abc"
      );
      expect(handleForcedSignOut(req, POST_CUTOVER)).toBe(false);
    });

    it("returns false when AUTH_MIGRATION_CUTOVER_AT is an impossible date", () => {
      vi.stubEnv("AUTH_MIGRATION_CUTOVER_AT", "2026-99-99");
      const req = makeRequest(
        "http://localhost/dashboard",
        "next-auth.session-token=abc"
      );
      expect(handleForcedSignOut(req, POST_CUTOVER)).toBe(false);
    });
  });
});

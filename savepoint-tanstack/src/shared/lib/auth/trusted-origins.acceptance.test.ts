/**
 * @spec: 027-design-reset
 * @regression
 *
 * AC 2.14 (old links land on the new address, one re-sign-in at most): after
 * the address change the old origin must keep working for sign-in, so every
 * origin in BETTER_AUTH_EXTRA_ORIGINS is trusted by Better Auth next to the
 * primary BETTER_AUTH_URL.
 */
import { beforeEach, describe, expect, it, vi } from "vitest";

import { extraOriginsSchema } from "@/shared/config/extra-origins";

const PRIMARY_ORIGIN = "https://continue.example.test";
const OLD_ORIGIN = "https://savepoint.example.test";
const SECOND_ORIGIN = "https://second.example.test";

const envFor = (extraOrigins?: string) => ({
  NODE_ENV: "test",
  BETTER_AUTH_SECRET: "x".repeat(32),
  BETTER_AUTH_URL: PRIMARY_ORIGIN,
  BETTER_AUTH_EXTRA_ORIGINS:
    extraOrigins === undefined
      ? undefined
      : extraOriginsSchema.parse(extraOrigins),
  AUTH_COGNITO_ID: "id",
  AUTH_COGNITO_SECRET: "secret",
  AUTH_COGNITO_DOMAIN: "pool.auth.eu-west-1.amazoncognito.com",
  AUTH_COGNITO_ISSUER:
    "https://cognito-idp.eu-west-1.amazonaws.com/eu-west-1_abc123",
  AUTH_ENABLE_CREDENTIALS: "false",
});

vi.mock("@/shared/lib/db.server", () => ({ prisma: {} }));

async function trustedOriginsFor(extraOrigins?: string) {
  vi.resetModules();
  vi.doMock("@env", () => ({ env: envFor(extraOrigins) }));
  const { auth } = await import("./auth.server");
  return (await auth.$context).trustedOrigins;
}

describe("auth trusted origins", () => {
  beforeEach(() => {
    vi.resetModules();
  });

  describe("given BETTER_AUTH_EXTRA_ORIGINS lists the old address", () => {
    it("trusts the old address and the new one", async () => {
      const origins = await trustedOriginsFor(OLD_ORIGIN);
      expect(origins).toContain(OLD_ORIGIN);
      expect(origins).toContain(PRIMARY_ORIGIN);
    });

    it("trusts every listed address, whatever the spacing", async () => {
      const origins = await trustedOriginsFor(
        ` ${OLD_ORIGIN}/ , ${SECOND_ORIGIN}`
      );
      expect(origins).toContain(OLD_ORIGIN);
      expect(origins).toContain(SECOND_ORIGIN);
    });
  });

  describe("given no extra origins", () => {
    it("trusts only the primary address", async () => {
      const origins = await trustedOriginsFor();
      expect(origins).toContain(PRIMARY_ORIGIN);
      expect(origins).not.toContain(OLD_ORIGIN);
    });
  });
});

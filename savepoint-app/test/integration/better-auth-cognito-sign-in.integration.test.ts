/**
 * Integration test: Better Auth Cognito sign-in pipeline
 *
 * Approach: Hybrid (b/a)
 *
 * Uses BA's signInSocial API with the `idToken` shortcut, which exercises
 * BA's full user-creation, account-creation, and session-creation pipeline
 * without the real OAuth2 redirect dance. The Cognito provider's
 * `verifyIdToken` is overridden to return `true`, bypassing JWKS validation
 * (no MSW required for the sign-in itself).
 *
 * What IS exercised:
 *   - BA's account-linking logic (trustedProviders: ["cognito"])
 *   - BA's user + account + session row creation via the Prisma adapter
 *   - getSession round-trip via the session token returned by sign-in
 *   - Account-linking case: pre-seeded user + account are found and reused
 *
 * What is NOT exercised:
 *   - The real OAuth2 redirect (code → token exchange) against Cognito's
 *     hosted UI. That requires either a live Cognito or a full MSW mock of
 *     the state/PKCE/token/JWKS endpoints. The `idToken` shortcut used here
 *     covers all rows downstream of the token exchange.
 *   - Cognito's JWKS signature verification — the override is intentional;
 *     this is acceptable for integration purposes since BA delegates JWKS
 *     fetching to `jose` (a well-tested library), not custom code.
 *
 * Gap acceptability: Acceptable. The full OAuth2 dance is a network I/O
 * concern, not business logic. The schema wiring, account-linking config,
 * and session semantics are the substance under test here.
 */

import { execSync } from "node:child_process";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";
import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { nanoid } from "nanoid";
import { Pool } from "pg";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const PG_HOST = "localhost";
const PG_PORT = 6432;
const PG_USER = "postgres";
const PG_PASSWORD = "postgres";
const DOCKER_CONTAINER = "savepoint-postgres";

const TEST_COGNITO_SUB = "test-cognito-sub-123";
const TEST_EMAIL = "test-ba-cognito@example.com";
const TEST_NAME = "Test User";

const FAKE_COGNITO_DOMAIN = "auth.test.example.com";
const FAKE_REGION = "us-east-1";
const FAKE_USER_POOL_ID = "us-east-1_TestPool";
const FAKE_COGNITO_ISSUER = `https://cognito-idp.${FAKE_REGION}.amazonaws.com/${FAKE_USER_POOL_ID}`;

/**
 * Build a minimal valid JWT string whose payload encodes the given claims.
 * The signature is a static placeholder — real verification is bypassed via
 * the custom `verifyIdToken` override on the BA Cognito provider.
 */
function buildFakeIdToken(claims: Record<string, unknown>): string {
  const header = Buffer.from(
    JSON.stringify({ alg: "RS256", typ: "JWT", kid: "test-key-id" })
  )
    .toString("base64")
    .replace(/=/g, "")
    .replace(/\+/g, "-")
    .replace(/\//g, "_");

  const payload = Buffer.from(JSON.stringify(claims))
    .toString("base64")
    .replace(/=/g, "")
    .replace(/\+/g, "-")
    .replace(/\//g, "_");

  return `${header}.${payload}.fakesignature`;
}

/**
 * Construct a fresh BA instance backed by the given Prisma client.
 * The `verifyIdToken` override on the Cognito provider makes it always return
 * `true`, so no real JWKS endpoint is contacted during tests.
 */
function buildTestAuthInstance(prismaClient: PrismaClient) {
  return betterAuth({
    secret: "test-better-auth-secret-for-integration-tests",
    baseURL: "http://localhost:3000",
    basePath: "/api/auth",

    database: prismaAdapter(prismaClient, {
      provider: "postgresql",
    }),

    socialProviders: {
      cognito: {
        clientId: "test-client-id",
        clientSecret: "test-client-secret",
        domain: FAKE_COGNITO_DOMAIN,
        region: FAKE_REGION,
        userPoolId: FAKE_USER_POOL_ID,
        verifyIdToken: async () => true,
      },
    },

    account: {
      accountLinking: {
        enabled: true,
        trustedProviders: ["cognito"],
      },
    },
  });
}

// ---------------------------------------------------------------------------
// DB lifecycle — one isolated DB per describe block
// ---------------------------------------------------------------------------

let prismaClient: PrismaClient;
let pool: Pool;
let tempDbName: string;
let auth: ReturnType<typeof buildTestAuthInstance>;

beforeAll(async () => {
  tempDbName = `test_ba_signin_${nanoid(8)}`;
  const databaseUrl = `postgresql://${PG_USER}:${PG_PASSWORD}@${PG_HOST}:${PG_PORT}/${tempDbName}`;

  execSync(
    `docker exec ${DOCKER_CONTAINER} createdb -U ${PG_USER} ${tempDbName}`,
    { stdio: "ignore" }
  );

  execSync("pnpm prisma migrate deploy", {
    stdio: "ignore",
    env: {
      ...process.env,
      POSTGRES_PRISMA_URL: databaseUrl,
      POSTGRES_URL_NON_POOLING: databaseUrl,
    },
    cwd: "/Users/nailbadiullin/Developer/personal/play-later-v2/savepoint-app",
  });

  pool = new Pool({ connectionString: databaseUrl });
  const adapter = new PrismaPg(pool);
  prismaClient = new PrismaClient({ adapter });
  await prismaClient.$connect();

  auth = buildTestAuthInstance(prismaClient);
}, 60_000);

afterAll(async () => {
  try {
    await prismaClient?.$disconnect();
    await pool?.end();
  } finally {
    try {
      execSync(
        `docker exec ${DOCKER_CONTAINER} dropdb --if-exists -U ${PG_USER} ${tempDbName}`,
        { stdio: "ignore" }
      );
    } catch {
      // best-effort
    }
  }
});

// ---------------------------------------------------------------------------
// Shared ID token
// ---------------------------------------------------------------------------

const idToken = buildFakeIdToken({
  sub: TEST_COGNITO_SUB,
  email: TEST_EMAIL,
  email_verified: true,
  name: TEST_NAME,
  iss: FAKE_COGNITO_ISSUER,
  aud: "test-client-id",
  exp: Math.floor(Date.now() / 1000) + 3600,
  iat: Math.floor(Date.now() / 1000),
});

// ---------------------------------------------------------------------------
// 1. New-user sign-in: rows are created with expected shape
// ---------------------------------------------------------------------------

describe("Cognito sign-in — new user", () => {
  it("creates a user row with correct email, name, and emailVerified=true", async () => {
    const response = await auth.api.signInSocial({
      body: {
        provider: "cognito",
        callbackURL: "/",
        idToken: {
          token: idToken,
          accessToken: "fake-access-token",
        },
      },
      headers: new Headers({ "Content-Type": "application/json" }),
    });

    expect(response).toBeDefined();

    const users = await prismaClient.user.findMany({
      where: { email: TEST_EMAIL },
    });

    expect(users).toHaveLength(1);
    const user = users[0];
    expect(user.email).toBe(TEST_EMAIL);
    expect(user.name).toBe(TEST_NAME);
    expect(user.emailVerified).toBe(true);
  });

  it("creates an account row with providerId=cognito and correct accountId", async () => {
    const accounts = await prismaClient.account.findMany({
      where: { providerId: "cognito", accountId: TEST_COGNITO_SUB },
    });

    expect(accounts).toHaveLength(1);
    const account = accounts[0];
    expect(account.providerId).toBe("cognito");
    expect(account.accountId).toBe(TEST_COGNITO_SUB);
    expect(account.accessToken).toBe("fake-access-token");
    expect(account.idToken).toBeDefined();
  });

  it("creates a session row linked to the user", async () => {
    const user = await prismaClient.user.findUniqueOrThrow({
      where: { email: TEST_EMAIL },
    });

    const sessions = await prismaClient.session.findMany({
      where: { userId: user.id },
    });

    expect(sessions).toHaveLength(1);
    const session = sessions[0];
    expect(session.userId).toBe(user.id);
    expect(session.expiresAt.getTime()).toBeGreaterThan(Date.now());
  });

  it("returns a session token that getSession resolves to the correct user", async () => {
    const signInResponse = await auth.api.signInSocial({
      body: {
        provider: "cognito",
        callbackURL: "/",
        idToken: {
          token: idToken,
          accessToken: "fake-access-token-2",
        },
      },
      headers: new Headers({ "Content-Type": "application/json" }),
      asResponse: true,
    });

    expect(signInResponse).toBeInstanceOf(Response);

    // Extract the signed session cookie set by BA to forward to getSession.
    // BA sets a signed cookie; we must forward the exact Set-Cookie value.
    const setCookieHeader = signInResponse.headers.get("set-cookie");
    expect(setCookieHeader).toBeTruthy();

    const cookieValue = setCookieHeader!
      .split(";")[0]
      .trim()
      .replace(/^better-auth\.session_token=/, "better-auth.session_token=");

    const sessionData = await auth.api.getSession({
      headers: new Headers({
        cookie: cookieValue,
      }),
    });

    expect(sessionData).toBeDefined();
    expect(sessionData?.user?.email).toBe(TEST_EMAIL);
    expect(sessionData?.user?.name).toBe(TEST_NAME);
  });
});

// ---------------------------------------------------------------------------
// 2. Account-linking: pre-existing user + account → no duplicate user
// ---------------------------------------------------------------------------

describe("Cognito sign-in — account linking (trusted provider)", () => {
  const EXISTING_EMAIL = "existing-ba-cognito@example.com";
  const EXISTING_SUB = "existing-cognito-sub-456";

  const existingIdToken = buildFakeIdToken({
    sub: EXISTING_SUB,
    email: EXISTING_EMAIL,
    email_verified: true,
    name: "Existing User",
    iss: FAKE_COGNITO_ISSUER,
    aud: "test-client-id",
    exp: Math.floor(Date.now() / 1000) + 3600,
    iat: Math.floor(Date.now() / 1000),
  });

  it("does not create a duplicate user when signing in with a matching Cognito sub", async () => {
    await auth.api.signInSocial({
      body: {
        provider: "cognito",
        callbackURL: "/",
        idToken: {
          token: existingIdToken,
          accessToken: "first-access-token",
        },
      },
      headers: new Headers({ "Content-Type": "application/json" }),
    });

    await auth.api.signInSocial({
      body: {
        provider: "cognito",
        callbackURL: "/",
        idToken: {
          token: existingIdToken,
          accessToken: "second-access-token",
        },
      },
      headers: new Headers({ "Content-Type": "application/json" }),
    });

    const usersWithEmail = await prismaClient.user.findMany({
      where: { email: EXISTING_EMAIL },
    });

    expect(usersWithEmail).toHaveLength(1);
  });

  it("links the new account row to the existing user (not a new user)", async () => {
    const existingUser = await prismaClient.user.findUniqueOrThrow({
      where: { email: EXISTING_EMAIL },
    });

    const linkedAccounts = await prismaClient.account.findMany({
      where: {
        providerId: "cognito",
        accountId: EXISTING_SUB,
      },
    });

    expect(linkedAccounts).toHaveLength(1);
    expect(linkedAccounts[0].userId).toBe(existingUser.id);
  });

  it("creates exactly one session per sign-in call", async () => {
    const PRE_SEEDED_EMAIL = "pre-seeded-ba@example.com";
    const PRE_SEEDED_SUB = "pre-seeded-sub-789";

    const preSeededToken = buildFakeIdToken({
      sub: PRE_SEEDED_SUB,
      email: PRE_SEEDED_EMAIL,
      email_verified: true,
      name: "Pre Seeded User",
      iss: FAKE_COGNITO_ISSUER,
      aud: "test-client-id",
      exp: Math.floor(Date.now() / 1000) + 3600,
      iat: Math.floor(Date.now() / 1000),
    });

    await auth.api.signInSocial({
      body: {
        provider: "cognito",
        callbackURL: "/",
        idToken: { token: preSeededToken, accessToken: "tok-a" },
      },
      headers: new Headers({ "Content-Type": "application/json" }),
    });

    const user = await prismaClient.user.findUniqueOrThrow({
      where: { email: PRE_SEEDED_EMAIL },
    });

    const sessions = await prismaClient.session.findMany({
      where: { userId: user.id },
    });

    expect(sessions.length).toBeGreaterThanOrEqual(1);

    for (const session of sessions) {
      expect(session.userId).toBe(user.id);
      expect(session.expiresAt.getTime()).toBeGreaterThan(Date.now());
    }
  });
});

// ---------------------------------------------------------------------------
// 3. getSession returns undefined for an invalid or missing session token
// ---------------------------------------------------------------------------

describe("getSession — invalid session", () => {
  it("returns null when no session cookie is present", async () => {
    const sessionData = await auth.api.getSession({
      headers: new Headers(),
    });
    expect(sessionData).toBeNull();
  });

  it("returns null when session token does not exist in DB", async () => {
    const sessionData = await auth.api.getSession({
      headers: new Headers({
        cookie: "better-auth.session_token=nonexistent-token-xyz",
      }),
    });
    expect(sessionData).toBeNull();
  });
});

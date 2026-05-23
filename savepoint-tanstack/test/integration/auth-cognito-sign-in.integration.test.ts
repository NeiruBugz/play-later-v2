import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

import {
  setupIsolatedDatabase,
  type IsolatedDatabase,
} from "../setup/isolated-db.ts";

const TEST_COGNITO_SUB = "test-cognito-sub-ts-123";
const TEST_EMAIL = "test-ba-cognito-ts@example.com";
const TEST_NAME = "Test TanStack User";

const FAKE_REGION = "us-east-1";
const FAKE_USER_POOL_ID = "us-east-1_TsTestPool";
const FAKE_COGNITO_DOMAIN = "auth.ts-test.example.com";
const FAKE_COGNITO_ISSUER = `https://cognito-idp.${FAKE_REGION}.amazonaws.com/${FAKE_USER_POOL_ID}`;

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

type AuthInstance = ReturnType<typeof buildTestAuthInstance>;

function buildTestAuthInstance(prismaClient: IsolatedDatabase["prisma"]) {
  return betterAuth({
    secret: "test-better-auth-secret-for-tanstack-integration-tests",
    baseURL: "http://localhost:6061",
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

interface AuthModule {
  auth: {
    handler: (request: Request) => Promise<Response>;
  };
}

let db: IsolatedDatabase;
let auth: AuthInstance;

beforeAll(async () => {
  db = await setupIsolatedDatabase("auth-cognito-sign-in");

  process.env.POSTGRES_PRISMA_URL = db.url;
  process.env.POSTGRES_URL_NON_POOLING = db.url;

  const authModulePath = "../../src/shared/lib/auth/auth.server.ts" as string;
  const mod = (await import(authModulePath)) as AuthModule;

  auth = buildTestAuthInstance(db.prisma);

  void mod;
}, 60_000);

afterAll(async () => {
  await db?.teardown();
});

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

    const users = await db.prisma.user.findMany({
      where: { email: TEST_EMAIL },
    });

    expect(users).toHaveLength(1);
    const user = users[0];
    expect(user.email).toBe(TEST_EMAIL);
    expect(user.name).toBe(TEST_NAME);
    expect(user.emailVerified).toBe(true);
  });

  it("creates an account row with providerId=cognito and correct accountId", async () => {
    const accounts = await db.prisma.account.findMany({
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
    const user = await db.prisma.user.findUniqueOrThrow({
      where: { email: TEST_EMAIL },
    });

    const sessions = await db.prisma.session.findMany({
      where: { userId: user.id },
    });

    expect(sessions).toHaveLength(1);
    const session = sessions[0];
    expect(session.userId).toBe(user.id);
    expect(session.expiresAt.getTime()).toBeGreaterThan(Date.now());
  });

  it("sign-in response includes Set-Cookie header (session persists without nextCookies plugin)", async () => {
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

    const setCookieHeader = signInResponse.headers.get("set-cookie");
    expect(setCookieHeader).toBeTruthy();
  });

  it("session token returned by sign-in resolves to the correct user via getSession", async () => {
    const signInResponse = await auth.api.signInSocial({
      body: {
        provider: "cognito",
        callbackURL: "/",
        idToken: {
          token: idToken,
          accessToken: "fake-access-token-3",
        },
      },
      headers: new Headers({ "Content-Type": "application/json" }),
      asResponse: true,
    });

    expect(signInResponse).toBeInstanceOf(Response);

    const setCookieHeader = signInResponse.headers.get("set-cookie");
    expect(setCookieHeader).toBeTruthy();

    const cookieValue = setCookieHeader!
      .split(";")[0]
      .trim()
      .replace(/^better-auth\.session_token=/, "better-auth.session_token=");

    const sessionData = await auth.api.getSession({
      headers: new Headers({ cookie: cookieValue }),
    });

    expect(sessionData).toBeDefined();
    expect(sessionData?.user?.email).toBe(TEST_EMAIL);
    expect(sessionData?.user?.name).toBe(TEST_NAME);
  });
});

describe("Cognito sign-in — account linking (trusted provider)", () => {
  const EXISTING_EMAIL = "existing-ba-cognito-ts@example.com";
  const EXISTING_SUB = "existing-cognito-sub-ts-456";

  const existingIdToken = buildFakeIdToken({
    sub: EXISTING_SUB,
    email: EXISTING_EMAIL,
    email_verified: true,
    name: "Existing TanStack User",
    iss: FAKE_COGNITO_ISSUER,
    aud: "test-client-id",
    exp: Math.floor(Date.now() / 1000) + 3600,
    iat: Math.floor(Date.now() / 1000),
  });

  it("does not create a duplicate user when signing in twice with the same Cognito sub", async () => {
    await auth.api.signInSocial({
      body: {
        provider: "cognito",
        callbackURL: "/",
        idToken: { token: existingIdToken, accessToken: "first-access-token" },
      },
      headers: new Headers({ "Content-Type": "application/json" }),
    });

    await auth.api.signInSocial({
      body: {
        provider: "cognito",
        callbackURL: "/",
        idToken: { token: existingIdToken, accessToken: "second-access-token" },
      },
      headers: new Headers({ "Content-Type": "application/json" }),
    });

    const usersWithEmail = await db.prisma.user.findMany({
      where: { email: EXISTING_EMAIL },
    });

    expect(usersWithEmail).toHaveLength(1);
  });

  it("links the account row to the same user on repeated sign-in", async () => {
    const existingUser = await db.prisma.user.findUniqueOrThrow({
      where: { email: EXISTING_EMAIL },
    });

    const linkedAccounts = await db.prisma.account.findMany({
      where: { providerId: "cognito", accountId: EXISTING_SUB },
    });

    expect(linkedAccounts).toHaveLength(1);
    expect(linkedAccounts[0].userId).toBe(existingUser.id);
  });
});

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

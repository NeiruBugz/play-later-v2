import { env } from "@env";
import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { tanstackStartCookies } from "better-auth/tanstack-start";

import { prisma } from "@/shared/lib/db.server";

function parseCognitoIssuer(issuer: string): {
  region: string | undefined;
  userPoolId: string | undefined;
} {
  const match = issuer.match(
    /^https:\/\/cognito-idp\.([^.]+)\.amazonaws\.com\/([^/]+)$/
  );

  if (!match) return { region: undefined, userPoolId: undefined };

  return { region: match[1], userPoolId: match[2] };
}

const { region, userPoolId } = parseCognitoIssuer(env.AUTH_COGNITO_ISSUER);

if (!env.AUTH_COGNITO_DOMAIN) {
  throw new Error("AUTH_COGNITO_DOMAIN is required for Cognito provider");
}

if (!region || !userPoolId) {
  throw new Error(
    `AUTH_COGNITO_ISSUER is malformed: expected https://cognito-idp.<region>.amazonaws.com/<userPoolId>, got ${env.AUTH_COGNITO_ISSUER}`
  );
}

const socialProviders = {
  cognito: {
    clientId: env.AUTH_COGNITO_ID,
    clientSecret: env.AUTH_COGNITO_SECRET,
    domain: env.AUTH_COGNITO_DOMAIN as string,
    region: region as string,
    userPoolId: userPoolId as string,
  },
};

const enableCredentials =
  env.NODE_ENV !== "production" && env.AUTH_ENABLE_CREDENTIALS === "true";

export const auth = betterAuth({
  secret: env.BETTER_AUTH_SECRET,
  baseURL: env.BETTER_AUTH_URL,
  basePath: "/api/auth",
  trustedOrigins: env.BETTER_AUTH_EXTRA_ORIGINS ?? [],

  database: prismaAdapter(prisma, {
    provider: "postgresql",
  }),

  socialProviders,

  account: {
    accountLinking: {
      enabled: true,
      trustedProviders: ["cognito"],
    },
  },

  emailAndPassword: {
    enabled: enableCredentials,
  },

  session: {
    expiresIn: 60 * 60 * 24 * 30,
    updateAge: 60 * 60 * 24,
    // Trade-off: a session revoked elsewhere stays valid here for up to
    // maxAge (5 min); sign-out on this device clears the cookie immediately.
    cookieCache: { enabled: true, maxAge: 60 * 5 },
  },

  // Must stay last. Forwards the cookie-cache refresh Set-Cookie emitted by
  // `auth.api.getSession` inside server fns; without it the cache is only
  // populated at sign-in and every request after 5 min hits the DB again.
  plugins: [tanstackStartCookies()],
});

export type Auth = typeof auth;

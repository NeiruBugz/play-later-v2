/**
 * TEMPORARY SIDE-CAR — NOT MOUNTED IN PRODUCTION ROUTES.
 *
 * This file exists alongside the primary `auth.ts` (NextAuth v5) during the
 * migration to Better Auth (spec 020). It is intentionally NOT re-exported from
 * any barrel or production-facing module. The NextAuth path remains authoritative
 * until Slice 6 completes the cutover.
 *
 * Remove this file in Slice 8 (dead-code cleanup) once `auth.ts` has been fully
 * rewritten as the Better Auth instance.
 */

import { env } from "@/env.mjs";
import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";

import { prisma } from "@/shared/lib/app/db";

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

const cognitoReady = Boolean(
  env.AUTH_COGNITO_ID &&
  env.AUTH_COGNITO_SECRET &&
  env.AUTH_COGNITO_DOMAIN &&
  region &&
  userPoolId
);

const socialProviders = cognitoReady
  ? {
      cognito: {
        clientId: env.AUTH_COGNITO_ID,
        clientSecret: env.AUTH_COGNITO_SECRET,
        domain: env.AUTH_COGNITO_DOMAIN as string,
        region: region as string,
        userPoolId: userPoolId as string,
      },
    }
  : {};

export const auth = betterAuth({
  secret: env.BETTER_AUTH_SECRET,
  baseURL: env.BETTER_AUTH_URL,
  basePath: "/api/auth-ba-dev",

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
});

export type Auth = typeof auth;

export const handler = auth.handler;

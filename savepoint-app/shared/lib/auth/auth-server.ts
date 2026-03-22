import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { nextCookies } from "better-auth/next-js";
import { genericOAuth } from "better-auth/plugins";

import { prisma } from "@/shared/lib/app/db";

import { env } from "@/env.mjs";

const SESSION_MAX_AGE = 30 * 24 * 60 * 60;
const SESSION_UPDATE_AGE = 24 * 60 * 60;
const COOKIE_CACHE_MAX_AGE = 5 * 60;

const enableCredentials =
  process.env.NODE_ENV === "test" ||
  process.env.AUTH_ENABLE_CREDENTIALS === "true";

export const auth = betterAuth({
  database: prismaAdapter(prisma, {
    provider: "postgresql",
  }),
  secret: env.AUTH_SECRET,
  baseURL: env.AUTH_URL,
  session: {
    expiresIn: SESSION_MAX_AGE,
    updateAge: SESSION_UPDATE_AGE,
    cookieCache: {
      enabled: true,
      maxAge: COOKIE_CACHE_MAX_AGE,
    },
    fields: {
      token: "sessionToken",
      expiresAt: "expires",
    },
  },
  emailAndPassword: {
    enabled: enableCredentials,
    autoSignIn: true,
    minPasswordLength: 8,
  },
  user: {
    fields: {
      emailVerified: "emailVerified",
    },
  },
  account: {
    fields: {
      accountId: "providerAccountId",
      providerId: "provider",
      accessToken: "access_token",
      refreshToken: "refresh_token",
      accessTokenExpiresAt: "expires_at",
      idToken: "id_token",
    },
  },
  plugins: [
    nextCookies(),
    genericOAuth({
      config: [
        {
          providerId: "cognito",
          discoveryUrl: `${env.AUTH_COGNITO_ISSUER}/.well-known/openid-configuration`,
          clientId: env.AUTH_COGNITO_ID,
          clientSecret: env.AUTH_COGNITO_SECRET,
          scopes: ["openid", "email", "profile"],
          pkce: true,
          authorizationUrlParams: {
            identity_provider: "Google",
          },
        },
      ],
    }),
  ],
});

export type Session = typeof auth.$Infer.Session;

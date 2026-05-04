import { env } from "@/env.mjs";
import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { nextCookies } from "better-auth/next-js";
import { headers } from "next/headers";

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

const enableCredentials = env.AUTH_ENABLE_CREDENTIALS === "true";

export const auth = betterAuth({
  secret: env.BETTER_AUTH_SECRET,
  baseURL: env.BETTER_AUTH_URL,

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

  plugins: [nextCookies()],
});

export type Auth = typeof auth;

export const handler = auth.handler;

export const getServerUserId = async (): Promise<string | undefined> => {
  const session = await auth.api.getSession({ headers: await headers() });
  return session?.user?.id;
};

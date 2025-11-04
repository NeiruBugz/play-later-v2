import { env } from "@/env.mjs";
import { PrismaAdapter } from "@auth/prisma-adapter";
import NextAuth from "next-auth";
import Cognito from "next-auth/providers/cognito";
import Credentials from "next-auth/providers/credentials";

import { prisma, sessionErrorHandler } from "@/shared/lib";
import { onAuthorize } from "@/shared/lib/app/auth/credentials-callbacks";
import {
  onJwt,
  onRedirect,
  onSession,
  onSignIn,
} from "@/shared/lib/app/auth/oauth-callbacks";

const SESSION_MAX_AGE = 30 * 24 * 60 * 60;
const SESSION_UPDATE_AGE = 24 * 60 * 60;

const enableCredentials =
  process.env.NODE_ENV === "test" ||
  process.env.AUTH_ENABLE_CREDENTIALS === "true";

export const { auth, handlers, signIn } = NextAuth({
  adapter: PrismaAdapter(prisma),
  callbacks: {
    signIn: onSignIn,
    redirect: onRedirect,
    jwt: onJwt,
    session: onSession,
  },
  providers: [
    Cognito({
      issuer: env.AUTH_COGNITO_ISSUER,
      clientId: env.AUTH_COGNITO_ID,
      clientSecret: env.AUTH_COGNITO_SECRET,
      checks: ["nonce"],
      authorization: {
        params: { identity_provider: "Google" },
      },
    }),
    ...(enableCredentials
      ? [
          Credentials({
            name: "credentials",
            credentials: {
              email: { label: "Email", type: "email" },
              password: { label: "Password", type: "password" },
            },
            authorize: onAuthorize,
          }),
        ]
      : []),
  ],
  session: {
    maxAge: SESSION_MAX_AGE,
    strategy: "jwt",
    updateAge: SESSION_UPDATE_AGE,
  },
});

export const getServerUserId = async () => {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      sessionErrorHandler();
      return;
    }

    return session.user.id;
  } catch (error) {
    console.error(error);
  }
};

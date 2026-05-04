import { env } from "@/env.mjs";
import type { Adapter } from "@auth/core/adapters";
import NextAuth from "next-auth";
import Cognito from "next-auth/providers/cognito";
import Credentials from "next-auth/providers/credentials";

import { sessionErrorHandler } from "@/shared/lib";
import { onAuthorize } from "@/shared/lib/app/auth/credentials-callbacks";
import {
  onJwt,
  onRedirect,
  onSession,
  onSignIn,
} from "@/shared/lib/app/auth/oauth-callbacks";
import { prisma } from "@/shared/lib/app/db";

const SESSION_MAX_AGE = 30 * 24 * 60 * 60;
const SESSION_UPDATE_AGE = 24 * 60 * 60;
const enableCredentials =
  process.env.NODE_ENV === "test" ||
  process.env.AUTH_ENABLE_CREDENTIALS === "true";

/**
 * Custom adapter that bridges NextAuth's expected field names to the Better Auth
 * schema shapes introduced in the Slice 2 migration.
 *
 * Field mapping:
 *   account.provider         → account.providerId
 *   account.providerAccountId → account.accountId
 *   session.sessionToken     → session.token
 *   session.expires          → session.expiresAt
 *   user.emailVerified       → user.emailVerified (Boolean now, not Date)
 *
 * This shim keeps NextAuth functional until Slice 6 replaces it with Better Auth.
 */
function buildNextAuthAdapter(): Adapter {
  return {
    createUser: async (adapterUser) => {
      const { emailVerified, ...data } = adapterUser;
      return prisma.user.create({
        data: {
          ...data,
          emailVerified: emailVerified != null,
        },
      }) as never;
    },

    getUser: (id) => prisma.user.findUnique({ where: { id } }) as never,

    getUserByEmail: (email) =>
      prisma.user.findUnique({ where: { email } }) as never,

    async getUserByAccount({ provider, providerAccountId }) {
      const account = await prisma.account.findUnique({
        where: {
          providerId_accountId: {
            providerId: provider,
            accountId: providerAccountId,
          },
        },
        include: { user: true },
      });
      return (account?.user ?? null) as never;
    },

    updateUser: ({ id, emailVerified, ...data }) =>
      prisma.user.update({
        where: { id },
        data: {
          ...data,
          ...(emailVerified !== undefined && {
            emailVerified: emailVerified != null,
          }),
        },
      }) as never,

    deleteUser: async (id) => {
      await prisma.user.delete({ where: { id } });
    },

    linkAccount: ({ provider, providerAccountId, ...rest }) =>
      prisma.account.create({
        data: {
          ...rest,
          providerId: provider,
          accountId: providerAccountId,
        },
      }) as never,

    unlinkAccount: ({ provider, providerAccountId }) =>
      prisma.account.delete({
        where: {
          providerId_accountId: {
            providerId: provider,
            accountId: providerAccountId,
          },
        },
      }) as never,

    async getSessionAndUser(sessionToken) {
      const userAndSession = await prisma.session.findUnique({
        where: { token: sessionToken },
        include: { user: true },
      });
      if (!userAndSession) return null;
      const { user, ...session } = userAndSession;
      return {
        user: user as never,
        session: {
          sessionToken: session.token,
          userId: session.userId,
          expires: session.expiresAt,
        },
      };
    },

    createSession: ({ sessionToken, userId, expires }) =>
      prisma.session
        .create({
          data: {
            token: sessionToken,
            userId,
            expiresAt: expires,
          },
        })
        .then((s) => ({
          sessionToken: s.token,
          userId: s.userId,
          expires: s.expiresAt,
        })),

    updateSession: ({ sessionToken, expires, userId }) =>
      prisma.session
        .update({
          where: { token: sessionToken },
          data: {
            ...(expires && { expiresAt: expires }),
            ...(userId && { userId }),
          },
        })
        .then((s) => ({
          sessionToken: s.token,
          userId: s.userId,
          expires: s.expiresAt,
        })),

    deleteSession: async (sessionToken) => {
      await prisma.session.delete({ where: { token: sessionToken } });
    },

    async createVerificationToken({ identifier, token, expires }) {
      const vt = await prisma.verification.create({
        data: {
          identifier,
          value: token,
          expiresAt: expires,
        },
      });
      return {
        identifier: vt.identifier,
        token: vt.value,
        expires: vt.expiresAt,
      };
    },

    async useVerificationToken({ identifier, token }) {
      try {
        const vt = await prisma.verification.delete({
          where: { value: token },
        });
        if (vt.identifier !== identifier) return null;
        return {
          identifier: vt.identifier,
          token: vt.value,
          expires: vt.expiresAt,
        };
      } catch (error) {
        if (
          error != null &&
          typeof error === "object" &&
          "code" in error &&
          (error as { code: string }).code === "P2025"
        ) {
          return null;
        }
        throw error;
      }
    },
  };
}

export const { auth, handlers, signIn } = NextAuth({
  adapter: buildNextAuthAdapter(),
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

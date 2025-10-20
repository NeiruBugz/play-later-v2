import { env } from "@/env.mjs";
import { PrismaAdapter } from "@auth/prisma-adapter";
import NextAuth from "next-auth";
import Cognito from "next-auth/providers/cognito";
import Credentials from "next-auth/providers/credentials";

import { prisma, sessionErrorHandler, verifyPassword } from "@/shared/lib";

const enableCredentials =
  process.env.NODE_ENV === "test" ||
  process.env.AUTH_ENABLE_CREDENTIALS === "true";

export const { auth, handlers, signIn } = NextAuth({
  adapter: PrismaAdapter(prisma),
  callbacks: {
    jwt: async ({ token, user }) => {
      if (user) {
        token.id = user.id;
      }
      return token;
    },
    session: async ({ session, token }) => {
      return {
        ...session,
        user: {
          ...session.user,
          id: token.id as string,
        },
      };
    },
  },
  providers: [
    Cognito({
      issuer: env.AUTH_COGNITO_ISSUER,
      clientId: env.AUTH_COGNITO_ID,
      clientSecret: env.AUTH_COGNITO_SECRET,
      checks: ["nonce"], // Fix for Cognito + third-party IDP nonce mismatch
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
            async authorize(credentials) {
              if (!credentials?.email || !credentials?.password) {
                return null;
              }

              const user = await prisma.user.findUnique({
                where: { email: credentials.email as string },
                select: {
                  id: true,
                  email: true,
                  name: true,
                  image: true,
                  password: true,
                },
              });

              if (!user || !user.password) {
                return null;
              }

              const isPasswordValid = await verifyPassword(
                credentials.password as string,
                user.password
              );

              if (!isPasswordValid) {
                return null;
              }

              return {
                id: user.id,
                email: user.email,
                name: user.name,
                image: user.image,
              };
            },
          }),
        ]
      : []),
  ],
  session: {
    maxAge: 7 * 24 * 60 * 60, // 7 days
    strategy: "jwt",
    updateAge: 24 * 60 * 60, // Rotate every day
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

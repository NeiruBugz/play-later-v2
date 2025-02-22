import { prisma } from '@/infra/prisma/client';
import { PrismaAdapter } from '@auth/prisma-adapter';
import NextAuth from 'next-auth';
import Google from 'next-auth/providers/google';

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
  providers: [Google],
  session: {
    maxAge: 24 * 60 * 60, // 1 day
    strategy: 'jwt',
  },
});

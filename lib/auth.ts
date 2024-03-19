import { PrismaAdapter } from "@next-auth/prisma-adapter"
import {
  DefaultSession,
  getServerSession,
  NextAuthOptions,
  Session,
} from "next-auth"
import GoogleProvider from "next-auth/providers/google"

import { prisma } from "@/lib/prisma"

declare module "next-auth" {
  interface Session extends DefaultSession {
    user: {
      id: string
    } & DefaultSession["user"]
  }
}

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  callbacks: {
    jwt: async ({ token, user }) => {
      if (user) {
        token.id = user.id
      }
      return token
    },

    session: ({ session, token }) => {
      return {
        ...session,
        user: {
          ...session.user,
          id: token.id,
        },
      }
    },
  },
  pages: {
    signIn: "/login",
  },
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID as string,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET as string,
    }),
  ],
  secret: process.env.NEXTAUTH_SECRET,
  session: {
    maxAge: 24 * 60 * 60, // 1 day
    strategy: "jwt",
  },
}

export const getServerUserId = async () => {
  const session = (await getServerSession(authOptions)) as Session
  return session.user.id
}

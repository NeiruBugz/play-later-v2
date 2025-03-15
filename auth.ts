import { prisma } from './prisma/client';
import { PrismaAdapter } from '@auth/prisma-adapter';
import NextAuth from 'next-auth';
import Google from 'next-auth/providers/google';
import { JWT } from 'next-auth/jwt';

// Define the extended JWT type with our custom properties
interface ExtendedJWT extends JWT {
  id?: string;
  accessToken?: string;
  refreshToken?: string;
  accessTokenExpires?: number;
  error?: string;
}

// Define the response type from Google's token endpoint
interface GoogleRefreshTokenResponse {
  access_token: string;
  expires_in: number;
  refresh_token?: string;
  scope: string;
  token_type: string;
  id_token?: string;
}

export const { auth, handlers, signIn } = NextAuth({
  adapter: PrismaAdapter(prisma),
  callbacks: {
    jwt: async ({ token, user, account }) => {
      if (account && user) {
        return {
          ...token,
          id: user.id,
          accessToken: account.access_token,
          refreshToken: account.refresh_token,
          accessTokenExpires: account.expires_at
            ? account.expires_at * 1000
            : 0,
        };
      }

      // Check if the token has expired
      const extendedToken = token as ExtendedJWT;
      if (
        extendedToken.accessTokenExpires &&
        Date.now() < extendedToken.accessTokenExpires
      ) {
        return token;
      }

      return refreshAccessToken(extendedToken);
    },
    session: async ({ session, token }) => {
      const extendedToken = token as ExtendedJWT;
      return {
        ...session,
        user: {
          ...session.user,
          id: extendedToken.id,
        },
        error: extendedToken.error,
      };
    },
  },
  providers: [Google],
  session: {
    maxAge: 24 * 60 * 60, // 1 day
    strategy: 'jwt',
  },
});

async function refreshAccessToken(token: ExtendedJWT): Promise<ExtendedJWT> {
  try {
    if (!token.refreshToken) {
      throw new Error('No refresh token available');
    }

    const url =
      'https://oauth2.googleapis.com/token?' +
      new URLSearchParams({
        client_id: process.env.AUTH_GOOGLE_ID!,
        client_secret: process.env.AUTH_GOOGLE_SECRET!,
        grant_type: 'refresh_token',
        refresh_token: token.refreshToken,
      });

    const response = await fetch(url, {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      method: 'POST',
    });

    const refreshedTokens: GoogleRefreshTokenResponse = await response.json();

    if (!response.ok) {
      throw refreshedTokens;
    }

    return {
      ...token,
      accessToken: refreshedTokens.access_token,
      accessTokenExpires: Date.now() + refreshedTokens.expires_in * 1000,
      refreshToken: refreshedTokens.refresh_token ?? token.refreshToken,
    };
  } catch (error) {
    console.error('Error refreshing access token', error);
    return {
      ...token,
      error: 'RefreshAccessTokenError',
    };
  }
}

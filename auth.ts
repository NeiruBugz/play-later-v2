import { prisma } from './prisma/client';
import { PrismaAdapter } from '@auth/prisma-adapter';
import NextAuth from 'next-auth';
import { JWT } from 'next-auth/jwt';
import Google from 'next-auth/providers/google';

// Define the extended JWT type with our custom properties
export type ExtendedJWT = JWT & {
  id?: string;
  accessToken?: string;
  refreshToken?: string;
  accessTokenExpires?: number;
  error?: 'RefreshTokenError';
};

// Define the response type from Google's token endpoint
export type GoogleRefreshTokenResponse = {
  access_token: string;
  expires_in: number;
  scope: string;
  token_type: string;
  id_token?: string;
  refresh_token?: string;
};

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
  providers: [
    Google({
      // Google requires "offline" access_type to provide a `refresh_token`
      authorization: { params: { access_type: 'offline', prompt: 'consent' } },
    }),
  ],
  session: {
    maxAge: 24 * 60 * 60, // 1 day
    strategy: 'jwt',
  },
});

function buildTokenRefreshUrl(refreshToken: string): string {
  return (
    'https://oauth2.googleapis.com/token?' +
    new URLSearchParams({
      client_id: process.env.AUTH_GOOGLE_ID!,
      client_secret: process.env.AUTH_GOOGLE_SECRET!,
      grant_type: 'refresh_token',
      refresh_token: refreshToken,
    })
  );
}

async function fetchRefreshedTokens(
  url: string,
): Promise<GoogleRefreshTokenResponse> {
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

  return refreshedTokens;
}

function updateTokenWithRefreshedData(
  token: ExtendedJWT,
  refreshedTokens: GoogleRefreshTokenResponse,
): ExtendedJWT {
  return {
    ...token,
    accessToken: refreshedTokens.access_token,
    accessTokenExpires: Date.now() + refreshedTokens.expires_in * 1000,
    refreshToken: refreshedTokens.refresh_token ?? token.refreshToken,
  };
}

async function refreshAccessToken(token: ExtendedJWT): Promise<ExtendedJWT> {
  try {
    if (!token.refreshToken) {
      throw new Error('No refresh token available');
    }

    const url = buildTokenRefreshUrl(token.refreshToken);
    const refreshedTokens = await fetchRefreshedTokens(url);
    return updateTokenWithRefreshedData(token, refreshedTokens);
  } catch (error) {
    console.error('Error refreshing access token', error);
    return {
      ...token,
      error: 'RefreshTokenError',
    };
  }
}
declare module 'next-auth' {
  interface Session {
    error?: 'RefreshTokenError';
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    access_token: string;
    expires_at: number;
    refresh_token?: string;
    error?: 'RefreshTokenError';
  }
}

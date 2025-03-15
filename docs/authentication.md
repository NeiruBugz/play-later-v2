# Authentication System

This document provides details about the authentication system used in the PlayLater application.

## Overview

PlayLater uses NextAuth.js v5 for authentication, which provides a complete authentication solution with support for various providers, session management, and JWT handling.

The authentication configuration is defined in `auth.ts` at the root of the project.

## Authentication Providers

Currently, the application supports the following authentication providers:

- **Google OAuth**: Allows users to sign in with their Google accounts

Additional providers can be added by updating the `providers` array in `auth.ts`.

## Authentication Flow

1. User clicks the sign-in button on the home page
2. User is redirected to the provider's authentication page
3. After successful authentication, the provider redirects back to the application
4. NextAuth creates a session and JWT for the authenticated user
5. The user is redirected to the collection page

## JWT Handling

The application uses JWT (JSON Web Tokens) for session management. The JWT contains the following information:

- User ID
- Access token
- Refresh token
- Token expiration time

The JWT is automatically refreshed when it expires using the refresh token.

## Session Management

Sessions are managed by NextAuth and stored in the database using the Prisma adapter. The session configuration is defined in `auth.ts`:

```typescript
session: {
  maxAge: 24 * 60 * 60, // 1 day
  strategy: 'jwt',
}
```

## Database Integration

NextAuth uses the Prisma adapter to store authentication-related data in the database. The following models are used:

- **User**: User account information
- **Account**: OAuth account information
- **Session**: Session information
- **VerificationToken**: Email verification tokens

## Protected Routes

Routes that require authentication should check for a valid session using the `auth()` function:

```typescript
import { auth } from '../auth';
import { redirect } from 'next/navigation';

export default async function ProtectedPage() {
  const session = await auth();

  if (!session?.user?.email) {
    redirect('/');
  }

  // Protected content
}
```

## User Information

The authenticated user's information is available in the session object:

```typescript
const session = await auth();

// User ID
const userId = session?.user?.id;

// User email
const userEmail = session?.user?.email;

// User name
const userName = session?.user?.name;

// User image
const userImage = session?.user?.image;
```

## Token Refresh

The application automatically refreshes the access token when it expires. The refresh logic is implemented in the `refreshAccessToken` function in `auth.ts`.

If the token refresh fails, the session will include an error property:

```typescript
const session = await auth();

if (session?.error === 'RefreshAccessTokenError') {
  // Handle token refresh error
}
```

## Sign Out

Users can sign out by calling the `signOut` function from NextAuth:

```typescript
import { signOut } from 'next-auth/react';

// Sign out and redirect to home page
signOut({ callbackUrl: '/' });
```

## Custom Callbacks

The authentication system includes custom callbacks for JWT and session handling:

### JWT Callback

The JWT callback is used to add custom properties to the JWT and handle token refresh:

```typescript
jwt: async ({ token, user, account }) => {
  if (account && user) {
    return {
      ...token,
      id: user.id,
      accessToken: account.access_token,
      refreshToken: account.refresh_token,
      accessTokenExpires: account.expires_at ? account.expires_at * 1000 : 0,
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
};
```

### Session Callback

The session callback is used to add custom properties to the session:

```typescript
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
};
```

## Security Considerations

- JWT secret should be a strong, random string stored in the `AUTH_SECRET` environment variable
- OAuth client ID and secret should be stored in environment variables
- HTTPS should be used in production to protect authentication data
- Session cookies are HTTP-only and secure by default
- Token refresh mechanism helps prevent session hijacking

## Adding New Providers

To add a new authentication provider:

1. Install the provider package if needed
2. Import the provider in `auth.ts`
3. Add the provider to the `providers` array
4. Configure environment variables for the provider
5. Update the sign-in UI to include the new provider

Example for adding GitHub authentication:

```typescript
import GitHub from 'next-auth/providers/github';

// In the providers array
providers: [
  Google,
  GitHub({
    clientId: process.env.GITHUB_ID,
    clientSecret: process.env.GITHUB_SECRET,
  }),
];
```

## Troubleshooting

Common authentication issues and solutions:

- **Invalid redirect URI**: Ensure the callback URL is configured correctly in the OAuth provider settings
- **Token refresh failures**: Check that the refresh token is being stored correctly and the refresh logic is working
- **Session expiration**: Adjust the session maxAge if sessions are expiring too quickly
- **Missing user information**: Ensure the user model includes all required fields and the session callback is correctly mapping token data to the session

```

```

'use client';

import { SessionProvider as NextAuthSessionProvider } from 'next-auth/react';
import { useEffect } from 'react';
import { useSession, signOut } from 'next-auth/react';
import { Session } from 'next-auth';

interface ExtendedSession extends Session {
  error?: string;
  user: Session['user'] & {
    id?: string;
  };
}

function RefreshTokenHandler() {
  const { data: session } = useSession();

  useEffect(() => {
    if ((session as ExtendedSession)?.error === 'RefreshAccessTokenError') {
      signOut({ callbackUrl: '/' });
    }
  }, [session]);

  return null;
}

function SessionProvider({ children }: { children: React.ReactNode }) {
  return (
    <NextAuthSessionProvider>
      <RefreshTokenHandler />
      {children}
    </NextAuthSessionProvider>
  );
}

export { SessionProvider };

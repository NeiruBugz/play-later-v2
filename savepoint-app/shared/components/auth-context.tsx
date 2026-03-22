"use client";

import { createContext, use, type PropsWithChildren } from "react";

const AuthContext = createContext<string | null>(null);

export function AuthProvider({
  userId,
  children,
}: PropsWithChildren<{ userId: string }>) {
  return <AuthContext value={userId}>{children}</AuthContext>;
}

export function useAuthUserId(): string {
  const userId = use(AuthContext);
  if (!userId) {
    throw new Error("useAuthUserId must be used within AuthProvider");
  }
  return userId;
}

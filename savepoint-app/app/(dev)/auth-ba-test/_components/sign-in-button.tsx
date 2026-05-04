"use client";

import { useState } from "react";

import { Button } from "@/shared/components/ui/button";

import { authClient } from "./auth-client";

export function SignInButton() {
  const [error, setError] = useState<string | null>(null);
  const [isPending, setIsPending] = useState(false);

  async function handleSignIn() {
    setError(null);
    setIsPending(true);
    const result = await authClient.signIn.social({
      provider: "cognito",
      callbackURL: "/auth-ba-test",
    });
    if (result?.error) {
      setError(result.error.message ?? "Sign-in failed");
      setIsPending(false);
    }
  }

  return (
    <div className="flex flex-col gap-2">
      <Button onClick={handleSignIn} disabled={isPending}>
        {isPending ? "Redirecting…" : "Sign in with Cognito (Better Auth)"}
      </Button>
      {error && (
        <p className="text-destructive text-sm" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}

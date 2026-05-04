"use client";

import { useState } from "react";

import { Button } from "@/shared/components/ui/button";

import { authClient } from "./auth-client";

export function SignOutButton() {
  const [isPending, setIsPending] = useState(false);

  async function handleSignOut() {
    setIsPending(true);
    await authClient.signOut();
    window.location.reload();
  }

  return (
    <Button variant="outline" onClick={handleSignOut} disabled={isPending}>
      {isPending ? "Signing out…" : "Sign out (BA)"}
    </Button>
  );
}

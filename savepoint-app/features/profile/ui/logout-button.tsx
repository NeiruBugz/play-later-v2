"use client";

import { authClient } from "@/shared/lib/auth/auth-client";

import { Button } from "@/shared/components/ui/button";

export function LogoutButton() {
  const handleLogoutClick = async () => {
    await authClient.signOut();
  };
  return (
    <Button onClick={handleLogoutClick} variant="destructive">
      Logout
    </Button>
  );
}

"use client";

import { signOut } from "next-auth/react";

import { Button } from "@/shared/components/ui/button";

export function LogoutButton() {
  const handleLogoutClick = async () => {
    signOut();
  };
  return (
    <Button onClick={handleLogoutClick} variant="destructive">
      Logout
    </Button>
  );
}

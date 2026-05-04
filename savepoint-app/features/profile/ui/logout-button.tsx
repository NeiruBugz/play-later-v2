"use client";

import { useRouter } from "next/navigation";

import { Button } from "@/shared/components/ui/button";
import { authClient } from "@/shared/lib/auth-client";

export function LogoutButton() {
  const router = useRouter();
  const handleLogoutClick = () => {
    void authClient.signOut({
      fetchOptions: {
        onSuccess: () => {
          router.push("/");
          router.refresh();
        },
      },
    });
  };
  return (
    <Button
      onClick={handleLogoutClick}
      variant="ghost"
      size="sm"
      className="text-muted-foreground hover:text-foreground text-sm"
    >
      Logout
    </Button>
  );
}

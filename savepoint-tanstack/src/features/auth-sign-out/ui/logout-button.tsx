import { useRouter } from "@tanstack/react-router";

import { authClient } from "@/shared/api/auth-client";
import { Button } from "@/shared/ui/button";

export function LogoutButton() {
  const router = useRouter();

  const handleLogout = () => {
    void authClient.signOut({
      fetchOptions: {
        onSuccess: () => {
          void router.invalidate();
        },
      },
    });
  };

  return (
    <Button variant="destructive" type="button" onClick={handleLogout}>
      Sign out
    </Button>
  );
}

import { useQueryClient } from "@tanstack/react-query";
import { useRouter } from "@tanstack/react-router";

import { invalidateCurrentUser } from "@/entities/session/api/invalidate-current-user";
import { authClient } from "@/shared/api/auth-client";
import { Button } from "@/shared/ui/button";

export function LogoutButton() {
  const router = useRouter();
  const queryClient = useQueryClient();

  const handleLogout = () => {
    void authClient.signOut({
      fetchOptions: {
        onSuccess: async () => {
          await invalidateCurrentUser(queryClient);
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

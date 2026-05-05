import { useRouter } from "@tanstack/react-router";

import { authClient } from "@/shared/api/auth-client";

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
    <button type="button" onClick={handleLogout}>
      Sign out
    </button>
  );
}

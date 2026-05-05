import { createFileRoute } from "@tanstack/react-router";

import { LogoutButton } from "@/features/auth-sign-out/ui/logout-button";

export const Route = createFileRoute("/_authed/profile")({
  component: ProfilePage,
});

function ProfilePage() {
  const { userId } = Route.useRouteContext();

  return (
    <main>
      <h1>Hello, signed in as {userId}</h1>
      <LogoutButton />
    </main>
  );
}

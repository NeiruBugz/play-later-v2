import { createFileRoute } from "@tanstack/react-router";

import { LogoutButton } from "@/features/auth-sign-out/ui/logout-button";
import { getProfileViewFn } from "@/features/profile-overview/api/get-profile-view";
import { ProfileOverview } from "@/widgets/profile-overview";

export const Route = createFileRoute("/_authed/profile")({
  loader: () => getProfileViewFn(),
  component: ProfilePage,
});

function ProfilePage() {
  const { profile, stats } = Route.useLoaderData();

  return (
    <main className="container mx-auto px-4 py-6">
      <ProfileOverview profile={profile} stats={stats} />
      <div className="mt-8">
        <LogoutButton />
      </div>
    </main>
  );
}

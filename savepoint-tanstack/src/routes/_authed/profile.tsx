import { createFileRoute, Link } from "@tanstack/react-router";

import { getProfilePageDataFn } from "@/features/profile-overview/api";
import { Button } from "@/shared/ui/button";
import { ProfileOverview } from "@/widgets/profile-overview";

export const Route = createFileRoute("/_authed/profile")({
  loader: () => getProfilePageDataFn(),
  component: ProfilePage,
});

function ProfilePage() {
  const { profile, stats } = Route.useLoaderData();

  return (
    <main className="container mx-auto px-4 py-6">
      <div className="mb-6 flex items-center justify-end">
        <Button asChild variant="outline">
          <Link to="/settings/profile">Edit profile</Link>
        </Button>
      </div>
      <ProfileOverview profile={profile} stats={stats} isOwnProfile />
    </main>
  );
}

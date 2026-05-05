import { createFileRoute, Link } from "@tanstack/react-router";

import { getLibraryStats } from "@/entities/library-item/api/get-library-stats.server";
import { getProfileById } from "@/entities/profile/api/get-profile.server";
import { requireUserId } from "@/entities/session/api/require-user-id";
import { LogoutButton } from "@/features/auth-sign-out/ui/logout-button";
import { Button } from "@/shared/ui/button";
import { ProfileOverview } from "@/widgets/profile-overview";

export const Route = createFileRoute("/_authed/profile")({
  loader: async () => {
    const userId = await requireUserId();
    const [profile, stats] = await Promise.all([
      getProfileById(userId),
      getLibraryStats(userId),
    ]);
    return { profile, stats };
  },
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
      <ProfileOverview profile={profile} stats={stats} />
      <div className="mt-8">
        <LogoutButton />
      </div>
    </main>
  );
}

import { createFileRoute } from "@tanstack/react-router";

import { getLibraryStats } from "@/entities/library-item/api/get-library-stats.server";
import { getPublicProfile } from "@/entities/profile/api/get-public-profile.server";
import { ProfileOverview } from "@/widgets/profile-overview";

export const Route = createFileRoute("/u/$username")({
  loader: async ({ params }) => {
    const profile = await getPublicProfile(params.username);
    const stats = await getLibraryStats(profile.id);
    return { profile, stats };
  },
  component: PublicProfilePage,
});

function PublicProfilePage() {
  const { profile, stats } = Route.useLoaderData();

  return (
    <main className="container mx-auto px-4 py-6">
      <ProfileOverview profile={profile} stats={stats} />
    </main>
  );
}

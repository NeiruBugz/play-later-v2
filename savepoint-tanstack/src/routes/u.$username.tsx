import { createFileRoute } from "@tanstack/react-router";

import { getPublicProfileViewFn } from "@/features/profile-overview/api/get-public-profile-view";
import { ProfileOverview } from "@/widgets/profile-overview";

export const Route = createFileRoute("/u/$username")({
  loader: ({ params }) =>
    getPublicProfileViewFn({ data: { username: params.username } }),
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

import { createFileRoute } from "@tanstack/react-router";

import { getPublicProfilePageDataFn } from "@/features/profile-overview/api";
import { ProfileOverview } from "@/widgets/profile-overview";

export const Route = createFileRoute("/u/$username")({
  loader: ({ params }) =>
    getPublicProfilePageDataFn({ data: { username: params.username } }),
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

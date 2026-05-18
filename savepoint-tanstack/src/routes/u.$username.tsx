import { createFileRoute, Link, notFound } from "@tanstack/react-router";

import { getCurrentUserFn } from "@/entities/session/api/get-current-user";
import { getPublicProfilePageDataFn } from "@/features/profile-overview/api";
import { NotFoundError } from "@/shared/lib/errors";
import { Button } from "@/shared/ui/button";
import { ProfileOverview } from "@/widgets/profile-overview";

/**
 * Public profile route.
 *
 * Loader fetches the public profile + library stats via the privacy-aware
 * `getPublicProfile` entity query (throws `NotFoundError` for both "missing"
 * and "private"). We also fetch the optional viewer so the widget can
 * decide whether to show the owner-only "Edit Profile" / "Change avatar"
 * affordances.
 *
 * This route is intentionally NOT under `_authed/` — `/u/$username` mirrors
 * the canonical app's public-profile surface and must be reachable to
 * anonymous viewers. Privacy is enforced inside the entity query, not at
 * the route layer.
 */
export const Route = createFileRoute("/u/$username")({
  loader: async ({ params }) => {
    try {
      const [pageData, viewer] = await Promise.all([
        getPublicProfilePageDataFn({ data: { username: params.username } }),
        getCurrentUserFn(),
      ]);
      return { ...pageData, viewerId: viewer.user?.id ?? null };
    } catch (error) {
      if (error instanceof NotFoundError) {
        throw notFound();
      }
      throw error;
    }
  },
  component: PublicProfilePage,
  notFoundComponent: ProfileNotFound,
});

function PublicProfilePage() {
  const { profile, stats, viewerId } = Route.useLoaderData();
  const isOwnProfile = viewerId != null && viewerId === profile.id;

  return (
    <main className="container mx-auto px-4 py-6">
      <ProfileOverview
        profile={profile}
        stats={stats}
        isOwnProfile={isOwnProfile}
      />
    </main>
  );
}

function ProfileNotFound() {
  return (
    <main className="container mx-auto px-4 py-16 text-center">
      <h1 className="heading-lg mb-2">Profile not found</h1>
      <p className="text-muted-foreground mb-6">
        We couldn't find that profile, or it isn't public.
      </p>
      <Button asChild variant="outline">
        <Link to="/">Go home</Link>
      </Button>
    </main>
  );
}

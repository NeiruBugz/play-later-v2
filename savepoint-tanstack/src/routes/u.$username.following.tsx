import { createFileRoute, Link, notFound } from "@tanstack/react-router";

import { getPublicProfilePageDataFn } from "@/features/profile-overview/api";
import { listFollowingFn } from "@/features/social-discovery/api";
import { NotFoundError } from "@/shared/lib/errors";
import { Button } from "@/shared/ui/button";
import { UserList } from "@/widgets";

/**
 * Public following list for `/u/$username/following`.
 *
 * Anonymous-allowed. Privacy enforced at the entity layer.
 */
export const Route = createFileRoute("/u/$username/following")({
  loader: async ({ params }) => {
    try {
      const pageData = await getPublicProfilePageDataFn({
        data: { username: params.username },
      });
      const list = await listFollowingFn({
        data: { targetUserId: pageData.profile.id },
      });
      return { profile: pageData.profile, list };
    } catch (error) {
      if (error instanceof NotFoundError) {
        throw notFound();
      }
      throw error;
    }
  },
  component: FollowingListPage,
  notFoundComponent: ListNotFound,
});

function FollowingListPage() {
  const { profile, list } = Route.useLoaderData();
  const displayName = profile.name ?? profile.username ?? "User";

  return (
    <main className="space-y-md container mx-auto max-w-2xl px-4 py-6">
      <div className="space-y-1">
        <Button asChild variant="ghost" size="sm">
          <Link to="/u/$username" params={{ username: profile.username ?? "" }}>
            ← Back to {displayName}
          </Link>
        </Button>
        <h1 className="heading-lg tracking-tight">Following</h1>
        <p className="text-muted-foreground text-sm">
          People @{profile.username ?? "user"} follows
        </p>
      </div>
      <UserList
        variant="following"
        entries={list.following}
        total={list.total}
      />
    </main>
  );
}

function ListNotFound() {
  return (
    <main className="container mx-auto px-4 py-16 text-center">
      <h1 className="heading-lg mb-2">Profile not found</h1>
      <Button asChild variant="outline">
        <Link to="/">Go home</Link>
      </Button>
    </main>
  );
}

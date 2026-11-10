import { createFileRoute, Link, notFound } from "@tanstack/react-router";

import { listConnectionsFn } from "@/features/social-discovery/api";
import { NotFoundError } from "@/shared/lib/errors";
import { Button } from "@/shared/ui/button";
import { UserConnectionsPage } from "@/widgets";

/**
 * Public following list for `/u/$username/following`. Anonymous-allowed. One RPC resolves
 * the privacy-gated profile and lists; missing or denied maps to notFound().
 */
export const Route = createFileRoute("/u/$username/following")({
  loader: async ({ params }) => {
    try {
      return await listConnectionsFn({
        data: { username: params.username, kind: "following" },
      });
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
  const { profile, entries, total } = Route.useLoaderData();

  return (
    <UserConnectionsPage
      kind="following"
      profile={profile}
      entries={entries}
      total={total}
    />
  );
}

function ListNotFound() {
  return (
    <div className="container mx-auto px-4 py-16 text-center">
      <h1 className="heading-lg mb-2">Profile not found</h1>
      <Button asChild variant="outline">
        <Link to="/">Go home</Link>
      </Button>
    </div>
  );
}

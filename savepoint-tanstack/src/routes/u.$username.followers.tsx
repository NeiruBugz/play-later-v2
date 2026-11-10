import { createFileRoute, Link, notFound } from "@tanstack/react-router";

import { listConnectionsFn } from "@/features/social-discovery/api";
import { NotFoundError } from "@/shared/lib/errors";
import { buttonVariants } from "@/shared/ui/button";
import { UserConnectionsPage } from "@/widgets";

/**
 * Public followers list for `/u/$username/followers`. Anonymous-allowed. One RPC resolves
 * the privacy-gated profile and lists; missing or denied maps to notFound().
 */
export const Route = createFileRoute("/u/$username/followers")({
  loader: async ({ params }) => {
    try {
      return await listConnectionsFn({
        data: { username: params.username, kind: "followers" },
      });
    } catch (error) {
      if (error instanceof NotFoundError) {
        throw notFound();
      }
      throw error;
    }
  },
  component: FollowersListPage,
  notFoundComponent: ListNotFound,
});

function FollowersListPage() {
  const { profile, entries, total } = Route.useLoaderData();

  return (
    <UserConnectionsPage
      kind="followers"
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
      <Link to="/" className={buttonVariants({ variant: "outline" })}>
        Go home
      </Link>
    </div>
  );
}

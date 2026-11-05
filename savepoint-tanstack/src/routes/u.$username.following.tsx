import { createFileRoute, Link, notFound } from "@tanstack/react-router";

import { listConnectionsFn } from "@/features/social-discovery/api";
import { NotFoundError } from "@/shared/lib/errors";
import { buttonVariants } from "@/shared/ui/button";
import { PageHeader } from "@/shared/ui/page-header";
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
      <PageHeader title="Profile not found" className="mb-2 justify-center" />
      <Link to="/" className={buttonVariants({ variant: "outline" })}>
        Go home
      </Link>
    </div>
  );
}

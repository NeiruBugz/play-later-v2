import Link from "next/link";

import { getWishlistedGames } from "@/features/view-wishlist/server-actions";
import { EmptyState, ErrorState, Pagination } from "@/shared/components";
import { LibraryItemCard } from "@/shared/components/library-item-card";

export async function WishlistedList(props: {
  params: Record<string, string | string[] | undefined>;
}) {
  const { params } = props;
  const page = Number(params.page ?? 1) || 1;
  const search = (params.search as string) || undefined;

  const { data, serverError } = await getWishlistedGames({ page, limit: 24, search });

  if (serverError) {
    return <ErrorState message={serverError} />;
  }

  const items = data?.items ?? [];
  const count = data?.count ?? 0;

  if (!items.length) {
    return (
      <EmptyState
        title="Your wishlist is empty"
        description={
          (
            <>
              Start
              {" "}
              <Link
                href="/collection/add-game"
                className="font-semibold text-primary underline hover:no-underline"
              >
                adding
              </Link>
              {" "}games to your wishlist
            </>
          )
        }
      />
    );
  }

  return (
    <div className="space-y-6">
      <ul className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-7">
        {items.map(({ game, libraryItems }) => (
          <li key={game.id}>
            <LibraryItemCard
              game={{
                id: game.id,
                title: game.title,
                coverImage: game.coverImage,
                igdbId: game.igdbId,
              }}
              libraryItems={libraryItems}
            />
          </li>
        ))}
      </ul>
      <Pagination total={count} pageSize={24} basePath="/collection/wishlist" />
    </div>
  );
}

import { auth } from "@/auth";

import { getWishlistedGamesByUsername } from "@/features/view-wishlist/server-actions";
import {
  EmptyState,
  ErrorState,
  ListSearchInput,
  Pagination,
  Toolbar,
} from "@/shared/components";
import { Header } from "@/shared/components/header";
import { LibraryItemCard } from "@/shared/components/library-item-card";

export default async function SharedWishlistPage(
  props: PageProps<"/wishlist/[username]">
) {
  const session = await auth();
  const { username } = await props.params;
  const decodedUsername = decodeURIComponent(username);
  const awaitedSearchParams = await props.searchParams;

  const page = Number(awaitedSearchParams.page ?? 1) || 1;
  const search = (awaitedSearchParams.search as string) || undefined;

  const { data, serverError } = await getWishlistedGamesByUsername({
    username: decodedUsername,
    page,
    limit: 24,
    search,
  });

  if (serverError) {
    return <ErrorState message={serverError} />;
  }

  const items = data?.items ?? [];
  const count = data?.count ?? 0;

  return (
    <div>
      <Header authorized={session !== null} />
      <div className="container overflow-hidden px-4 py-8 pt-[60px]">
        <div className="mb-6 mt-4 flex flex-col gap-2">
          <h1 className="text-3xl font-bold tracking-tight">
            {decodedUsername}&apos;s wishlist
          </h1>
        </div>

        <Toolbar
          searchSlot={<ListSearchInput placeholder="Search wishlist..." />}
        />

        {items.length === 0 ? (
          <EmptyState title="No wishlist found" />
        ) : (
          <div className="space-y-6">
            <ul className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-7">
              {items.map(({ game, libraryItems }) => (
                <li key={game.id}>
                  <LibraryItemCard
                    game={{
                      id: String(game.id),
                      title: game.title,
                      coverImage: game.coverImage,
                      igdbId: game.igdbId,
                    }}
                    libraryItems={libraryItems}
                    isFromSharedWishlist={true}
                  />
                </li>
              ))}
            </ul>
            <Pagination total={count} pageSize={24} />
          </div>
        )}
      </div>
    </div>
  );
}

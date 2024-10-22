import { getUserGamesWithGroupedBacklog } from "@/src/entities/backlog-item";
import { CollectionFilters } from "@/src/widgets/collection-filters";
import { CollectionFiltersSkeleton } from "@/src/widgets/collection-filters-skeleton";
import { GridView } from "@/src/widgets/grid-view";
import Link from "next/link";
import { Suspense } from "react";

export async function CollectionList({
  params,
}: {
  params: Record<string, string>;
}) {
  const { collection, count } = await getUserGamesWithGroupedBacklog({
    platform: params.platform,
    status: params.status,
    search: params.search,
    page: Number(params.page) || 1,
  });

  if (
    !collection ||
    (collection.length === 0 && Object.keys(params).length === 0)
  ) {
    return (
      <div className="flex flex-col items-center justify-center">
        <h1 className="text-3xl font-bold">Your collection is empty</h1>
        <p className="text-gray-500">
          Start{" "}
          <Link
            href="/collection/add-game"
            className="hover:font-bolder cursor-pointer font-bold underline"
          >
            adding
          </Link>{" "}
          games to your collection
        </p>
      </div>
    );
  }

  if (collection.length === 0 && Object.keys(params).length !== 0) {
    return (
      <div>
        <Suspense fallback={<CollectionFiltersSkeleton />}>
          <CollectionFilters count={count} />
        </Suspense>
        <div>No matches found</div>
      </div>
    );
  }

  return (
    <div>
      <Suspense fallback={<CollectionFiltersSkeleton />}>
        <CollectionFilters count={count} />
      </Suspense>
      <GridView backlogItems={collection} />
    </div>
  );
}

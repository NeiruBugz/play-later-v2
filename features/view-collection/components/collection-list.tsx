import { GridView } from "@/shared/components/grid-view";
import Link from "next/link";
import { Suspense } from "react";
import { getUserGamesWithGroupedBacklogPaginated } from "../server-actions/get-game-with-backlog-items";
import { CollectionFilters } from "./collection-filters";
import { CollectionFiltersSkeleton } from "./collection-filters-skeleton";
import { Pagination } from "./pagination";

export async function CollectionList({
  params,
}: {
  params: Record<string, string>;
}) {
  const { collection, count } = await getUserGamesWithGroupedBacklogPaginated({
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
          Start&nbsp;
          <Link
            href="/collection/add-game"
            className="hover:font-bolder cursor-pointer font-bold underline"
          >
            adding
          </Link>
          &nbsp; games to your collection
        </p>
      </div>
    );
  }

  if (collection.length === 0 && Object.keys(params).length !== 0) {
    return (
      <div>
        <div>No matches found</div>
      </div>
    );
  }

  return (
    <div>
      <GridView backlogItems={collection} />
      <div className="my-3 flex items-center justify-center">
        <Pagination totalCount={count} />
      </div>
    </div>
  );
}

import Link from "next/link";

import { FilterParamsSchema } from "@/features/view-collection/lib/validation";
import { GridView } from "@/shared/components/grid-view";
import { ListView } from "@/shared/components/list-view";

import { getUserGamesWithGroupedBacklogPaginated } from "../server-actions/get-game-with-backlog-items";
import { Pagination } from "./pagination";

export async function CollectionList({
  params,
}: {
  params: Record<string, string | string[] | undefined>;
}) {
  const parsedParams = FilterParamsSchema.parse(params);

  const { data, serverError } = await getUserGamesWithGroupedBacklogPaginated({
    platform: parsedParams.platform,
    status: parsedParams.status,
    search: parsedParams.search,
    page: parsedParams.page,
  });

  if (serverError !== undefined) {
    return <div>{serverError}</div>;
  }

  if (!data) {
    <div className="flex flex-col items-center justify-center py-12">
      <div className="space-y-4 text-center">
        <h1 className="text-3xl font-bold">Your collection is empty</h1>
        <p className="text-muted-foreground">
          Start{" "}
          <Link
            href="/collection/add-game"
            className="font-semibold text-primary underline hover:no-underline"
          >
            adding games
          </Link>{" "}
          to your collection to get started
        </p>
      </div>
    </div>;
  }

  const viewMode = params.viewMode || "grid";

  if (
    !data?.collection ||
    (data.collection.length === 0 && Object.keys(params).length === 0)
  ) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <div className="space-y-4 text-center">
          <h1 className="text-3xl font-bold">Your collection is empty</h1>
          <p className="text-muted-foreground">
            Start{" "}
            <Link
              href="/collection/add-game"
              className="font-semibold text-primary underline hover:no-underline"
            >
              adding games
            </Link>{" "}
            to your collection to get started
          </p>
        </div>
      </div>
    );
  }

  if (data.collection.length === 0 && Object.keys(params).length !== 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <div className="space-y-4 text-center">
          <h2 className="text-2xl font-semibold">No games found</h2>
          <p className="text-muted-foreground">
            Try adjusting your filters or search terms
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Results */}
      {viewMode === "list" ? (
        <ListView backlogItems={data.collection} />
      ) : (
        <GridView backlogItems={data.collection} />
      )}

      {/* Pagination */}
      <div className="flex items-center justify-center">
        <Pagination totalCount={data.count} />
      </div>
    </div>
  );
}

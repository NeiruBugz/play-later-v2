"use client";

import Link from "next/link";

import { FilterParamsSchema } from "@/features/view-collection/lib/validation";
import { GridView } from "@/shared/components/grid-view";
import { ListView } from "@/shared/components/list-view";

import { useGetCollection } from "../hooks/use-get-collection";
import { Pagination } from "./pagination";

export function CollectionList(props: {
  params: Record<string, string | string[] | undefined>;
}) {
  const { params } = props;

  const validatedParams = FilterParamsSchema.safeParse({
    platform: params.platform || "",
    status: params.status || "",
    search: params.search || "",
    page: params.page,
  });

  const filterParams = validatedParams.success
    ? validatedParams.data
    : {
        platform: "",
        status: "",
        search: "",
        page: 1,
      };

  const { data, isLoading, isError } = useGetCollection(filterParams);

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <div className="space-y-4 text-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
          <p className="text-muted-foreground">Loading your collection...</p>
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <div className="space-y-4 text-center">
          <h2 className="text-2xl font-semibold text-destructive">
            Something went wrong
          </h2>
          <p className="text-muted-foreground">
            Failed to load your collection. Please try refreshing the page.
          </p>
        </div>
      </div>
    );
  }

  if (!data) {
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
      {viewMode === "list" ? (
        <ListView backlogItems={data.collection} />
      ) : (
        <GridView backlogItems={data.collection} />
      )}

      <div className="flex items-center justify-center">
        <Pagination totalCount={data.count} />
      </div>
    </div>
  );
}

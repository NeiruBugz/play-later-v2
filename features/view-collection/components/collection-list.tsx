"use client";

import Link from "next/link";

import { FilterParamsSchema } from "@/features/view-collection/lib/validation";
import { GridSkeleton } from "@/shared/components";
import { GridView } from "@/shared/components/grid-view";
import { EmptyState } from "@/shared/components/list/empty-state";
import { ErrorState } from "@/shared/components/list/error-state";
import { Pagination } from "@/shared/components/list/pagination";

import { useGetCollection } from "../hooks/use-get-collection";

// removed local pagination in favor of shared pagination

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
    return <GridSkeleton count={12} />;
  }

  if (isError) {
    return (
      <ErrorState message="Failed to load your collection. Please try refreshing." />
    );
  }

  if (!data) {
    return (
      <EmptyState
        title="Your collection is empty"
        description={
          (
            <>
              Start{" "}
              <Link
                href="/collection/add-game"
                className="font-semibold text-primary underline hover:no-underline"
              >
                adding games
              </Link>{" "}
              to your collection to get started
            </>
          ) as unknown as string
        }
      />
    );
  }

  // Grid-only view; view mode has been removed

  if (
    !data?.collection ||
    (data.collection.length === 0 && Object.keys(params).length === 0)
  ) {
    return (
      <EmptyState
        title="Your collection is empty"
        description={
          (
            <>
              Start{" "}
              <Link
                href="/collection/add-game"
                className="font-semibold text-primary underline hover:no-underline"
              >
                adding games
              </Link>{" "}
              to your collection to get started
            </>
          ) as unknown as string
        }
      />
    );
  }

  if (data.collection.length === 0 && Object.keys(params).length !== 0) {
    return (
      <EmptyState
        title="No games found"
        description="Try adjusting your filters or search terms"
      />
    );
  }

  return (
    <div className="space-y-6">
      <GridView libraryItems={data.collection} />
      <Pagination total={data.count} pageSize={24} basePath="/collection" />
    </div>
  );
}

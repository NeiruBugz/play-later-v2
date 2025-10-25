"use client";

import { AlertCircle, RefreshCw, X } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";

import { Button } from "@/shared/components/ui/button";
import { createLogger } from "@/shared/lib/app/logger";
import type { FilterParams } from "@/shared/types/collection";

import { useGetCollection } from "../hooks/use-get-collection";
import { CollectionFilters } from "./collection-filters";
import { CollectionGrid } from "./collection-grid";

const logger = createLogger({ component: "CollectionView" });

interface CollectionViewProps {
  availablePlatforms: string[];
}

export function CollectionView({ availablePlatforms }: CollectionViewProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const filters: Omit<FilterParams, "page"> & { page?: number } = {
    search: searchParams.get("search") || "",
    status: searchParams.get("status") || "",
    platform: searchParams.get("platform") || "",
    page: searchParams.get("page")
      ? Number(searchParams.get("page"))
      : undefined,
  };

  const { data, isLoading, error, refetch } = useGetCollection(filters);

  const handleApplyFilters = (newFilters: Omit<FilterParams, "page">) => {
    const params = new URLSearchParams();

    if (newFilters.search) params.set("search", newFilters.search);
    if (newFilters.status) params.set("status", newFilters.status);
    if (newFilters.platform) params.set("platform", newFilters.platform);

    router.push(`/library?${params.toString()}`);
  };

  const handleClearFilters = () => {
    router.push("/library");
  };

  const hasActiveFilters = filters.search || filters.status || filters.platform;

  if (error) {
    logger.error({ error, filters }, "Failed to load user collection");

    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <div className="mx-auto max-w-md space-y-4 text-center">
          <div className="flex justify-center">
            <AlertCircle className="text-destructive h-12 w-12" />
          </div>
          <div>
            <h2 className="text-xl font-semibold">
              Unable to Load Your Library
            </h2>
            <p className="text-muted-foreground mt-2">
              We're having trouble loading your game collection.
              {hasActiveFilters && " Try clearing your filters or "}
              This could be a temporary issue.
            </p>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row sm:justify-center">
            <Button
              onClick={() => refetch()}
              variant="default"
              className="gap-2"
              aria-label="Retry loading collection"
            >
              <RefreshCw className="h-4 w-4" aria-hidden="true" />
              Try Again
            </Button>
            {hasActiveFilters && (
              <Button
                onClick={handleClearFilters}
                variant="outline"
                className="gap-2"
                aria-label="Clear all active filters"
              >
                <X className="h-4 w-4" aria-hidden="true" />
                Clear Filters
              </Button>
            )}
            <Button
              onClick={() => router.push("/dashboard")}
              variant="outline"
              aria-label="Go to dashboard"
            >
              Go to Dashboard
            </Button>
          </div>
          <p className="text-muted-foreground text-xs">
            If this problem persists, please contact support.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">My Library</h1>
          <p className="text-muted-foreground">
            {isLoading
              ? "Loading..."
              : `${data.count} games in your collection`}
          </p>
        </div>
      </div>

      <CollectionFilters
        filters={filters}
        onApplyFilters={handleApplyFilters}
        onClearFilters={handleClearFilters}
        availablePlatforms={availablePlatforms}
      />

      {isLoading ? (
        <div className="flex min-h-[400px] items-center justify-center">
          <div className="text-muted-foreground">
            Loading your collection...
          </div>
        </div>
      ) : (
        <CollectionGrid items={data.collection} />
      )}
    </div>
  );
}

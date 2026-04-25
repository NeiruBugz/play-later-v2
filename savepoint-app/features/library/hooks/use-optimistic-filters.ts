"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useOptimistic, useTransition } from "react";

import type { LibraryItemStatus } from "@/shared/types";

import {
  useLibraryFilters,
  type LibraryFilterValues,
  type LibrarySortBy,
} from "./use-library-filters";

type OptimisticFilterPatch = Partial<{
  status: LibraryItemStatus | null;
  platform: string | null;
  sortBy: LibrarySortBy;
  sortOrder: "asc" | "desc" | null;
  search: string | null;
  minRating: number | null;
  unratedOnly: boolean | null;
}>;

type PendingField = "status" | "platform" | "sort" | "search" | "clear" | null;

export type OptimisticFilters = {
  filters: LibraryFilterValues;
  isPending: boolean;
  pendingField: PendingField;
  setStatus: (status: LibraryItemStatus | null) => void;
  setPlatform: (platform: string | null) => void;
  setSort: (sortBy: LibrarySortBy, sortOrder?: "asc" | "desc") => void;
  setSearch: (term: string | null) => void;
  clearAll: () => void;
};

function buildLibraryUrl(
  base: URLSearchParams,
  patch: OptimisticFilterPatch
): string {
  const params = new URLSearchParams(base.toString());

  if ("status" in patch) {
    if (patch.status) {
      params.set("status", patch.status);
    } else {
      params.delete("status");
    }
  }
  if ("platform" in patch) {
    if (patch.platform) {
      params.set("platform", patch.platform);
    } else {
      params.delete("platform");
    }
  }
  if ("sortBy" in patch && patch.sortBy !== undefined) {
    if (patch.sortBy === "rating-desc" || patch.sortBy === "rating-asc") {
      params.set("sortBy", patch.sortBy);
      params.delete("sortOrder");
    } else {
      params.set("sortBy", patch.sortBy);
      if (patch.sortOrder) {
        params.set("sortOrder", patch.sortOrder);
      }
    }
  }
  if ("search" in patch) {
    if (patch.search) {
      params.set("search", patch.search);
    } else {
      params.delete("search");
    }
  }
  if ("minRating" in patch) {
    if (patch.minRating !== null && patch.minRating !== undefined) {
      params.set("minRating", String(patch.minRating));
    } else {
      params.delete("minRating");
    }
  }
  if ("unratedOnly" in patch) {
    if (patch.unratedOnly) {
      params.set("unratedOnly", "1");
    } else {
      params.delete("unratedOnly");
    }
  }

  const qs = params.toString();
  return qs ? `/library?${qs}` : "/library";
}

function mergeOptimistic(
  base: LibraryFilterValues,
  patch: OptimisticFilterPatch
): LibraryFilterValues {
  return {
    ...base,
    status: "status" in patch ? (patch.status ?? undefined) : base.status,
    platform:
      "platform" in patch ? (patch.platform ?? undefined) : base.platform,
    sortBy: patch.sortBy ?? base.sortBy,
    sortOrder: patch.sortOrder ?? base.sortOrder,
    search: "search" in patch ? (patch.search ?? undefined) : base.search,
    minRating:
      "minRating" in patch ? (patch.minRating ?? undefined) : base.minRating,
    unratedOnly:
      "unratedOnly" in patch
        ? (patch.unratedOnly ?? undefined)
        : base.unratedOnly,
  };
}

function derivePendingField(
  optimistic: LibraryFilterValues,
  url: LibraryFilterValues,
  isPending: boolean
): PendingField {
  if (!isPending) return null;
  if (optimistic.status !== url.status) return "status";
  if (optimistic.platform !== url.platform) return "platform";
  if (
    optimistic.sortBy !== url.sortBy ||
    optimistic.sortOrder !== url.sortOrder
  )
    return "sort";
  if (optimistic.search !== url.search) return "search";
  return "clear";
}

export function useOptimisticFilters(): OptimisticFilters {
  const router = useRouter();
  const searchParams = useSearchParams();
  const urlFilters = useLibraryFilters();
  const [isPending, startTransition] = useTransition();

  const [optimisticFilters, addOptimistic] = useOptimistic(
    urlFilters,
    mergeOptimistic
  );

  const pendingField = derivePendingField(
    optimisticFilters,
    urlFilters,
    isPending
  );

  const setStatus = (status: LibraryItemStatus | null) => {
    const patch: OptimisticFilterPatch = { status };
    startTransition(() => {
      addOptimistic(patch);
      router.push(buildLibraryUrl(searchParams, patch), { scroll: false });
    });
  };

  const setPlatform = (platform: string | null) => {
    const patch: OptimisticFilterPatch = { platform };
    startTransition(() => {
      addOptimistic(patch);
      router.push(buildLibraryUrl(searchParams, patch), { scroll: false });
    });
  };

  const setSort = (sortBy: LibrarySortBy, sortOrder?: "asc" | "desc") => {
    const patch: OptimisticFilterPatch = {
      sortBy,
      sortOrder: sortOrder ?? null,
    };
    startTransition(() => {
      addOptimistic(patch);
      router.push(buildLibraryUrl(searchParams, patch), { scroll: false });
    });
  };

  const setSearch = (term: string | null) => {
    const patch: OptimisticFilterPatch = { search: term };
    startTransition(() => {
      addOptimistic(patch);
      router.push(buildLibraryUrl(searchParams, patch), { scroll: false });
    });
  };

  const clearAll = () => {
    const emptyPatch: OptimisticFilterPatch = {
      status: null,
      platform: null,
      search: null,
      minRating: null,
      unratedOnly: null,
    };
    startTransition(() => {
      addOptimistic(emptyPatch);
      const params = new URLSearchParams(searchParams.toString());
      params.delete("status");
      params.delete("platform");
      params.delete("search");
      params.delete("minRating");
      params.delete("unratedOnly");
      const qs = params.toString();
      router.push(qs ? `/library?${qs}` : "/library", { scroll: false });
    });
  };

  return {
    filters: optimisticFilters,
    isPending,
    pendingField,
    setStatus,
    setPlatform,
    setSort,
    setSearch,
    clearAll,
  };
}

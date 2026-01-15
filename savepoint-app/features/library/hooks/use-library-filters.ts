"use client";

import { useSearchParams } from "next/navigation";

import type { LibraryItemStatus } from "@/shared/types";

export type LibraryFilterValues = {
  status?: LibraryItemStatus;
  platform?: string;
  search?: string;
  sortBy: "createdAt" | "releaseDate" | "startedAt" | "completedAt";
  sortOrder: "asc" | "desc";
};

export function useLibraryFilters(): LibraryFilterValues {
  const searchParams = useSearchParams();

  const statusParam = searchParams.get("status");
  const status = statusParam as LibraryItemStatus | null;

  const platform = searchParams.get("platform") ?? undefined;
  const search = searchParams.get("search") ?? undefined;

  const VALID_SORT_BY = new Set([
    "releaseDate",
    "startedAt",
    "completedAt",
    "createdAt",
  ]);
  const sortByParam = searchParams.get("sortBy");
  const sortBy = VALID_SORT_BY.has(sortByParam ?? "")
    ? (sortByParam as LibraryFilterValues["sortBy"])
    : "createdAt";
  const sortOrderParam = searchParams.get("sortOrder");
  const sortOrder = sortOrderParam === "asc" ? "asc" : "desc";
  return {
    status: status ?? undefined,
    platform,
    search,
    sortBy,
    sortOrder,
  };
}

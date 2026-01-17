"use client";

import { useSearchParams } from "next/navigation";

import type { LibraryItemStatus } from "@/shared/types";

export type LibraryFilterValues = {
  status?: LibraryItemStatus;
  platform?: string;
  search?: string;
  sortBy:
    | "updatedAt"
    | "createdAt"
    | "releaseDate"
    | "startedAt"
    | "completedAt"
    | "title";
  sortOrder: "asc" | "desc";
};

export function useLibraryFilters(): LibraryFilterValues {
  const searchParams = useSearchParams();

  const statusParam = searchParams.get("status");
  const status = statusParam as LibraryItemStatus | null;

  const platform = searchParams.get("platform") ?? undefined;
  const search = searchParams.get("search") ?? undefined;

  const VALID_SORT_BY = new Set([
    "updatedAt",
    "createdAt",
    "releaseDate",
    "startedAt",
    "completedAt",
    "title",
  ]);
  const sortByParam = searchParams.get("sortBy");
  const sortBy = VALID_SORT_BY.has(sortByParam ?? "")
    ? (sortByParam as LibraryFilterValues["sortBy"])
    : "updatedAt";
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

"use client";

import { useSearchParams } from "next/navigation";

import type { LibraryItemStatus } from "@/shared/types";

export type LibrarySortBy =
  | "updatedAt"
  | "createdAt"
  | "releaseDate"
  | "startedAt"
  | "completedAt"
  | "title"
  | "rating-desc"
  | "rating-asc";

export type LibraryFilterValues = {
  status?: LibraryItemStatus;
  platform?: string;
  search?: string;
  sortBy: LibrarySortBy;
  sortOrder: "asc" | "desc";
  minRating?: number;
  unratedOnly?: boolean;
};

export function useLibraryFilters(): LibraryFilterValues {
  const searchParams = useSearchParams();

  const statusParam = searchParams.get("status");
  const status = statusParam as LibraryItemStatus | null;

  const platform = searchParams.get("platform") ?? undefined;
  const search = searchParams.get("search") ?? undefined;

  const VALID_SORT_BY = new Set<LibrarySortBy>([
    "updatedAt",
    "createdAt",
    "releaseDate",
    "startedAt",
    "completedAt",
    "title",
    "rating-desc",
    "rating-asc",
  ]);
  const sortByParam = searchParams.get("sortBy");
  const sortBy: LibrarySortBy = VALID_SORT_BY.has(sortByParam as LibrarySortBy)
    ? (sortByParam as LibrarySortBy)
    : "updatedAt";
  const sortOrderParam = searchParams.get("sortOrder");
  const sortOrder = sortOrderParam === "asc" ? "asc" : "desc";

  const minRatingParam = searchParams.get("minRating");
  const parsedMinRating = minRatingParam ? Number(minRatingParam) : null;
  const minRating =
    parsedMinRating !== null &&
    Number.isFinite(parsedMinRating) &&
    Number.isInteger(parsedMinRating) &&
    parsedMinRating >= 1 &&
    parsedMinRating <= 10
      ? parsedMinRating
      : undefined;

  const unratedOnly =
    searchParams.get("unratedOnly") === "1" ? true : undefined;

  return {
    status: status ?? undefined,
    platform,
    search,
    sortBy,
    sortOrder,
    minRating,
    unratedOnly,
  };
}

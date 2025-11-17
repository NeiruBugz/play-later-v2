"use client";
import type { LibraryItemStatus } from "@prisma/client";
import { useSearchParams } from "next/navigation";

export type LibraryFilterValues = {
  status?: LibraryItemStatus;
  platform?: string;
  search?: string;
  sortBy: "createdAt" | "releaseDate" | "startedAt" | "completedAt";
  sortOrder: "asc" | "desc";
};

export function useLibraryFilters(): LibraryFilterValues {
  const searchParams = useSearchParams();
  // Extract status with type safety
  const statusParam = searchParams.get("status");
  const status = statusParam as LibraryItemStatus | null;
  // Extract other filter parameters
  const platform = searchParams.get("platform") ?? undefined;
  const search = searchParams.get("search") ?? undefined;
  // Extract sorting with defaults
  const sortByParam = searchParams.get("sortBy");
  const sortBy =
    sortByParam === "releaseDate" ||
    sortByParam === "startedAt" ||
    sortByParam === "completedAt"
      ? sortByParam
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

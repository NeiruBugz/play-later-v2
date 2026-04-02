"use client";

import { useInfiniteQuery } from "@tanstack/react-query";

import type { FeedCursor, PaginatedFeed } from "../types";

type ApiResponse = {
  success: boolean;
  data: PaginatedFeed;
  error?: string;
};

async function fetchFeed(cursor?: FeedCursor): Promise<PaginatedFeed> {
  const params = new URLSearchParams();
  if (cursor) {
    params.set("cursor", JSON.stringify(cursor));
  }
  const response = await fetch(`/api/social/feed?${params.toString()}`);
  if (!response.ok) {
    throw new Error("Failed to fetch activity feed");
  }
  const json = (await response.json()) as ApiResponse;
  if (!json.success) {
    throw new Error(json.error ?? "Failed to fetch activity feed");
  }
  return json.data;
}

type UseActivityFeedOptions = {
  initialData?: PaginatedFeed;
};

export function useActivityFeed(options?: UseActivityFeedOptions) {
  return useInfiniteQuery({
    queryKey: ["activity-feed"],
    queryFn: ({ pageParam }) => fetchFeed(pageParam),
    getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
    initialPageParam: undefined as FeedCursor | undefined,
    ...(options?.initialData && {
      initialData: {
        pages: [options.initialData],
        pageParams: [undefined],
      },
    }),
  });
}

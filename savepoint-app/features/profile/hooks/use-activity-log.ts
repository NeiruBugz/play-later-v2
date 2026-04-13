"use client";

import {
  type FeedCursor,
  type PaginatedFeedResult,
} from "@/data-access-layer/repository";
import { useInfiniteQuery } from "@tanstack/react-query";

import { fetchUserActivityAction } from "../server-actions/fetch-user-activity-action";

function normalizeDates(result: PaginatedFeedResult): PaginatedFeedResult {
  return {
    items: result.items.map((item) => ({
      ...item,
      createdAt: new Date(item.createdAt),
      statusChangedAt: item.statusChangedAt
        ? new Date(item.statusChangedAt)
        : null,
      activityTimestamp: new Date(item.activityTimestamp),
    })),
    nextCursor: result.nextCursor
      ? {
          timestamp: new Date(result.nextCursor.timestamp),
          id: Number(result.nextCursor.id),
        }
      : null,
  };
}

type UseActivityLogOptions = {
  userId: string;
  initialData?: PaginatedFeedResult;
};

export function useActivityLog({ userId, initialData }: UseActivityLogOptions) {
  return useInfiniteQuery({
    queryKey: ["activity-log", userId],
    queryFn: async ({ pageParam }) => {
      const result = await fetchUserActivityAction({
        userId,
        cursor: pageParam,
      });
      return normalizeDates(result);
    },
    getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
    initialPageParam: undefined as FeedCursor | undefined,
    ...(initialData && {
      initialData: {
        pages: [normalizeDates(initialData)],
        pageParams: [undefined],
      },
    }),
  });
}

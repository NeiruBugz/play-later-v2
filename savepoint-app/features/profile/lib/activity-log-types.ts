import type {
  FeedCursor,
  FeedItemRow,
  PaginatedFeedResult,
} from "@/data-access-layer/repository";

export type ActivityLogItem = FeedItemRow;
export type ActivityLogCursor = FeedCursor;
export type ActivityLogPage = PaginatedFeedResult;

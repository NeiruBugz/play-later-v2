import type {
  FeedItemRow,
  PaginatedFeedResult,
  FeedCursor as RepoFeedCursor,
} from "@/data-access-layer/repository";

import type { PaginatedFeed } from "@/features/social/types";

export type ActivityFeedItem = FeedItemRow;
export type ActivityFeedPage = PaginatedFeedResult;
export type ActivityFeedRepoCursor = RepoFeedCursor;

export type GetFeedForUserResult = PaginatedFeed;
export type GetPopularFeedResult = PaginatedFeed;
export type GetUserActivityResult = PaginatedFeed;

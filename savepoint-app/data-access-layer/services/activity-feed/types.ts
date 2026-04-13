import type {
  FeedCursor as RepoFeedCursor,
  FeedItemRow,
  PaginatedFeedResult,
} from "@/data-access-layer/repository";

import type { PaginatedFeed } from "@/features/social/types";

import type { ServiceResult } from "../types";

export type GetFeedForUserResult = ServiceResult<PaginatedFeed>;
export type GetPopularFeedResult = ServiceResult<PaginatedFeed>;
export type GetUserActivityResult = ServiceResult<PaginatedFeed>;

export type ActivityFeedItem = FeedItemRow;
export type ActivityFeedPage = PaginatedFeedResult;
export type ActivityFeedRepoCursor = RepoFeedCursor;

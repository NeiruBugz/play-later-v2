import type { FeedCursor, FeedItem } from "@/features/social/types";

export interface ActivityFeedHandlerInput {
  userId: string;
  cursor?: string;
  limit?: string;
}

export interface ActivityFeedHandlerOutput {
  items: FeedItem[];
  nextCursor: FeedCursor | null;
}

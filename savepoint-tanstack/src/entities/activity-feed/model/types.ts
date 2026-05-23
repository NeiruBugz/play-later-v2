import { z } from "zod";

/**
 * Activity-feed types.
 *
 * Activity is a view-driven query over `LibraryItem`. There is no dedicated
 * `Activity` Prisma model — canonical and tanstack both derive the feed from
 * library-item status events joined with the follow graph.
 */

export const FeedCursorSchema = z.object({
  timestamp: z.string(),
  id: z.number().int(),
});

export type FeedCursor = z.infer<typeof FeedCursorSchema>;

export type FeedItem = {
  id: number;
  status: string;
  activityTimestamp: Date;
  userId: string;
  gameId: string;
  userName: string | null;
  userUsername: string | null;
  userImage: string | null;
  gameTitle: string;
  gameCoverImage: string | null;
  gameSlug: string;
};

export type ActivityFeedResult = {
  items: FeedItem[];
  nextCursor: FeedCursor | null;
};

export const FEED_DEFAULT_LIMIT = 20;
export const FEED_MAX_LIMIT = 50;

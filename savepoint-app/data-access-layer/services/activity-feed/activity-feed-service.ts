import "server-only";

import {
  findActivityByUserId,
  findFeedForUser,
  findPopularFeed,
  type FeedItemRow,
  type PaginatedFeedResult,
  type FeedCursor as RepoCursor,
} from "@/data-access-layer/repository";

import type {
  FeedCursor,
  FeedEventType,
  FeedItem,
  PaginatedFeed,
} from "@/features/social/types";
import { createLogger, LOGGER_CONTEXT } from "@/shared/lib";

import { handleServiceError, serviceSuccess } from "../types";
import type {
  GetFeedForUserResult,
  GetPopularFeedResult,
  GetUserActivityResult,
} from "./types";

const DEFAULT_FEED_LIMIT = 20;

function computeEventType(row: FeedItemRow): FeedEventType {
  return row.statusChangedAt !== null ? "STATUS_CHANGE" : "LIBRARY_ADD";
}

function mapRowToFeedItem(row: FeedItemRow): FeedItem {
  return {
    id: String(row.id),
    eventType: computeEventType(row),
    status: row.status,
    timestamp: row.activityTimestamp,
    user: {
      id: row.userId,
      name: row.userName,
      username: row.userUsername,
      image: row.userImage,
    },
    game: {
      id: row.gameId,
      title: row.gameTitle,
      coverImage: row.gameCoverImage,
      slug: row.gameSlug,
    },
  };
}

function mapPaginatedResult(result: PaginatedFeedResult): PaginatedFeed {
  return {
    items: result.items.map(mapRowToFeedItem),
    nextCursor: result.nextCursor
      ? {
          timestamp: result.nextCursor.timestamp.toISOString(),
          id: String(result.nextCursor.id),
        }
      : null,
  };
}

function parseCursor(cursor?: FeedCursor): RepoCursor | undefined {
  if (!cursor) return undefined;
  return {
    timestamp: new Date(cursor.timestamp),
    id: Number(cursor.id),
  };
}

export class ActivityFeedService {
  private logger = createLogger({
    [LOGGER_CONTEXT.SERVICE]: "ActivityFeedService",
  });

  async getFeedForUser(
    userId: string,
    cursor?: FeedCursor,
    limit?: number
  ): Promise<GetFeedForUserResult> {
    try {
      const feedLimit = limit ?? DEFAULT_FEED_LIMIT;
      const parsedCursor = parseCursor(cursor);

      this.logger.debug(
        { userId, cursor: parsedCursor, limit: feedLimit },
        "Fetching user feed"
      );

      const result = await findFeedForUser(userId, parsedCursor, feedLimit);

      return serviceSuccess(mapPaginatedResult(result));
    } catch (error) {
      return handleServiceError(error, "Failed to fetch user feed");
    }
  }

  async getPopularFeed(
    excludeUserId?: string,
    cursor?: FeedCursor,
    limit?: number
  ): Promise<GetPopularFeedResult> {
    try {
      const feedLimit = limit ?? DEFAULT_FEED_LIMIT;
      const parsedCursor = parseCursor(cursor);

      this.logger.debug(
        { excludeUserId, cursor: parsedCursor, limit: feedLimit },
        "Fetching popular feed"
      );

      const result = await findPopularFeed(
        excludeUserId,
        parsedCursor,
        feedLimit
      );

      return serviceSuccess(mapPaginatedResult(result));
    } catch (error) {
      return handleServiceError(error, "Failed to fetch popular feed");
    }
  }

  async getUserActivity(
    userId: string,
    cursor?: FeedCursor,
    limit?: number
  ): Promise<GetUserActivityResult> {
    try {
      const feedLimit = limit ?? DEFAULT_FEED_LIMIT;
      const parsedCursor = parseCursor(cursor);

      this.logger.debug(
        { userId, cursor: parsedCursor, limit: feedLimit },
        "Fetching user activity"
      );

      const result = await findActivityByUserId(
        userId,
        parsedCursor,
        feedLimit
      );

      return serviceSuccess(mapPaginatedResult(result));
    } catch (error) {
      return handleServiceError(error, "Failed to fetch user activity");
    }
  }
}

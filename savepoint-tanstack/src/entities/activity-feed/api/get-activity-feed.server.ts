import { prisma } from "@/shared/lib/db.server";

import { Prisma } from "../../../../shared/lib/prisma/client.ts";
import {
  FEED_DEFAULT_LIMIT,
  FEED_MAX_LIMIT,
  type ActivityFeedResult,
  type FeedCursor,
  type FeedItem,
} from "../model/types";

/**
 * Activity feed query (view-driven, no Activity table).
 *
 * Mirrors canonical `findFeedForUser`: a raw SQL union over `LibraryItem`
 * joined with `Follow` + `user` + `Game`, ordered by
 * `GREATEST(createdAt, statusChangedAt) DESC, id DESC`.
 *
 * Raw SQL is required because Prisma cannot express:
 *   1. `GREATEST(createdAt, statusChangedAt)` as a computed sort key.
 *   2. Composite keyset pagination on (timestamp, id) inequality.
 *
 * Privacy invariant: only LibraryItem rows owned by users with
 * `isPublicProfile = true` appear in the feed. The viewer's own activity is
 * NOT included (the social feed shows followees, not self — self-follow is
 * disallowed at the mutation layer).
 */
export async function getActivityFeedForViewer(
  viewerUserId: string,
  options: { cursor?: FeedCursor; limit?: number } = {}
): Promise<ActivityFeedResult> {
  const effectiveLimit = clampLimit(options.limit ?? FEED_DEFAULT_LIMIT);
  const cursorCondition = buildCursorCondition(options.cursor);

  const rows = await prisma.$queryRaw<Array<Record<string, unknown>>>`
    SELECT ${SELECT_COLUMNS}
    FROM "LibraryItem" li
    JOIN "Follow" f ON f."followingId" = li."userId"
    JOIN "user" u ON u."id" = li."userId"
    JOIN "Game" g ON g."id" = li."gameId"
    WHERE f."followerId" = ${viewerUserId}
      AND u."isPublicProfile" = true
      ${cursorCondition}
    ${ORDER_BY}
    LIMIT ${effectiveLimit}`;

  const items = mapRawRows(rows);
  return {
    items,
    nextCursor: buildNextCursor(items, effectiveLimit),
  };
}

/**
 * Per-user activity for a single user — used by the per-user activity tab on
 * `/u/$username/activity`. Returns the target user's own LibraryItem stream
 * (no follow-graph join).
 *
 * Privacy invariant (owner-bypass): a PUBLIC profile's activity is visible to
 * anyone (signed-out included); a PRIVATE profile's activity is visible ONLY
 * to the owner (`viewerUserId === targetUserId`). This mirrors
 * `getPublicProfile`'s semantics (private ⇒ owner-only) and lives here on the
 * entity — not the route — so the network-callable `getActivityForUserFn`
 * cannot bypass it. A private-profile non-owner gets an empty list (the
 * profile page itself already 404s a private profile via `getPublicProfile`;
 * returning empty activity is consistent and avoids leaking existence).
 *
 * `viewerUserId` is the resolved server-side session id (or `undefined` for
 * anonymous callers). It is coalesced to `null` before binding so the SQL
 * comparison `li."userId" = NULL` is never true — anonymous viewers therefore
 * only ever match the `isPublicProfile = true` branch.
 */
export async function getActivityForUser(
  targetUserId: string,
  viewerUserId: string | undefined,
  options: { cursor?: FeedCursor; limit?: number } = {}
): Promise<ActivityFeedResult> {
  const effectiveLimit = clampLimit(options.limit ?? FEED_DEFAULT_LIMIT);
  const cursorCondition = buildCursorCondition(options.cursor);
  const viewerBinding = viewerUserId ?? null;

  const rows = await prisma.$queryRaw<Array<Record<string, unknown>>>`
    SELECT ${SELECT_COLUMNS}
    FROM "LibraryItem" li
    JOIN "user" u ON u."id" = li."userId"
    JOIN "Game" g ON g."id" = li."gameId"
    WHERE li."userId" = ${targetUserId}
      AND (u."isPublicProfile" = true OR li."userId" = ${viewerBinding})
      ${cursorCondition}
    ${ORDER_BY}
    LIMIT ${effectiveLimit}`;

  const items = mapRawRows(rows);
  return {
    items,
    nextCursor: buildNextCursor(items, effectiveLimit),
  };
}

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

const SELECT_COLUMNS = Prisma.sql`
  li."id",
  li."status",
  GREATEST(li."createdAt", COALESCE(li."statusChangedAt", li."createdAt")) AS "activityTimestamp",
  li."userId",
  li."gameId",
  u."name"       AS "userName",
  u."username"   AS "userUsername",
  u."image"      AS "userImage",
  g."title"      AS "gameTitle",
  g."coverImage" AS "gameCoverImage",
  g."slug"       AS "gameSlug"`;

const ORDER_BY = Prisma.sql`
  ORDER BY GREATEST(li."createdAt", COALESCE(li."statusChangedAt", li."createdAt")) DESC,
           li."id" DESC`;

function clampLimit(limit: number): number {
  return Math.min(Math.max(1, limit), FEED_MAX_LIMIT);
}

function buildCursorCondition(cursor?: FeedCursor): Prisma.Sql {
  if (!cursor) return Prisma.empty;

  return Prisma.sql`
    AND (
      GREATEST(li."createdAt", COALESCE(li."statusChangedAt", li."createdAt")) < ${cursor.timestamp}::timestamp
      OR (
        GREATEST(li."createdAt", COALESCE(li."statusChangedAt", li."createdAt")) = ${cursor.timestamp}::timestamp
        AND li."id" < ${cursor.id}
      )
    )`;
}

function buildNextCursor(
  items: FeedItem[],
  effectiveLimit: number
): FeedCursor | null {
  if (items.length < effectiveLimit) return null;

  const lastItem = items[items.length - 1]!;
  return {
    timestamp: lastItem.activityTimestamp.toISOString(),
    id: lastItem.id,
  };
}

function mapRawRows(rows: Array<Record<string, unknown>>): FeedItem[] {
  return rows.map((row) => ({
    id: row.id as number,
    status: row.status as string,
    activityTimestamp: row.activityTimestamp as Date,
    userId: row.userId as string,
    gameId: row.gameId as string,
    userName: (row.userName as string | null) ?? null,
    userUsername: (row.userUsername as string | null) ?? null,
    userImage: (row.userImage as string | null) ?? null,
    gameTitle: row.gameTitle as string,
    gameCoverImage: (row.gameCoverImage as string | null) ?? null,
    gameSlug: row.gameSlug as string,
  }));
}

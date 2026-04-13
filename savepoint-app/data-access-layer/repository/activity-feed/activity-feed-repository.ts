import "server-only";

import { Prisma } from "@prisma/client";

import { prisma } from "@/shared/lib/app/db";

import type { FeedCursor, FeedItemRow, PaginatedFeedResult } from "./types";

const MAX_FEED_LIMIT = 50;
const DEFAULT_FEED_LIMIT = 20;

function clampLimit(limit: number): number {
  return Math.min(Math.max(1, limit), MAX_FEED_LIMIT);
}

function buildCursorCondition(cursor?: FeedCursor): Prisma.Sql {
  if (!cursor) return Prisma.empty;

  return Prisma.sql`
    AND (
      GREATEST(li."createdAt", COALESCE(li."statusChangedAt", li."createdAt")) < ${cursor.timestamp}
      OR (
        GREATEST(li."createdAt", COALESCE(li."statusChangedAt", li."createdAt")) = ${cursor.timestamp}
        AND li."id" < ${cursor.id}
      )
    )`;
}

function buildNextCursor(
  items: FeedItemRow[],
  effectiveLimit: number
): FeedCursor | null {
  if (items.length < effectiveLimit) return null;

  const lastItem = items[items.length - 1];
  return {
    timestamp: lastItem.activityTimestamp,
    id: lastItem.id,
  };
}

function mapRawRows(rows: Array<Record<string, unknown>>): FeedItemRow[] {
  return rows.map((row) => ({
    id: row.id as number,
    status: row.status as string,
    createdAt: row.createdAt as Date,
    statusChangedAt: (row.statusChangedAt as Date) ?? null,
    activityTimestamp: row.activityTimestamp as Date,
    userId: row.userId as string,
    gameId: row.gameId as string,
    userName: (row.userName as string) ?? null,
    userUsername: (row.userUsername as string) ?? null,
    userImage: (row.userImage as string) ?? null,
    gameTitle: row.gameTitle as string,
    gameCoverImage: (row.gameCoverImage as string) ?? null,
    gameSlug: row.gameSlug as string,
  }));
}

const SELECT_COLUMNS = Prisma.sql`
  li."id",
  li."status",
  li."createdAt",
  li."statusChangedAt",
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

// Raw SQL is required here because Prisma cannot express:
// 1. GREATEST(createdAt, statusChangedAt) as a computed sort key in orderBy
// 2. Composite keyset cursor pagination with (timestamp, id) inequality conditions
export async function findFeedForUser(
  userId: string,
  cursor?: FeedCursor,
  limit: number = DEFAULT_FEED_LIMIT
): Promise<PaginatedFeedResult> {
  const effectiveLimit = clampLimit(limit);
  const cursorCondition = buildCursorCondition(cursor);

  const rows = await prisma.$queryRaw<Array<Record<string, unknown>>>`
    SELECT ${SELECT_COLUMNS}
    FROM "LibraryItem" li
    JOIN "Follow" f ON f."followingId" = li."userId"
    JOIN "User" u ON u."id" = li."userId"
    JOIN "Game" g ON g."id" = li."gameId"
    WHERE f."followerId" = ${userId}
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

export async function findActivityByUserId(
  userId: string,
  cursor?: FeedCursor,
  limit: number = DEFAULT_FEED_LIMIT
): Promise<PaginatedFeedResult> {
  const effectiveLimit = clampLimit(limit);
  const cursorCondition = buildCursorCondition(cursor);

  const rows = await prisma.$queryRaw<Array<Record<string, unknown>>>`
    SELECT ${SELECT_COLUMNS}
    FROM "LibraryItem" li
    JOIN "User" u ON u."id" = li."userId"
    JOIN "Game" g ON g."id" = li."gameId"
    WHERE li."userId" = ${userId}
      ${cursorCondition}
    ${ORDER_BY}
    LIMIT ${effectiveLimit}`;

  const items = mapRawRows(rows);

  return {
    items,
    nextCursor: buildNextCursor(items, effectiveLimit),
  };
}

export async function findPopularFeed(
  excludeUserId?: string,
  cursor?: FeedCursor,
  limit: number = DEFAULT_FEED_LIMIT
): Promise<PaginatedFeedResult> {
  const effectiveLimit = clampLimit(limit);
  const cursorCondition = buildCursorCondition(cursor);
  const excludeCondition = excludeUserId
    ? Prisma.sql`AND li."userId" != ${excludeUserId}`
    : Prisma.empty;

  const rows = await prisma.$queryRaw<Array<Record<string, unknown>>>`
    SELECT ${SELECT_COLUMNS}
    FROM "LibraryItem" li
    JOIN "User" u ON u."id" = li."userId"
    JOIN "Game" g ON g."id" = li."gameId"
    WHERE u."isPublicProfile" = true
      ${excludeCondition}
      ${cursorCondition}
    ${ORDER_BY}
    LIMIT ${effectiveLimit}`;

  const items = mapRawRows(rows);

  return {
    items,
    nextCursor: buildNextCursor(items, effectiveLimit),
  };
}

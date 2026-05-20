import { prisma } from "@/shared/lib/db.server";

import type { Prisma } from "../../../../shared/lib/prisma/client.ts";
import type {
  FindImportedGamesOptions,
  PaginatedImportedGames,
} from "../model/types";

const DEFAULT_LIMIT = 25;
const MAX_LIMIT = 100;

/**
 * Read-side entity query.
 *
 * Returns the imported games owned by `userId`. By default, rows whose
 * `igdbMatchStatus` is `IGNORED` are excluded — they are user-dismissed and
 * should not appear in the imported-games surface. Pass `includeIgnored: true`
 * to opt back in (e.g., for a "show dismissed" toggle).
 *
 * Soft-deleted rows (`deletedAt != null`) are always excluded. Soft delete
 * is canonical's gentler form of "remove" — different from dismissal, which
 * leaves the row visible-but-hidden in the user's IGDB-match flow.
 *
 * Filter/sort/search support (Phase D follow-up, mirrors canonical
 * `findImportedGamesByUserId`):
 *   - `search`         → case-insensitive `name` contains
 *   - `playtimeStatus` → "played" / "never_played" / "all"
 *   - `playtimeRange`  → bucketed minute-bounds against `playtime`
 *   - `platform`       → per-OS playtime > 0
 *   - `lastPlayed`     → date windows against `lastPlayedAt`
 *   - `sortBy`         → name / playtime / lastPlayed / createdAt axes
 *
 * `playtimeRange` takes precedence over `playtimeStatus` when both are set
 * (canonical parity — the range narrows the status implicitly).
 */
export async function findImportedGamesForUser(
  userId: string,
  options: FindImportedGamesOptions = {}
): Promise<PaginatedImportedGames> {
  const {
    includeIgnored = false,
    includeMatched = false,
    page = 1,
    limit = DEFAULT_LIMIT,
    search,
    playtimeStatus = "all",
    playtimeRange = "all",
    platform = "all",
    lastPlayed = "all",
    sortBy = "added_desc",
  } = options;

  // Default surface = "still to import": PENDING + UNMATCHED.
  // Toggles expand the set (canonical parity — `showAlreadyImported` flag).
  const allowedStatuses: Array<
    "PENDING" | "UNMATCHED" | "MATCHED" | "IGNORED"
  > = ["PENDING", "UNMATCHED"];
  if (includeMatched) allowedStatuses.push("MATCHED");
  if (includeIgnored) allowedStatuses.push("IGNORED");

  const where: Prisma.ImportedGameWhereInput = {
    userId,
    deletedAt: null,
    igdbMatchStatus: { in: allowedStatuses },
  };

  if (search && search.trim().length > 0) {
    where.name = { contains: search.trim(), mode: "insensitive" };
  }

  if (playtimeRange !== "all") {
    switch (playtimeRange) {
      case "under_1h":
        where.playtime = { lt: 60 };
        break;
      case "1_to_10h":
        where.playtime = { gte: 60, lt: 600 };
        break;
      case "10_to_50h":
        where.playtime = { gte: 600, lt: 3000 };
        break;
      case "over_50h":
        where.playtime = { gte: 3000 };
        break;
    }
  } else if (playtimeStatus === "played") {
    where.playtime = { gt: 0 };
  } else if (playtimeStatus === "never_played") {
    where.playtime = { equals: 0 };
  }

  if (platform !== "all") {
    switch (platform) {
      case "windows":
        where.playtimeWindows = { gt: 0 };
        break;
      case "mac":
        where.playtimeMac = { gt: 0 };
        break;
      case "linux":
        where.playtimeLinux = { gt: 0 };
        break;
    }
  }

  if (lastPlayed !== "all") {
    const now = Date.now();
    switch (lastPlayed) {
      case "30_days":
        where.lastPlayedAt = {
          gte: new Date(now - 30 * 24 * 60 * 60 * 1000),
        };
        break;
      case "1_year":
        where.lastPlayedAt = {
          gte: new Date(now - 365 * 24 * 60 * 60 * 1000),
        };
        break;
      case "over_1_year":
        where.lastPlayedAt = {
          lt: new Date(now - 365 * 24 * 60 * 60 * 1000),
        };
        break;
      case "never":
        where.lastPlayedAt = null;
        break;
    }
  }

  let orderBy: Prisma.ImportedGameOrderByWithRelationInput;
  switch (sortBy) {
    case "name_asc":
      orderBy = { name: "asc" };
      break;
    case "name_desc":
      orderBy = { name: "desc" };
      break;
    case "playtime_desc":
      orderBy = { playtime: "desc" };
      break;
    case "playtime_asc":
      orderBy = { playtime: "asc" };
      break;
    case "last_played_desc":
      orderBy = { lastPlayedAt: { sort: "desc", nulls: "last" } };
      break;
    case "last_played_asc":
      orderBy = { lastPlayedAt: { sort: "asc", nulls: "last" } };
      break;
    case "added_desc":
    default:
      orderBy = { createdAt: "desc" };
      break;
  }

  const safePage = Math.max(1, Math.floor(page));
  const safeLimit = Math.min(MAX_LIMIT, Math.max(1, Math.floor(limit)));
  const skip = (safePage - 1) * safeLimit;

  const [games, total] = await Promise.all([
    prisma.importedGame.findMany({
      where,
      orderBy,
      skip,
      take: safeLimit,
    }),
    prisma.importedGame.count({ where }),
  ]);

  return {
    games,
    total,
    page: safePage,
    limit: safeLimit,
    totalPages: Math.max(1, Math.ceil(total / safeLimit)),
  };
}

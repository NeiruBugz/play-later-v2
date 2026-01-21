import "server-only";

import {
  repositoryError,
  RepositoryErrorCode,
  repositorySuccess,
  type RepositoryResult,
} from "@/data-access-layer/repository/types";
import { Prisma } from "@prisma/client";

import { createLogger, LOGGER_CONTEXT } from "@/shared/lib";
import { prisma } from "@/shared/lib/app/db";

import type {
  CreateImportedGameInput,
  ImportedGameQueryOptions,
  PaginatedImportedGames,
} from "./types";

const logger = createLogger({
  [LOGGER_CONTEXT.REPOSITORY]: "imported-game-repository",
});

export async function upsertManyImportedGames(
  userId: string,
  games: CreateImportedGameInput[]
): Promise<RepositoryResult<number>> {
  try {
    const result = await prisma.$transaction(async (tx) => {
      let upsertedCount = 0;

      for (const game of games) {
        const existingGame = await tx.importedGame.findFirst({
          where: {
            userId,
            storefront: game.storefront,
            storefrontGameId: game.storefrontGameId,
            deletedAt: null,
          },
        });

        if (existingGame) {
          await tx.importedGame.update({
            where: { id: existingGame.id },
            data: {
              name: game.name,
              playtime: game.playtime ?? 0,
              playtimeWindows: game.playtimeWindows ?? 0,
              playtimeMac: game.playtimeMac ?? 0,
              playtimeLinux: game.playtimeLinux ?? 0,
              lastPlayedAt: game.lastPlayedAt,
              img_icon_url: game.img_icon_url,
              img_logo_url: game.img_logo_url,
              updatedAt: new Date(),
            },
          });
        } else {
          await tx.importedGame.create({
            data: {
              userId,
              name: game.name,
              storefront: game.storefront,
              storefrontGameId: game.storefrontGameId,
              playtime: game.playtime ?? 0,
              playtimeWindows: game.playtimeWindows ?? 0,
              playtimeMac: game.playtimeMac ?? 0,
              playtimeLinux: game.playtimeLinux ?? 0,
              lastPlayedAt: game.lastPlayedAt,
              img_icon_url: game.img_icon_url,
              img_logo_url: game.img_logo_url,
              igdbMatchStatus: game.igdbMatchStatus ?? "PENDING",
            },
          });
        }
        upsertedCount++;
      }

      return upsertedCount;
    });

    return repositorySuccess(result);
  } catch (error) {
    return repositoryError(
      RepositoryErrorCode.DATABASE_ERROR,
      `Failed to upsert imported games: ${error instanceof Error ? error.message : "Unknown error"}`
    );
  }
}

export async function findImportedGamesByUserId(
  userId: string,
  options: ImportedGameQueryOptions = {}
): Promise<RepositoryResult<PaginatedImportedGames>> {
  try {
    const {
      search,
      page = 1,
      limit = 25,
      playtimeStatus = "all",
      playtimeRange = "all",
      platform = "all",
      lastPlayed = "all",
      sortBy = "added_desc",
    } = options;

    const validatedLimit = Math.min(Math.max(1, limit), 100);
    const validatedPage = Math.max(1, page);
    const skip = (validatedPage - 1) * validatedLimit;

    const whereClause: Prisma.ImportedGameWhereInput = {
      userId,
      deletedAt: null,
    };

    if (search) {
      whereClause.name = {
        contains: search,
        mode: "insensitive",
      };
    }

    if (playtimeRange !== "all") {
      if (playtimeStatus !== "all") {
        logger.warn(
          { playtimeStatus, playtimeRange },
          "Both playtimeStatus and playtimeRange filters provided - using playtimeRange"
        );
      }
      switch (playtimeRange) {
        case "under_1h":
          whereClause.playtime = { lt: 60 };
          break;
        case "1_to_10h":
          whereClause.playtime = { gte: 60, lt: 600 };
          break;
        case "10_to_50h":
          whereClause.playtime = { gte: 600, lt: 3000 };
          break;
        case "over_50h":
          whereClause.playtime = { gte: 3000 };
          break;
      }
    } else if (playtimeStatus === "played") {
      whereClause.playtime = { gt: 0 };
    } else if (playtimeStatus === "never_played") {
      whereClause.playtime = { equals: 0 };
    }

    if (platform !== "all") {
      switch (platform) {
        case "windows":
          whereClause.playtimeWindows = { gt: 0 };
          break;
        case "mac":
          whereClause.playtimeMac = { gt: 0 };
          break;
        case "linux":
          whereClause.playtimeLinux = { gt: 0 };
          break;
      }
    }

    if (lastPlayed !== "all") {
      const now = new Date();
      switch (lastPlayed) {
        case "30_days":
          whereClause.lastPlayedAt = {
            gte: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000),
          };
          break;
        case "1_year":
          whereClause.lastPlayedAt = {
            gte: new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000),
          };
          break;
        case "over_1_year":
          whereClause.lastPlayedAt = {
            lt: new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000),
          };
          break;
        case "never":
          whereClause.lastPlayedAt = null;
          break;
      }
    }

    let orderByClause: Prisma.ImportedGameOrderByWithRelationInput;
    switch (sortBy) {
      case "name_asc":
        orderByClause = { name: "asc" };
        break;
      case "name_desc":
        orderByClause = { name: "desc" };
        break;
      case "playtime_desc":
        orderByClause = { playtime: "desc" };
        break;
      case "playtime_asc":
        orderByClause = { playtime: "asc" };
        break;
      case "last_played_desc":
        orderByClause = { lastPlayedAt: { sort: "desc", nulls: "last" } };
        break;
      case "last_played_asc":
        orderByClause = { lastPlayedAt: { sort: "asc", nulls: "last" } };
        break;
      case "added_desc":
      default:
        orderByClause = { createdAt: "desc" };
        break;
    }

    const [items, total] = await Promise.all([
      prisma.importedGame.findMany({
        where: whereClause,
        orderBy: orderByClause,
        skip,
        take: validatedLimit,
      }),
      prisma.importedGame.count({ where: whereClause }),
    ]);

    return repositorySuccess({
      items,
      total,
      page: validatedPage,
      limit: validatedLimit,
      totalPages: Math.ceil(total / validatedLimit),
    });
  } catch (error) {
    return repositoryError(
      RepositoryErrorCode.DATABASE_ERROR,
      `Failed to find imported games: ${error instanceof Error ? error.message : "Unknown error"}`
    );
  }
}

export async function countImportedGamesByUserId(
  userId: string
): Promise<RepositoryResult<number>> {
  try {
    const count = await prisma.importedGame.count({
      where: { userId, deletedAt: null },
    });
    return repositorySuccess(count);
  } catch (error) {
    return repositoryError(
      RepositoryErrorCode.DATABASE_ERROR,
      `Failed to count imported games: ${error instanceof Error ? error.message : "Unknown error"}`
    );
  }
}

export async function softDeleteImportedGame(
  id: string
): Promise<RepositoryResult<void>> {
  try {
    await prisma.importedGame.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
    return repositorySuccess(undefined);
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2025"
    ) {
      return repositoryError(
        RepositoryErrorCode.NOT_FOUND,
        "Imported game not found"
      );
    }
    return repositoryError(
      RepositoryErrorCode.DATABASE_ERROR,
      `Failed to soft delete imported game: ${error instanceof Error ? error.message : "Unknown error"}`
    );
  }
}

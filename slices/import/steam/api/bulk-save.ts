"use server";

import { getServerUserId } from "@/auth";
import { findBestMatch } from "@/slices/import/steam/api/find-best-match";
import { prisma } from "@/src/shared/api";
import igdbApi from "@/src/shared/api/igdb";
import { SteamAppInfo } from "@/src/shared/types";
import { AcquisitionType, BacklogItemStatus } from "@prisma/client";

type IgdbGameResponseItem = {
  id: number;
  cover: {
    id: number;
    url: string;
    name: string;
    version_title: string;
  };
};

function normalizeTitle(title: string): string {
  return title
    .toLowerCase()
    .replace(/™|®|:|-|,|\.|\s+/g, " ") // Remove common special characters
    .trim();
}

async function fetchFromIgdb(gameName: string) {
  const normalisedGameName = normalizeTitle(gameName);
  const games = await igdbApi.getGameByName(normalisedGameName);

  if (!games?.length) return null;

  const normalizedNames = games.map((game) =>
    normalizeTitle(`${game.name} ${game.version_title || ""}`)
  );

  const bestMatch = findBestMatch(normalisedGameName, normalizedNames);

  if (!bestMatch) return null;

  return games[bestMatch.refIndex];
}

async function bulkSaveGames(
  steamGames: Array<SteamAppInfo & { status: BacklogItemStatus }>
) {
  const userId = await getServerUserId();

  if (!userId) return null;

  const normalizedSteamGames = steamGames.map((game) =>
    normalizeTitle(game.name)
  );

  const existingGames = await prisma.game.findMany({
    where: {
      title: { in: normalizedSteamGames },
    },
    select: { id: true, title: true },
  });

  const gamesToFetch = normalizedSteamGames.filter(
    (game) =>
      !existingGames.some((existing) => normalizeTitle(existing.title) === game)
  );

  const fetchedGames = await Promise.all(
    gamesToFetch.map(async (game) => {
      const igdbData = await fetchFromIgdb(game);
      if (igdbData) {
        return prisma.game.create({
          data: {
            title: igdbData.name,
            coverImage: igdbData.cover.image_id,
            igdbId: igdbData.id,
          },
        });
      }

      return null;
    })
  );

  const backlogItems = normalizedSteamGames
    .map((game) => {
      const existingGame =
        existingGames.find((g) => normalizeTitle(g.title) === game) ||
        fetchedGames.find((g) => normalizeTitle(g?.title || "") === game);

      if (existingGame) {
        return {
          userId: userId as string,
          gameId: existingGame.id,
          id: 1,
          status: BacklogItemStatus.TO_PLAY,
          createdAt: new Date(),
          updatedAt: new Date(),
          platform: "PC",
          acquisitionType: AcquisitionType.DIGITAL,
        };
      }

      return null;
    })
    .filter(Boolean) as any;

  await prisma.backlogItem.createMany({
    data: backlogItems,
  });

  return { success: true, importedCount: backlogItems.length };
}

export { bulkSaveGames };

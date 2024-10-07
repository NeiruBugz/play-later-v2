"use server";

import { getServerUserId } from "@/auth";
import { AddGameToBacklogInput } from "@/src/entities/game";
import { saveGameAndAddToBacklog } from "@/src/features/add-game/api/add-game";
import igdbApi from "@/src/shared/api/igdb";
import { SteamAppInfo } from "@/src/shared/types";
import { AcquisitionType, BacklogItemStatus } from "@prisma/client";

function removeSpecialChars(input: string): string {
  const specialCharsRegex =
    /[\u2122\u00A9\u00AE\u0024\u20AC\u00A3\u00A5\u2022\u2026]/g;

  return input.replace(specialCharsRegex, "");
}

export async function addGameToCollection(game: SteamAppInfo) {
  try {
    const userId = await getServerUserId();

    const returnValue = {
      igdb: "",
      htlb: "",
    };

    if (!userId) {
      throw new Error("No user found");
    }

    const { name, appid } = game;

    const sanitizedName = removeSpecialChars(name).toLowerCase();

    const gameDataFromIGDB = await igdbApi.search({
      name: sanitizedName,
    });

    if (!gameDataFromIGDB?.length) {
      throw new Error("Games not found");
    }

    const correctGame = gameDataFromIGDB
      .sort((a, b) => a.name.length - b.name.length)
      .find((gameData) => gameData.name.toLowerCase() === sanitizedName);

    if (!correctGame) {
      throw new Error("Game not found");
    }

    returnValue.igdb = "fetch success";

    const payload = {
      game: {
        igdbId: correctGame.id,
        hltbId: null,
        title: correctGame.name,
        description: correctGame.summary,
        coverImage: correctGame.cover.image_id,
        releaseDate: correctGame.first_release_date
          ? new Date(correctGame.first_release_date * 1000)
          : null,
        mainStory: null,
        mainExtra: null,
        completionist: null,
        steamAppId: appid,
      },
      backlogItem: {
        platform: "pc",
        backlogStatus: (game.playtime_forever === 0
          ? "TO_PLAY"
          : "PLAYED") as unknown as BacklogItemStatus,
        acquisitionType: "DIGITAL" as unknown as AcquisitionType,
      },
    } satisfies AddGameToBacklogInput;

    await saveGameAndAddToBacklog(payload);

    return returnValue;
  } catch (error) {
    console.error(error);
  }
}

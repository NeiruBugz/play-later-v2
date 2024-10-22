"use server";

import { getServerUserId } from "@/auth";
import { AddGameToBacklogInput } from "@/src/entities/game";
import { saveGameAndAddToBacklog } from "@/src/features/add-game/api/add-game";
import igdbApi from "@/src/shared/api/igdb";
import { SteamAppInfo } from "@/src/shared/types";
import { AcquisitionType, BacklogItemStatus } from "@prisma/client";
import Fuse from "fuse.js";

const fuseOptions = {
  keys: ["name", "platforms.name"],
  threshold: 0.3,
};

function removeSpecialChars(input: string): string {
  const specialCharsRegex = /[^\w\s]/g;
  return input.replace(specialCharsRegex, "").trim().toLowerCase();
}

export async function addGameToCollection(game: SteamAppInfo) {
  try {
    const userId = await getServerUserId();

    if (!userId) {
      throw new Error("No user found");
    }

    const { name, appid } = game;
    const sanitizedName = removeSpecialChars(name);

    const gameDataFromIGDB = await igdbApi.search({
      name: sanitizedName,
    });

    if (!gameDataFromIGDB?.length) {
      throw new Error(`No games found in IGDB for ${sanitizedName}`);
    }


    const fuse = new Fuse(gameDataFromIGDB, fuseOptions);
    const result = fuse.search(sanitizedName);

    if (!result.length) {
      throw new Error(`No matching game found for ${sanitizedName}`);
    }

    const correctGame = result.find(({ item }) =>
      item.platforms.some((platform) =>
        ["pc", "pc (microsoft windows)"].includes(platform.name.toLowerCase())
      )
    )?.item;

    if (!correctGame) {
      throw new Error(`No correct game found for PC platform`);
    }

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
          : "PLAYED") as BacklogItemStatus,
        acquisitionType: "DIGITAL" as AcquisitionType,
      },
    } satisfies AddGameToBacklogInput;

    await saveGameAndAddToBacklog(payload);

    return {
      igdb: "fetch success",
      htlb: "",
    };
  } catch (error) {
    console.error(
      `Error adding game to collection: ${(error as Error).message}`
    );
    // Возвращаем ошибку, которую можно обработать в UI
    return { error: (error as Error).message };
  }
}

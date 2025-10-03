"use server";

import { type AcquisitionType, type LibraryItemStatus } from "@prisma/client";
import { revalidatePath } from "next/cache";

import { authorizedActionClient } from "@/shared/lib/safe-action-client";

import { CreateGameActionSchema } from "../lib/validation";
import { type AddGameToLibraryInput } from "../types";
import { saveGameAndAddToLibrary } from "./add-game";

export const createGameAction = authorizedActionClient
  .metadata({
    actionName: "createGame",
    requiresAuth: true,
  })
  .inputSchema(CreateGameActionSchema)
  .action(async ({ parsedInput: data }) => {
    const preparedPayload: AddGameToLibraryInput = {
      game: {
        igdbId: data.igdbId,
      },
      libraryItem: {
        acquisitionType: data.acquisitionType as AcquisitionType,
        libraryItemStatus: data.libraryItemStatus as LibraryItemStatus,
        platform: data.platform,
      },
    };

    const { data: savedGame } = await saveGameAndAddToLibrary(preparedPayload);

    revalidatePath("/collection");

    return {
      gameTitle: savedGame?.title,
      gameId: savedGame?.id,
    };
  });

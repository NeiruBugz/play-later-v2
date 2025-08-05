"use server";

import { type AcquisitionType, type BacklogItemStatus } from "@prisma/client";
import { revalidatePath } from "next/cache";

import { authorizedActionClient } from "@/shared/lib/safe-action-client";

import { CreateGameActionSchema } from "../lib/validation";
import { type AddGameToBacklogInput } from "../types";
import { saveGameAndAddToBacklog } from "./add-game";

export const createGameAction = authorizedActionClient
  .metadata({
    actionName: "createGame",
    requiresAuth: true,
  })
  .inputSchema(CreateGameActionSchema)
  .action(async ({ parsedInput: data }) => {
    const preparedPayload: AddGameToBacklogInput = {
      game: {
        igdbId: data.igdbId,
      },
      backlogItem: {
        acquisitionType: data.acquisitionType as AcquisitionType,
        backlogStatus: data.backlogStatus as BacklogItemStatus,
        platform: data.platform,
      },
    };

    const { data: savedGame } = await saveGameAndAddToBacklog(preparedPayload);

    revalidatePath("/collection");

    return {
      gameTitle: savedGame?.title,
      gameId: savedGame?.id,
    };
  });

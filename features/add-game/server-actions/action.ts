"use server";

import { authorizedActionClient } from "@/shared/lib/safe-action-client";
import type { AcquisitionType, BacklogItemStatus } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { CreateGameActionSchema } from "../lib/validation";
import type { AddGameToBacklogInput } from "../types";
import { saveGameAndAddToBacklog } from "./add-game";

export const createGameAction = authorizedActionClient
  .metadata({
    actionName: "createGame",
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

    const savedGame = await saveGameAndAddToBacklog(preparedPayload);

    revalidatePath("/collection");

    return {
      gameTitle: savedGame.title,
      gameId: savedGame.id,
    };
  });

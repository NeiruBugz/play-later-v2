"use server";

import type { AcquisitionType, BacklogItemStatus } from "@prisma/client";
import { format, fromUnixTime } from "date-fns";
import { revalidatePath } from "next/cache";
import { validateCreateGameAction } from "../lib/validation";
import type { AddGameToBacklogInput } from "../types";
import { saveGameAndAddToBacklog } from "./add-game";

export async function createGameAction(
  prevState: { message: string },
  payload: FormData
) {
  const parsedPayload = validateCreateGameAction(payload);

  if (!parsedPayload.success) {
    return { message: "Failed to save game", isError: true };
  }

  const releaseDate = parsedPayload.data.releaseDate
    ? fromUnixTime(parsedPayload.data.releaseDate)
    : null;
  const preparedPayload = {
    game: {
      igdbId: parsedPayload.data.igdbId,
      title: parsedPayload.data.title,
      description: parsedPayload.data.description ?? "",
      releaseDate,
      coverImage: parsedPayload.data.coverImage,
      hltbId: parsedPayload.data.hltbId,
      mainStory: parsedPayload.data.mainStory,
      mainExtra: parsedPayload.data.mainExtra,
      completionist: parsedPayload.data.completionist,
      steamAppId: null,
    },
    backlogItem: {
      acquisitionType: parsedPayload.data
        .acquisitionType as unknown as AcquisitionType,
      backlogStatus: parsedPayload.data
        .backlogStatus as unknown as BacklogItemStatus,
      platform: parsedPayload.data.platform,
    },
  } satisfies AddGameToBacklogInput;

  try {
    await saveGameAndAddToBacklog(preparedPayload);
    revalidatePath("/collection");
    return {
      message: `"${parsedPayload.data.title} saved to your collection"`,
      isError: false,
    };
  } catch (error) {
    return { message: "Failed to save game", isError: true };
  }
}

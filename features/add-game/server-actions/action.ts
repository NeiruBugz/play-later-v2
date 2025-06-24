"use server";

import type { AcquisitionType, BacklogItemStatus } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import type { CreateGameActionInput } from "../lib/validation";
import { CreateGameActionSchema } from "../lib/validation";
import type { AddGameToBacklogInput } from "../types";
import { saveGameAndAddToBacklog } from "./add-game";

export type CreateGameActionResult = {
  success: boolean;
  message: string;
  data?: { gameTitle: string };
};

export async function createGameAction(
  input: CreateGameActionInput
): Promise<CreateGameActionResult> {
  try {
    const parsedPayload = CreateGameActionSchema.safeParse(input);

    if (!parsedPayload.success) {
      return {
        success: false,
        message: "Invalid input data. Please check your form and try again.",
      };
    }

    const { data } = parsedPayload;

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
      success: true,
      message: `"${savedGame.title}" has been added to your collection!`,
      data: { gameTitle: savedGame.title },
    };
  } catch (error) {
    console.error("Failed to create game:", error);

    if (error instanceof Error) {
      if (error.message.includes("not authenticated")) {
        return {
          success: false,
          message: "You must be signed in to add games to your collection.",
        };
      }

      if (error.message.includes("not found")) {
        return {
          success: false,
          message: "Game not found. Please try selecting a different game.",
        };
      }
    }

    return {
      success: false,
      message: "Something went wrong. Please try again later.",
    };
  }
}

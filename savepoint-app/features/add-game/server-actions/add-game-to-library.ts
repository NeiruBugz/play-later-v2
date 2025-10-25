"use server";

import { getServerUserId } from "@/auth";
import { LibraryService } from "@/data-access-layer/services/library/library-service";
import { revalidatePath } from "next/cache";

import { logger } from "@/shared/lib/app/logger";

import { AddGameToLibrarySchema } from "../lib/validation";

type AddGameToLibraryServerInput = {
  igdbId: number;
  status: string;
  platform: string;
  acquisitionType: string;
};

export type AddGameToLibraryResult =
  | { success: true; gameId: string }
  | { success: false; error: string };

export async function addGameToLibraryAction(
  input: AddGameToLibraryServerInput
): Promise<AddGameToLibraryResult> {
  try {
    const userId = await getServerUserId();
    if (!userId) {
      return { success: false, error: "Unauthorized" };
    }

    const validationResult = AddGameToLibrarySchema.safeParse(input);
    if (!validationResult.success) {
      logger.error(
        { err: validationResult.error },
        "addGameToLibraryAction validation failed"
      );
      return { success: false, error: "Invalid input" };
    }

    const libraryService = new LibraryService();
    try {
      const result = await libraryService.addGameToLibrary({
        userId,
        ...validationResult.data,
      });

      if (!result.success) {
        logger.error(
          { error: result.error },
          "Library service failed to add game to library"
        );
        return {
          success: false,
          error: "Unable to add game to library",
        };
      }

      revalidatePath("/library");
      return { success: true, gameId: result.data.game.id };
    } catch (serviceError) {
      logger.error(
        {
          err: serviceError instanceof Error ? serviceError : undefined,
          serviceError,
        },
        "addGameToLibraryAction service error"
      );
      return {
        success: false,
        error: "Unable to add game to library",
      };
    }
  } catch (error) {
    logger.error(
      { err: error instanceof Error ? error : undefined, error },
      "addGameToLibraryAction unexpected error"
    );
    return { success: false, error: "Unable to add game to library" };
  }
}

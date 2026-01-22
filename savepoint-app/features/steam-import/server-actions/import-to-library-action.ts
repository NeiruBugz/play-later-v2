"use server";

import { revalidatePath } from "next/cache";

import { createServerAction, type ActionResult } from "@/shared/lib";

import { ImportToLibrarySchema, type ImportToLibraryInput } from "../schemas";
import { importGameToLibrary } from "../use-cases/import-game-to-library";

type ImportToLibraryOutput = {
  gameSlug: string;
};

export const importToLibraryAction = createServerAction<
  ImportToLibraryInput,
  ImportToLibraryOutput
>({
  actionName: "importToLibraryAction",
  schema: ImportToLibrarySchema,
  requireAuth: true,
  handler: async ({
    input,
    userId,
    logger,
  }): Promise<ActionResult<ImportToLibraryOutput>> => {
    logger.info(
      { importedGameId: input.importedGameId, userId },
      "Importing game to library"
    );

    const result = await importGameToLibrary({
      importedGameId: input.importedGameId,
      userId: userId!,
      status: input.status ?? "owned",
      manualIgdbId: input.manualIgdbId,
    });

    if (!result.success) {
      logger.warn({ error: result.error }, "Import to library failed");
      return {
        success: false,
        error: result.error,
      };
    }

    revalidatePath("/library");
    revalidatePath("/steam/games");

    logger.info(
      { gameSlug: result.data.gameSlug },
      "Game imported to library successfully"
    );

    return {
      success: true,
      data: { gameSlug: result.data.gameSlug },
    };
  },
});

"use server";

import { ImportedGameService } from "@/data-access-layer/services";
import { revalidatePath } from "next/cache";
import { z } from "zod";

import { createServerAction, type ActionResult } from "@/shared/lib";

const DismissImportedGameSchema = z.object({
  importedGameId: z.string().cuid(),
});

export const dismissImportedGameAction = createServerAction<
  z.infer<typeof DismissImportedGameSchema>,
  void
>({
  actionName: "dismissImportedGameAction",
  schema: DismissImportedGameSchema,
  requireAuth: true,
  handler: async ({ input, userId, logger }): Promise<ActionResult<void>> => {
    logger.info(
      { importedGameId: input.importedGameId, userId },
      "Dismissing imported game"
    );

    const importedGameService = new ImportedGameService();
    const result = await importedGameService.dismissImportedGame({
      importedGameId: input.importedGameId,
      userId: userId!,
    });

    if (!result.success) {
      logger.error(
        { importedGameId: input.importedGameId, error: result.error },
        "Failed to dismiss imported game"
      );
      return {
        success: false,
        error: result.error,
      };
    }

    revalidatePath("/steam/games");

    logger.info(
      { importedGameId: input.importedGameId },
      "Imported game dismissed successfully"
    );

    return {
      success: true,
      data: undefined,
    };
  },
});

"use server";

import { getServerUserId } from "@/auth";
import { LibraryService } from "@/data-access-layer/services";
import { revalidatePath } from "next/cache";
import { z } from "zod";

import { createLogger, LOGGER_CONTEXT } from "@/shared/lib";

const logger = createLogger({
  [LOGGER_CONTEXT.SERVER_ACTION]: "deleteLibraryItemAction",
});

const DeleteLibraryItemSchema = z.object({
  libraryItemId: z.number().int().positive(),
});
export type DeleteLibraryItemInput = z.infer<typeof DeleteLibraryItemSchema>;
type ActionResult = { success: true } | { success: false; error: string };

export async function deleteLibraryItemAction(
  input: DeleteLibraryItemInput
): Promise<ActionResult> {
  try {
    logger.info(
      { libraryItemId: input.libraryItemId },
      "Attempting to delete library item"
    );
    const parsed = DeleteLibraryItemSchema.safeParse(input);
    if (!parsed.success) {
      logger.warn({ errors: parsed.error.issues }, "Invalid input data");
      return {
        success: false,
        error: "Invalid input data",
      };
    }
    const { libraryItemId } = parsed.data;
    const userId = await getServerUserId();
    if (!userId) {
      logger.warn("Unauthenticated user attempted to delete library item");
      return {
        success: false,
        error: "You must be logged in to delete library items",
      };
    }
    const libraryService = new LibraryService();
    const result = await libraryService.deleteLibraryItem({
      libraryItemId,
      userId,
    });
    if (!result.success) {
      logger.error(
        { error: result.error, userId, libraryItemId },
        "LibraryService failed to delete library item"
      );
      return {
        success: false,
        error: result.error,
      };
    }
    revalidatePath("/library");
    revalidatePath("/games/[slug]", "page");
    logger.info(
      {
        userId,
        libraryItemId,
      },
      "Library item deleted successfully"
    );
    return {
      success: true,
    };
  } catch (error) {
    logger.error(
      { error, libraryItemId: input.libraryItemId },
      "Unexpected error in deleteLibraryItemAction"
    );
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "An unexpected error occurred",
    };
  }
}

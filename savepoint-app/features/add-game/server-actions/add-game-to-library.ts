"use server";

import { getServerUserId } from "@/auth";
import { LibraryService } from "@/data-access-layer/services/library/library-service";
import { revalidatePath } from "next/cache";

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

    const validatedData = AddGameToLibrarySchema.parse(input);

    const libraryService = new LibraryService();
    const result = await libraryService.addGameToLibrary({
      userId,
      ...validatedData,
    });

    if (!result.success) {
      return { success: false, error: result.error };
    }

    revalidatePath("/library");
    return { success: true, gameId: result.data.game.id };
  } catch (error) {
    if (error instanceof Error) {
      return { success: false, error: error.message };
    }
    return { success: false, error: "An unexpected error occurred" };
  }
}

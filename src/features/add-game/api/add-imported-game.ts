"use server";

import { AddGameToBacklogInput } from "@/src/entities/game";
import { saveGameAndAddToBacklog } from "@/src/features/add-game/api/add-game";
import { revalidatePath } from "next/cache";

export async function addImportedGame(payload: AddGameToBacklogInput) {
  try {
    await saveGameAndAddToBacklog(payload);
    revalidatePath("/collection");
  } catch (error) {
    console.log(error);
  }
}

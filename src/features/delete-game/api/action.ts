"use server";

import { revalidatePath } from "next/cache";
import { deleteBacklogItem } from "slices/backlog/api";
import { z } from "zod";

const DeleteGameSchema = z.object({
  gameId: z.number(),
});

export async function deleteGameAction(
  prevState: { message: string },
  payload: FormData
) {
  const parsedPayload = DeleteGameSchema.safeParse({
    gameId: Number(payload.get("gameId")),
  });

  if (!parsedPayload.success) {
    return { message: "Error occurred while deleting game" };
  }

  try {
    await deleteBacklogItem(parsedPayload.data.gameId);
    revalidatePath("/");
    return { message: "Game was deleted successfully" };
  } catch (err) {
    return { message: "Error occurred while deleting game" };
  }
}

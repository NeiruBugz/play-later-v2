"use server";

import { deleteBacklogItem } from "@/src/entities/backlog-item";

export async function deleteBacklogItemAction(
  prevState: { message: string },
  id: number,
  payload: FormData
) {
  try {
    await deleteBacklogItem(id);
    return {
      message: "Backlog item deleted successfully",
    };
  } catch (error) {
    return {
      message: "Failed to delete backlog item",
    };
  }
}

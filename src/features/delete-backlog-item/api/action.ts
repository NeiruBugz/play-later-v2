"use server";

import { deleteBacklogItem } from "@/src/entities/backlog-item";

export async function deleteBacklogItemAction(
  prevState: { message: string },
  id: number,
  payload: FormData
) {
  try {
    await deleteBacklogItem(id);
  } catch (error) {}
}

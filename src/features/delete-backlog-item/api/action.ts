"use server";

import { deleteBacklogItem } from "slices/backlog/api";

export async function deleteBacklogItemAction(
  prevState: { message: string },
  id: number,
  payload: FormData
) {
  try {
    await deleteBacklogItem(id);
  } catch (error) {}
}

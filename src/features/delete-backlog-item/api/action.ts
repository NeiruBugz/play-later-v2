"use server";

import { deleteBacklogItem } from "@/features/backlog/actions";

export async function deleteBacklogItemAction(
  prevState: { message: string },
  id: number,
  payload: FormData
) {
  try {
    await deleteBacklogItem(id);
  } catch (error) {}
}

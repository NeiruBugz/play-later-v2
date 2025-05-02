"use server";

import { BacklogItemService } from "@/domain/backlog-item/service";

export async function deleteBacklogItemAction(
  prevState: { message: string },
  id: number,
  payload: FormData
) {
  try {
    await BacklogItemService.delete(id);
  } catch (error) {}
}

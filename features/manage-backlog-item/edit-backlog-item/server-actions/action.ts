"use server";

import { BacklogItemService } from "@/domain/backlog-item/service";
import { validateEditBacklogItem } from "../lib/validation";

export async function editBacklogItemAction(
  prevState: { message: string },
  payload: FormData
) {
  const parsedPayload = validateEditBacklogItem(payload);

  if (!parsedPayload.success) {
    return {
      message: "Invalid payload",
    };
  }

  try {
    await BacklogItemService.update(parsedPayload.data);
    return {
      message: "Success",
      data: parsedPayload.data,
    };
  } catch (error) {
    return {
      message: "Failed to update backlog item",
    };
  }
}

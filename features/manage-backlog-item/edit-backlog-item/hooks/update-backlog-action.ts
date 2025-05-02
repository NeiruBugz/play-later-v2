"use server";

import { BacklogItemService } from "@/domain/backlog-item/service";
import { BacklogItemStatus } from "@prisma/client";

export async function updateBacklogItemAction({
  id,
  status,
}: {
  id: number;
  status: BacklogItemStatus;
}) {
  try {
    await BacklogItemService.updateStatus({
      id,
      status: status as unknown as BacklogItemStatus,
    });
  } catch (error) {
    console.error(error);
  }
}

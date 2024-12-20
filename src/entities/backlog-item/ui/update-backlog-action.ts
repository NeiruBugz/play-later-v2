"use server";

import { updateBacklogItemStatus } from "@/src/entities/backlog-item/model/update-backlog-item";
import { BacklogItemStatus } from "@prisma/client";

export async function updateBacklogItemAction({
  id,
  status,
}: {
  id: number;
  status: BacklogItemStatus;
}) {
  try {
    await updateBacklogItemStatus({
      id,
      status: status as unknown as BacklogItemStatus,
    });
  } catch (error) {
    console.error(error);
  }
}

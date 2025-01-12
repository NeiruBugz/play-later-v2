"use server";

import { updateBacklogItemStatus } from "@/features/backlog/actions/update/update-backlog-item";
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

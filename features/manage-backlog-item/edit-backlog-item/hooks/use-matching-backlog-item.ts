"use client";

import { type BacklogItem } from "@prisma/client";
import { useSearchParams } from "next/navigation";

export function useMatchingBacklogItem({
  backlogItems,
  status,
}: {
  backlogItems?: Array<Omit<BacklogItem, "game">>;
  status?: string;
}) {
  const params = useSearchParams();
  const statusFilter = params.get("status") ?? status;
  const matchingStatusItem = backlogItems?.find(
    (item) => (item.status as unknown as string) === statusFilter
  );

  return matchingStatusItem;
}

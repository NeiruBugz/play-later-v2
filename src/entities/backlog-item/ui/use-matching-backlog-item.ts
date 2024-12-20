"use client";

import { BacklogItem } from "@prisma/client";
import { useSearchParams } from "next/navigation";

export function useMatchingBacklogItem({
  backlogItems,
}: {
  backlogItems?: Omit<BacklogItem, "game">[];
}) {
  const params = useSearchParams();
  const statusFilter = params.get("status");
  const matchingStatusItem = backlogItems?.find(
    (item) => (item.status as unknown as string) === statusFilter
  );

  return matchingStatusItem;
}

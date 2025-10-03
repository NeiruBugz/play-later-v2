"use client";

import { type LibraryItem } from "@prisma/client";
import { useSearchParams } from "next/navigation";

export function useMatchingLibraryItem({
  libraryItems,
  status,
}: {
  libraryItems?: Array<Omit<LibraryItem, "game">>;
  status?: string;
}) {
  const params = useSearchParams();
  const statusFilter = params.get("status") ?? status;
  const matchingStatusItem = libraryItems?.find(
    (item) => (item.status as unknown as string) === statusFilter
  );

  return matchingStatusItem;
}

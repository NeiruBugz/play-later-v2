"use client";

import { normalizeString } from "@/src/shared/lib";
import { BacklogItem } from "@prisma/client";
import { useSearchParams } from "next/navigation";

type GamePlatformProps = {
  backlogItems?: Omit<BacklogItem, "game">[];
};

export function GamePlatform({ backlogItems }: GamePlatformProps) {
  const params = useSearchParams();
  const statusFilter = params.get("status");
  const matchingStatusItem = backlogItems?.find(
    (item) => (item.status as unknown as string) === statusFilter
  );

  if (!matchingStatusItem) {
    return null;
  }

  return (
    <p className="text-xs text-white/80">
      {normalizeString(matchingStatusItem?.platform)}
    </p>
  );
}

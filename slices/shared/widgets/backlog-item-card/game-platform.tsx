"use client";

import { useMatchingBacklogItem } from "@/slices/shared/widgets/backlog-item-card/use-matching-backlog-item";
import { normalizeString } from "@/src/shared/lib";
import { BacklogItem } from "@prisma/client";

type GamePlatformProps = {
  backlogItems?: Omit<BacklogItem, "game">[];
};

export function GamePlatform({ backlogItems }: GamePlatformProps) {
  const matchingStatusItem = useMatchingBacklogItem({ backlogItems });
  if (!matchingStatusItem) {
    return null;
  }

  return (
    <p className="text-xs text-white/80">
      {normalizeString(matchingStatusItem?.platform)}
    </p>
  );
}

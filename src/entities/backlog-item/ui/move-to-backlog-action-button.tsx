"use client";

import { updateBacklogItemAction } from "@/src/entities/backlog-item/ui/update-backlog-action";
import { useMatchingBacklogItem } from "@/src/entities/backlog-item/ui/use-matching-backlog-item";
import { Button } from "@/src/shared/ui";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/src/shared/ui/tooltip";
import { BacklogItem } from "@prisma/client";
import { RotateCcw } from "lucide-react";
import { useCallback, type MouseEvent } from "react";

type MoveToBacklogActionButtonProps = {
  game: {
    id: string;
    title: string;
    coverImage: string | null;
  };
  backlogItems?: Omit<BacklogItem, "game">[];
};

export function MoveToBacklogActionButton({
  backlogItems,
}: MoveToBacklogActionButtonProps) {
  const matchingStatusItem = useMatchingBacklogItem({ backlogItems });

  const onClick = useCallback(
    async (event: MouseEvent<HTMLButtonElement>) => {
      event.stopPropagation();
      event.preventDefault();
      if (!matchingStatusItem) {
        return;
      }
      try {
        await updateBacklogItemAction({
          id: matchingStatusItem.id,
          status: "TO_PLAY",
        });
      } catch (e) {}
    },
    [matchingStatusItem]
  );

  if (matchingStatusItem?.status === "TO_PLAY") {
    return null;
  }

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          variant="secondary"
          size="icon"
          className="h-7 w-7"
          onClick={onClick}
        >
          <RotateCcw className="h-3 w-3" />
        </Button>
      </TooltipTrigger>
      <TooltipContent>
        <p>Move to Backlog</p>
      </TooltipContent>
    </Tooltip>
  );
}

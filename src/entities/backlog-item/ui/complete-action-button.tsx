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
import { Check } from "lucide-react";
import { useCallback, type MouseEvent } from "react";

type CompleteActionButtonProps = {
  game: {
    id: string;
    title: string;
    coverImage: string | null;
  };
  backlogItems?: Omit<BacklogItem, "game">[];
};

export function CompleteActionButton({
  game,
  backlogItems,
}: CompleteActionButtonProps) {
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
          status: "COMPLETED",
        });
      } catch (e) {}
    },
    [matchingStatusItem]
  );

  if (matchingStatusItem?.status === "COMPLETED") {
    return null;
  }
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          variant="secondary"
          size="icon"
          className="h-7 w-7"
          onClick={() => console.log(game.id, "completed")}
        >
          <Check className="h-3 w-3" />
        </Button>
      </TooltipTrigger>
      <TooltipContent>
        <p>Mark as Completed</p>
      </TooltipContent>
    </Tooltip>
  );
}

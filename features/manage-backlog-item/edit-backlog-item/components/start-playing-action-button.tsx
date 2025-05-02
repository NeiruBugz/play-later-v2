"use client";

import { Button } from "@/shared/components";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/shared/components/tooltip";
import { BacklogItem } from "@prisma/client";
import { Play } from "lucide-react";
import { MouseEvent, useCallback } from "react";
import { updateBacklogItemAction } from "../hooks/update-backlog-action";
import { useMatchingBacklogItem } from "../hooks/use-matching-backlog-item";

type StartPlayingActionButtonProps = {
  game: {
    id: string;
    title: string;
    coverImage: string | null;
  };
  backlogItems?: Omit<BacklogItem, "game">[];
};
export function StartPlayingActionButton({
  game,
  backlogItems,
}: StartPlayingActionButtonProps) {
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
          status: "PLAYING",
        });
      } catch (e) {}
    },
    [matchingStatusItem]
  );

  if (matchingStatusItem?.status === "PLAYING") {
    return;
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
          <Play className="h-3 w-3" />
        </Button>
      </TooltipTrigger>
      <TooltipContent>
        <p>Start Playing</p>
      </TooltipContent>
    </Tooltip>
  );
}

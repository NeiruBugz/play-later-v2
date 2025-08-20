"use client";

import { type BacklogItem } from "@prisma/client";
import { Play } from "lucide-react";
import { useCallback, type MouseEvent } from "react";

import { Button } from "@/shared/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/shared/components/ui/tooltip";

import { updateBacklogItemAction } from "../hooks/update-backlog-action";
import { useMatchingBacklogItem } from "../hooks/use-matching-backlog-item";

type StartPlayingActionButtonProps = {
  game: {
    id: string;
    title: string;
    coverImage: string | null;
  };
  backlogItems?: Array<Omit<BacklogItem, "game">>;
};
export function StartPlayingActionButton({
  backlogItems,
}: StartPlayingActionButtonProps) {
  const latestStatus = backlogItems?.sort(
    (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
  )?.[0]?.status;
  const matchingStatusItem = useMatchingBacklogItem({
    backlogItems,
    status: latestStatus,
  });

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
      } catch (e) {
        console.error("Failed to start playing:", e);
      }
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
          className="size-7"
          onClick={onClick}
        >
          <Play className="size-3" />
        </Button>
      </TooltipTrigger>
      <TooltipContent>
        <p>Start Playing</p>
      </TooltipContent>
    </Tooltip>
  );
}

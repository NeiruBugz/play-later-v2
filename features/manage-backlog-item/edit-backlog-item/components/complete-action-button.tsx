"use client";

import { BacklogItem } from "@prisma/client";
import { Check } from "lucide-react";
import { useCallback, type MouseEvent } from "react";

import { Button } from "@/shared/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/shared/components/ui/tooltip";

import { updateBacklogItemAction } from "../hooks/update-backlog-action";
import { useMatchingBacklogItem } from "../hooks/use-matching-backlog-item";

type CompleteActionButtonProps = {
  backlogItems?: Omit<BacklogItem, "game">[];
};

export function CompleteActionButton({
  backlogItems,
}: CompleteActionButtonProps) {
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
          status: "COMPLETED",
        });
      } catch (e) {
        console.error(e);
      }
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
          onClick={onClick}
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

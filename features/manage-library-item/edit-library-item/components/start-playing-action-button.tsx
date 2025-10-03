"use client";

import { type LibraryItem } from "@prisma/client";
import { Play } from "lucide-react";
import { useCallback, type MouseEvent } from "react";

import { Button } from "@/shared/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/shared/components/ui/tooltip";

import { updateLibraryItemAction } from "../hooks/update-library-action";
import { useMatchingLibraryItem } from "../hooks/use-matching-library-item";

type StartPlayingActionButtonProps = {
  game: {
    id: string;
    title: string;
    coverImage: string | null;
  };
  libraryItems?: Array<Omit<LibraryItem, "game">>;
};
export function StartPlayingActionButton({
  libraryItems,
}: StartPlayingActionButtonProps) {
  const latestStatus = libraryItems?.sort(
    (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
  )?.[0]?.status;
  const matchingStatusItem = useMatchingLibraryItem({
    libraryItems,
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
        await updateLibraryItemAction({
          id: matchingStatusItem.id,
          status: "CURRENTLY_EXPLORING",
        });
      } catch (e) {
        console.error("Failed to start exploring:", e);
      }
    },
    [matchingStatusItem]
  );

  if (matchingStatusItem?.status === "CURRENTLY_EXPLORING") {
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

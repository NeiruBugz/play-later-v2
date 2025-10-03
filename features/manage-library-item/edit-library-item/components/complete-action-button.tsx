"use client";

import { type LibraryItem } from "@prisma/client";
import { Check } from "lucide-react";
import { useCallback, type MouseEvent } from "react";

import { Button } from "@/shared/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/shared/components/ui/tooltip";

import { updateLibraryItemAction } from "../hooks/update-library-action";
import { useMatchingLibraryItem } from "../hooks/use-matching-library-item";

type CompleteActionButtonProps = {
  libraryItems?: Array<Omit<LibraryItem, "game">>;
};

export function CompleteActionButton({
  libraryItems,
}: CompleteActionButtonProps) {
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
          status: "EXPERIENCED",
        });
      } catch (e) {
        console.error(e);
      }
    },
    [matchingStatusItem]
  );

  if (matchingStatusItem?.status === "EXPERIENCED") {
    return null;
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
          <Check className="size-3" />
        </Button>
      </TooltipTrigger>
      <TooltipContent>
        <p>Mark as Experienced</p>
      </TooltipContent>
    </Tooltip>
  );
}

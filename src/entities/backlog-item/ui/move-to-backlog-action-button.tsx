"use client";

import { Button } from "@/src/shared/ui";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/src/shared/ui/tooltip";
import { RotateCcw } from "lucide-react";

type MoveToBacklogActionButtonProps = {
  game: {
    id: string;
    title: string;
    coverImage: string | null;
  };
};

export function MoveToBacklogActionButton({
  game,
}: MoveToBacklogActionButtonProps) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          variant="secondary"
          size="icon"
          className="h-7 w-7"
          onClick={() => console.log(game.id, "backlog")}
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

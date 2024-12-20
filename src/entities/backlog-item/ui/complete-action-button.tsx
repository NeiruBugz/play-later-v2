"use client";

import { Button } from "@/src/shared/ui";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/src/shared/ui/tooltip";
import { Check } from "lucide-react";

type CompleteActionButtonProps = {
  game: {
    id: string;
    title: string;
    coverImage: string | null;
  };
};

export function CompleteActionButton({ game }: CompleteActionButtonProps) {
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

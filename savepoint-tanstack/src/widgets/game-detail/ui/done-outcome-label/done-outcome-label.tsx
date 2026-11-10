import { useRouter } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { getDoneLabel } from "@/entities/library-item/model/status";
import { setDoneOutcomeFn } from "@/features/done-follow-up";
import { getUserFacingErrorMessage } from "@/shared/lib/user-facing-error";
import { Button } from "@/shared/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/shared/ui/dropdown-menu";

import type { DoneOutcome } from "../../../../../shared/lib/prisma/client.ts";
import type { DoneOutcomeLabelProps } from "./done-outcome-label.type";

const CHOICES: ReadonlyArray<{ label: string; outcome: DoneOutcome | null }> = [
  { label: "Finished", outcome: "FINISHED" },
  { label: "Let go", outcome: "LET_GO" },
  { label: "Clear", outcome: null },
];

export function DoneOutcomeLabel({
  libraryItemId,
  doneOutcome,
}: DoneOutcomeLabelProps) {
  const router = useRouter();
  const [displayed, setDisplayed] = useState(doneOutcome);

  useEffect(() => {
    setDisplayed(doneOutcome);
  }, [doneOutcome]);

  const choose = async (outcome: DoneOutcome | null) => {
    const previous = displayed;
    setDisplayed(outcome);
    try {
      await setDoneOutcomeFn({ data: { id: libraryItemId, outcome } });
    } catch (error) {
      setDisplayed(previous);
      toast.error(getUserFacingErrorMessage(error));
      return;
    }
    await router.invalidate();
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button
            type="button"
            variant="ghost"
            size="sm"
            aria-label={`${getDoneLabel(displayed)}, change how it ended`}
          />
        }
      >
        {getDoneLabel(displayed)}
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start">
        {CHOICES.map((choice) => (
          <DropdownMenuItem
            key={choice.label}
            onClick={() => void choose(choice.outcome)}
          >
            {choice.label}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

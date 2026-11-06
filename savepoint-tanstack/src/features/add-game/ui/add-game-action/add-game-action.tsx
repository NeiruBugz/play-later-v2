import { Loader2, Plus } from "lucide-react";

import { InLibraryIndicator } from "@/entities/library-item";
import { Button } from "@/shared/ui/button";

import { useAddGame } from "../../model/use-add-game";
import type { AddGameActionProps } from "./add-game-action.type";

export function AddGameAction({ game, variant = "icon" }: AddGameActionProps) {
  const { library, isAdding, add } = useAddGame(game);

  if (library !== null) {
    return (
      <InLibraryIndicator
        status={library.status}
        upNextPosition={library.upNextPosition}
      />
    );
  }

  const icon = isAdding ? (
    <Loader2 aria-hidden="true" className="animate-spin" />
  ) : (
    <Plus aria-hidden="true" />
  );

  if (variant === "labelled") {
    return (
      <Button
        type="button"
        size="sm"
        disabled={isAdding}
        aria-busy={isAdding}
        onClick={() => void add()}
      >
        {icon}
        Add to library
      </Button>
    );
  }

  return (
    <Button
      type="button"
      variant="outline"
      size="icon"
      disabled={isAdding}
      aria-busy={isAdding}
      aria-label={`Add ${game.name}`}
      className="rounded-full md:size-8"
      onClick={() => void add()}
    >
      {icon}
    </Button>
  );
}

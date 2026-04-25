"use client";

import { Plus } from "lucide-react";

import { GameCoverImage } from "@/shared/components/game-cover-image";
import { CommandItem } from "@/shared/components/ui/command";

import type { GameSearchItem } from "./command-palette.types";

interface GameResultItemProps {
  game: GameSearchItem;
  onSelect: () => void;
  showAddHint?: boolean;
}

export function GameResultItem({
  game,
  onSelect,
  showAddHint = false,
}: GameResultItemProps) {
  return (
    <CommandItem
      value={`${game.name}-${game.id}`}
      onSelect={onSelect}
      className="gap-md py-sm flex items-center"
    >
      <GameCoverImage
        imageId={game.coverImageId}
        gameTitle={game.name}
        size="cover_small"
        className="h-12 w-9 flex-shrink-0 rounded"
        showPlaceholder={true}
        enableHoverEffect={false}
        sizes="36px"
      />

      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium">{game.name}</p>
        {game.releaseYear && (
          <p className="text-muted-foreground text-xs">{game.releaseYear}</p>
        )}
      </div>

      {showAddHint && (
        <span
          data-testid="quick-add-hint"
          className="gap-xs text-muted-foreground border-border bg-muted/40 px-sm inline-flex shrink-0 items-center rounded-md border py-0.5 text-xs"
        >
          <Plus aria-hidden="true" className="h-3 w-3" />
          Add to Up Next
        </span>
      )}
    </CommandItem>
  );
}

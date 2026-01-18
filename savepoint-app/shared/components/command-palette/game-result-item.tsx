"use client";

import { Plus } from "lucide-react";

import { GameCoverImage } from "@/shared/components/game-cover-image";
import { Button } from "@/shared/components/ui/button";
import { CommandItem } from "@/shared/components/ui/command";

import type { GameSearchItem } from "./command-palette.types";

interface GameResultItemProps {
  game: GameSearchItem;
  onSelect: () => void;
  onAddToLibrary?: (game: GameSearchItem) => void;
}

export function GameResultItem({
  game,
  onSelect,
  onAddToLibrary,
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

      {onAddToLibrary && (
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 shrink-0"
          onClick={(e) => {
            e.stopPropagation();
            onAddToLibrary(game);
          }}
          aria-label={`Add ${game.name} to library`}
        >
          <Plus className="h-4 w-4" />
        </Button>
      )}
    </CommandItem>
  );
}

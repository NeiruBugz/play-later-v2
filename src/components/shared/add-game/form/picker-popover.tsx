import React, { useRef } from "react";
import { GamePicker } from "@/src/components/shared/add-game/game-picker";
import type { SearchResponse } from "@/src/shared/types/igdb";
import { Button } from "@/src/shared/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/src/shared/ui/popover";

export const PickerPopover = ({
  onGameSelect,
  selectedGame,
}: {
  onGameSelect: (game: SearchResponse) => void;
  selectedGame: SearchResponse | undefined;
}) => {
  const triggerRef = useRef<HTMLButtonElement>(null);
  const [isPickerOpen, setPickerOpen] = React.useState(false);

  const onSelect = (game: SearchResponse) => {
    onGameSelect(game);
    setPickerOpen(false);
  };

  return (
    <Popover modal onOpenChange={setPickerOpen} open={isPickerOpen}>
      <PopoverTrigger asChild>
        <Button className="mb-4 w-full" ref={triggerRef} variant="outline">
          Find a game
        </Button>
      </PopoverTrigger>
      <PopoverContent className="z-[1000] w-full bg-popover shadow-md">
        <GamePicker
          onGameSelect={onSelect}
          selectedGame={selectedGame?.id}
          width={triggerRef.current?.getBoundingClientRect().width}
        />
      </PopoverContent>
    </Popover>
  );
};

import { GamePicker } from "@/src/components/shared/add-game/game-picker";
import { Button } from "@/src/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/src/components/ui/popover";
import { SearchResponse } from "@/src/packages/types/igdb";
import React, { useRef } from "react";

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

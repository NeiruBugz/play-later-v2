"use client";

import { Body, Heading } from "@/shared/components/typography";
import { type SearchResponse } from "@/shared/types";

import { GamePicker } from "./game-picker";

type GameSelectionSectionProps = {
  selectedGame: SearchResponse | undefined;
  onGameSelect: (game?: SearchResponse) => void;
  disabled: boolean;
};

export function GameSelectionSection({
  selectedGame,
  onGameSelect,
  disabled,
}: GameSelectionSectionProps) {
  const clearSelection = () => {
    onGameSelect(undefined);
  };
  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Heading level={2} size="lg">
          Add Game to Collection
        </Heading>
        <Body variant="muted">
          Search for a game and configure how you want to track it in your
          collection.
        </Body>
      </div>

      <GamePicker
        clearSelectionAction={clearSelection}
        onGameSelectAction={onGameSelect}
        selectedGame={selectedGame}
        disabled={disabled}
      />
    </div>
  );
}

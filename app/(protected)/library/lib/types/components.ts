import type { Game } from "@prisma/client";

export interface PickerControlsProps {
  hasChoice: boolean;
  isRunning: boolean;
  start: () => void;
  stop: () => void;
}

export interface PickerChoiceProps {
  afterClick: () => void;
  choice: Game;
  isRunning: boolean;
}

export interface PickerProps {
  closeDialog: () => void;
  items: Game[];
}

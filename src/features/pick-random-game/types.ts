import { Game } from "@prisma/client";

export type PickerItem = Pick<Game, "id" | "imageUrl" | "title">;

export type PickerControlsProps = {
  hasChoice: boolean;
  isRunning: boolean;
  start: () => void;
  stop: () => void;
};

export type PickerChoiceProps = {
  afterClick: () => void;
  choice: PickerItem;
  isRunning: boolean;
};

export type PickerProps = {
  closeDialog: () => void;
  items: PickerItem[];
};

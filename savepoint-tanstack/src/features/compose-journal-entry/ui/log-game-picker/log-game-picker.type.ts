import type { LoggableGame } from "@/entities/library-item/api/get-loggable-games.server";

export type LogGamePickerProps = {
  games: LoggableGame[];
  onSelect: (game: LoggableGame) => void;
};

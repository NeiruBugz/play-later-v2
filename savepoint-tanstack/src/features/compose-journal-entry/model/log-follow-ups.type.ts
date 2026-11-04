import type { LoggableGame } from "@/entities/library-item/api/get-loggable-games.server";

export type LogFollowUps = {
  markPlaying: (game: LoggableGame) => Promise<boolean>;
};

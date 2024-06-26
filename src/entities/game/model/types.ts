import { Game } from "@prisma/client";

export type AddGameToBacklogInput = {
  game: Omit<Game, "id" | "createdAt" | "updatedAt" | "userId">;
  backlogItem: {
    backlogStatus: string;
    acquisitionType: string;
    platform?: string;
  };
};

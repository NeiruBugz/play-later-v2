import { Game } from "@prisma/client";

type CreateGameInput = {
  game: Omit<Game, "id" | "createdAt" | "updatedAt" | "userId">;
};

export type { CreateGameInput };

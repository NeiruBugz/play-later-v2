import { Game, GameStatus } from "@prisma/client";
import { useMutation } from "@tanstack/react-query";

export function useChangeGameStatus() {
  return useMutation({
    mutationKey: ["change-game-status"],
    mutationFn: async (body: { status: GameStatus; gameId: Game["id"] }) => {
      return await fetch("/api/game", {
        method: "POST",
        body: JSON.stringify(body),
      });
    },
  });
}

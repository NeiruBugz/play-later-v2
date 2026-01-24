"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { dismissImportedGameAction } from "@/features/steam-import/server-actions/dismiss-imported-game-action";

type DismissGameParams = {
  importedGameId: string;
};

export function useDismissGame() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: DismissGameParams) => {
      const result = await dismissImportedGameAction({
        importedGameId: params.importedGameId,
      });

      if (!result.success) {
        throw new Error(result.error);
      }

      return result.data;
    },

    onSuccess: () => {
      toast.success("Game dismissed");
    },

    onError: (error) => {
      toast.error("Failed to dismiss game", {
        description:
          error instanceof Error ? error.message : "Please try again",
      });
    },

    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["imported-games"] });
    },
  });
}

"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import type { SteamImportResult } from "../types";

type UseFetchSteamGamesOptions = {
  onSuccess?: (data: SteamImportResult) => void;
  onError?: (error: Error) => void;
};

export function useFetchSteamGames(options?: UseFetchSteamGamesOptions) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (): Promise<SteamImportResult> => {
      const response = await fetch("/api/steam/games", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Failed to fetch Steam games");
      }

      if (!result.success) {
        throw new Error(result.error || "Failed to fetch Steam games");
      }

      return {
        imported: result.imported,
        total: result.total,
        filtered: result.filtered,
      };
    },

    onSuccess: (data) => {
      toast.success("Steam library imported", {
        description: `Imported ${data.imported} games (${data.filtered} filtered out)`,
      });

      options?.onSuccess?.(data);
    },

    onError: (error) => {
      toast.error("Failed to import Steam library", {
        description:
          error instanceof Error ? error.message : "Please try again",
      });

      options?.onError?.(error as Error);
    },

    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["imported-games"] });
    },
  });
}

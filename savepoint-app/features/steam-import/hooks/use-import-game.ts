"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { importToLibraryAction } from "../server-actions/import-to-library-action";
import type { LibraryStatus } from "../types";

type ImportGameParams = {
  importedGameId: string;
  status?: LibraryStatus;
  manualIgdbId?: number;
};

type ErrorHandler = {
  match: (message: string) => boolean;
  handle: () => void;
};

const ERROR_HANDLERS: ErrorHandler[] = [
  {
    match: (msg) => msg.includes("No IGDB match found"),
    handle: () =>
      toast.error("Could not match game automatically", {
        description: "Please select the correct game from search results",
      }),
  },
  {
    match: (msg) => msg.includes("already in library"),
    handle: () => toast.info("Game already in library"),
  },
  {
    match: (msg) =>
      msg.includes("rate limit") ||
      msg.includes("Please try again in a moment"),
    handle: () =>
      toast.error("Too many requests", {
        description: "Please try again in a moment",
      }),
  },
  {
    match: (msg) => msg.includes("Network error occurred"),
    handle: () =>
      toast.error("Network error", {
        description: "Failed to connect. Please try again.",
      }),
  },
];

function handleImportError(error: unknown): void {
  const errorMessage = error instanceof Error ? error.message : "Unknown error";
  const handler = ERROR_HANDLERS.find((h) => h.match(errorMessage));

  if (handler) {
    handler.handle();
  } else {
    toast.error("Failed to import game", {
      description: errorMessage || "Please try again",
    });
  }
}

export function useImportGame() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: ImportGameParams) => {
      const result = await importToLibraryAction({
        importedGameId: params.importedGameId,
        status: params.status,
        manualIgdbId: params.manualIgdbId,
      });

      if (!result.success) {
        throw new Error(result.error);
      }

      return result.data;
    },

    onSuccess: () => {
      toast.success("Game added to library");
    },

    onError: handleImportError,

    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["imported-games"] });
      queryClient.invalidateQueries({ queryKey: ["library"] });
    },
  });
}

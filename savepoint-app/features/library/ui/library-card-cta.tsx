"use client";

import { useQueryClient } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { useState, useTransition } from "react";

import { JournalQuickEntrySheet } from "@/features/journal";
import { Button } from "@/shared/components/ui/button";

import { getPrimaryCtaPayload } from "../lib/library-card-cta-payload";
import { updateLibraryStatusAction } from "../server-actions/update-library-status";
import type { LibraryItemWithGameDomain } from "../types";

interface LibraryCardCtaProps {
  libraryItem: LibraryItemWithGameDomain;
}

export function LibraryCardCta({ libraryItem }: LibraryCardCtaProps) {
  const [isPending, startTransition] = useTransition();
  const [logSessionOpen, setLogSessionOpen] = useState(false);
  const queryClient = useQueryClient();

  const { label, action } = getPrimaryCtaPayload(
    libraryItem.status,
    libraryItem.hasBeenPlayed
  );

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (action.kind === "logSession") {
      setLogSessionOpen(true);
      return;
    }

    startTransition(async () => {
      const startedAt =
        action.startedAtNullableSet && libraryItem.startedAt === null
          ? new Date()
          : undefined;

      await updateLibraryStatusAction({
        libraryItemId: libraryItem.id,
        status: action.status,
        startedAt,
      });
      await queryClient.invalidateQueries({ queryKey: ["library"] });
    });
  };

  const preselectedGame = {
    id: libraryItem.game.id,
    title: libraryItem.game.title,
    coverImage: libraryItem.game.coverImage,
  };

  return (
    <>
      <Button
        type="button"
        size="sm"
        className="mt-2 w-full text-xs font-semibold"
        disabled={isPending}
        onClick={handleClick}
        onMouseDown={(e) => {
          e.preventDefault();
          e.stopPropagation();
        }}
        data-library-interactive
        aria-label={label}
      >
        {isPending ? (
          <Loader2 className="h-3 w-3 animate-spin" aria-hidden />
        ) : (
          label
        )}
      </Button>

      {action.kind === "logSession" && (
        <JournalQuickEntrySheet
          key={libraryItem.game.id}
          isOpen={logSessionOpen}
          onClose={() => setLogSessionOpen(false)}
          preselectedGame={preselectedGame}
        />
      )}
    </>
  );
}

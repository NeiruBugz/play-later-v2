"use client";

import { useState } from "react";

import { Button } from "@/shared/components/ui/button";

import { LibraryModal } from "./library-modal";

type AddToLibraryButtonProps = {
  gameId?: string;
  igdbId: number;
  gameTitle: string;
};

export const AddToLibraryButton = ({
  gameId,
  igdbId,
  gameTitle,
}: AddToLibraryButtonProps) => {
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <>
      <Button
        variant="default"
        className="w-full"
        onClick={() => setIsModalOpen(true)}
        aria-label={`Add ${gameTitle} to your library`}
      >
        Add to Library
      </Button>

      <LibraryModal
        gameId={gameId}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        igdbId={igdbId}
        gameTitle={gameTitle}
        mode="add"
      />
    </>
  );
};

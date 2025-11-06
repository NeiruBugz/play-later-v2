"use client";

import { useState } from "react";

import { Button } from "@/shared/components/ui/button";

import { LibraryModal } from "./library-modal";

type AddToLibraryButtonProps = {
  igdbId: number;
  gameTitle: string;
};

export const AddToLibraryButton = ({
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
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        igdbId={igdbId}
        gameTitle={gameTitle}
        mode="add"
      />
    </>
  );
};

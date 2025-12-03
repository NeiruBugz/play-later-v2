"use client";

import dynamic from "next/dynamic";
import { useState } from "react";

import { Button } from "@/shared/components/ui/button";

import type { AddToLibraryButtonProps } from "./add-to-library-button.types";

const LibraryModal = dynamic(
  () =>
    import("@/features/manage-library-entry/ui").then(
      (mod) => mod.LibraryModal
    ),
  { ssr: false }
);

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
      {isModalOpen && (
        <LibraryModal
          gameId={gameId}
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          igdbId={igdbId}
          gameTitle={gameTitle}
          mode="add"
        />
      )}
    </>
  );
};

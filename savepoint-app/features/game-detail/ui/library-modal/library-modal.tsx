"use client";

import { useMediaQuery } from "@/shared/hooks/use-media-query";

import { DesktopLayout } from "./components/desktop-layout";
import { MobileLayout } from "./components/mobile-layout";
import { useLibraryModal } from "./hooks/use-library-modal";
import type { LibraryModalProps } from "./library-modal.types";

export const LibraryModal = ({
  isOpen,
  onClose,
  igdbId,
  gameTitle,
  mode,
  existingItems = [],
  onDeleteItem,
}: LibraryModalProps) => {
  const isMobile = useMediaQuery("(max-width: 767px)");

  const modalState = useLibraryModal({
    mode,
    existingItems,
    isOpen,
  });

  const sharedProps = {
    isOpen,
    onClose,
    igdbId,
    gameTitle,
    modalState,
    onDeleteItem,
  };

  if (isMobile) {
    return <MobileLayout {...sharedProps} />;
  }

  return <DesktopLayout {...sharedProps} />;
};

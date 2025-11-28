"use client";

import { useMediaQuery } from "@/shared/hooks/use-media-query";

import { useLibraryModal } from "../hooks/use-library-modal";
import { DesktopLayout } from "./desktop-layout";
import type { LibraryModalProps } from "./library-modal.types";
import { MobileLayout } from "./mobile-layout";

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

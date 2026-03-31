"use client";

import { useMediaQuery } from "@/shared/hooks/use-media-query";

import type { CommandPaletteProps } from "./command-palette.types";
import { DesktopCommandPalette } from "./desktop-command-palette";
import { MobileCommandPalette } from "./mobile-command-palette";

export function CommandPalette({ isOpen, onClose }: CommandPaletteProps) {
  const isMobile = useMediaQuery("(max-width: 767px)");

  if (isMobile) {
    return <MobileCommandPalette isOpen={isOpen} onClose={onClose} />;
  }

  return <DesktopCommandPalette isOpen={isOpen} onClose={onClose} />;
}

"use client";

import type { ReactNode } from "react";

import {
  CommandPalette,
  useCommandPaletteContext,
} from "@/features/command-palette";

interface GamesLayoutClientProps {
  children: ReactNode;
}

export function GamesLayoutClient({ children }: GamesLayoutClientProps) {
  const { isOpen, close } = useCommandPaletteContext();

  return (
    <>
      {children}
      <CommandPalette isOpen={isOpen} onClose={close} />
    </>
  );
}

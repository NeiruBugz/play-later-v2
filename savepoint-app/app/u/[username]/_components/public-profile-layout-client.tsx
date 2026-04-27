"use client";

import type { ReactNode } from "react";

import {
  CommandPalette,
  useCommandPaletteContext,
} from "@/features/command-palette";

interface PublicProfileLayoutClientProps {
  children: ReactNode;
}

export function PublicProfileLayoutClient({
  children,
}: PublicProfileLayoutClientProps) {
  const { isOpen, close } = useCommandPaletteContext();

  return (
    <>
      {children}
      <CommandPalette isOpen={isOpen} onClose={close} />
    </>
  );
}

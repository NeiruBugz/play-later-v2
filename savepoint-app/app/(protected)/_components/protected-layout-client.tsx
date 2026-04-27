"use client";

import type { ReactNode } from "react";

import {
  CommandPalette,
  useCommandPaletteContext,
} from "@/features/command-palette";

interface ProtectedLayoutClientProps {
  children: ReactNode;
}

export function ProtectedLayoutClient({
  children,
}: ProtectedLayoutClientProps) {
  const { isOpen, close } = useCommandPaletteContext();

  return (
    <>
      {children}
      <CommandPalette isOpen={isOpen} onClose={close} />
    </>
  );
}

"use client";

import { QuickAddButton as ManageLibraryQuickAddButton } from "@/features/manage-library-entry";

export interface QuickAddButtonProps {
  igdbId: number;
  gameName: string;
  alreadyInLibrary?: boolean;
  className?: string;
}

export function QuickAddButton(props: QuickAddButtonProps) {
  return <ManageLibraryQuickAddButton {...props} />;
}

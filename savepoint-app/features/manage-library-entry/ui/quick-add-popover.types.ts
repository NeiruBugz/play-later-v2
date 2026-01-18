import type { ReactNode } from "react";

export interface QuickAddPopoverProps {
  igdbId: number;
  gameTitle: string;
  trigger: ReactNode;
  onSuccess?: () => void;
}

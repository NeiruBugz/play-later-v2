import type { LibraryItemStatus } from "../../../../../shared/lib/prisma/client.ts";

export type NextStepButtonProps = {
  status: LibraryItemStatus;
  onStep: (target: LibraryItemStatus) => void;
  size?: "sm" | "default";
  disabled?: boolean;
  className?: string;
};

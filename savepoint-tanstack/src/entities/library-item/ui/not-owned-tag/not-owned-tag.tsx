import { cn } from "@/shared/lib/utils";

import type { NotOwnedTagProps } from "./not-owned-tag.type";

export function NotOwnedTag({ status, isOwned, className }: NotOwnedTagProps) {
  if (status !== "WANT" || isOwned) return null;

  return (
    <span
      data-testid="not-owned-tag"
      className={cn(
        "border-border text-muted-foreground inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium whitespace-nowrap",
        className
      )}
    >
      Not owned
    </span>
  );
}

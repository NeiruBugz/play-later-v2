import { ChevronDown, ChevronUp } from "lucide-react";
import type { ReactNode } from "react";

import { Button } from "@/shared/ui/button";

type UpNextQueueRowProps = {
  title: string;
  number: number;
  isFirst: boolean;
  isLast: boolean;
  disabled: boolean;
  onMoveUp: () => void;
  onMoveDown: () => void;
  dragHandle?: ReactNode;
  children: ReactNode;
};

export function UpNextQueueRow({
  title,
  number,
  isFirst,
  isLast,
  disabled,
  onMoveUp,
  onMoveDown,
  dragHandle,
  children,
}: UpNextQueueRowProps) {
  return (
    <>
      {dragHandle}
      <span
        aria-hidden="true"
        className="w-6 shrink-0 text-center text-lg font-semibold text-muted-foreground tabular-nums"
      >
        {number}
      </span>
      <div className="min-w-0 flex-1">{children}</div>
      <div className="flex shrink-0 flex-col gap-1">
        {isFirst ? null : (
          <Button
            type="button"
            variant="outline"
            size="icon"
            aria-label={`Move ${title} up`}
            disabled={disabled}
            onClick={onMoveUp}
          >
            <ChevronUp className="h-4 w-4" aria-hidden="true" />
          </Button>
        )}
        {isLast ? null : (
          <Button
            type="button"
            variant="outline"
            size="icon"
            aria-label={`Move ${title} down`}
            disabled={disabled}
            onClick={onMoveDown}
          >
            <ChevronDown className="h-4 w-4" aria-hidden="true" />
          </Button>
        )}
      </div>
    </>
  );
}

import { cn } from "@/shared/lib/utils";

import { Badge, type BadgeProps } from "./badge";

type StatusChipStatus = "want" | "playing" | "done" | "let-go";
type StatusChipVariant = "want" | "playing" | "done";

const CHIP: Record<
  StatusChipStatus,
  { label: string; variant: StatusChipVariant; className: string }
> = {
  want: {
    label: "Want",
    variant: "want",
    className: "bg-status-want text-status-want-foreground",
  },
  playing: {
    label: "Playing",
    variant: "playing",
    className: "bg-status-playing text-status-playing-foreground",
  },
  done: {
    label: "Done",
    variant: "done",
    className: "bg-status-done text-status-done-foreground",
  },
  "let-go": {
    label: "Let go",
    variant: "done",
    className: "bg-status-done text-status-done-foreground",
  },
};

type StatusChipProps = Omit<BadgeProps, "variant"> & {
  status: StatusChipStatus;
};

function StatusChip({
  status,
  className,
  children,
  ...props
}: StatusChipProps) {
  const chip = CHIP[status];
  return (
    <Badge
      {...props}
      data-status={status}
      data-variant={chip.variant}
      className={cn("shrink-0", chip.className, className)}
    >
      {chip.label}
      {children}
    </Badge>
  );
}

export { StatusChip };
export type { StatusChipProps, StatusChipStatus };

import { getStatusConfig, getUpNextLabel } from "@/shared/lib/library-status";
import { cn } from "@/shared/lib/ui/utils";
import { LibraryItemStatus } from "@/shared/types";

export interface LibraryStatusBadgeProps {
  status: LibraryItemStatus;
  hasBeenPlayed?: boolean;
  hidden?: boolean;
  className?: string;
}

export function LibraryStatusBadge({
  status,
  hasBeenPlayed = false,
  hidden = false,
  className,
}: LibraryStatusBadgeProps) {
  if (hidden) {
    return null;
  }

  const statusConfig = getStatusConfig(status);
  const label =
    status === LibraryItemStatus.UP_NEXT
      ? getUpNextLabel(hasBeenPlayed)
      : statusConfig.label;

  return (
    <span
      aria-label={`Status: ${label}`}
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] leading-none font-medium text-white",
        "bg-black/55 ring-1 ring-white/10 backdrop-blur-sm",
        className
      )}
    >
      <span
        aria-hidden
        data-testid="library-status-badge-dot"
        className="h-1.5 w-1.5 flex-shrink-0 rounded-full"
        style={{
          backgroundColor: `var(--status-${statusConfig.badgeVariant})`,
        }}
      />
      <span className="truncate">{label}</span>
    </span>
  );
}

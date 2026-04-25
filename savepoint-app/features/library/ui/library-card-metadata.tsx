import { Badge } from "@/shared/components/ui/badge";
import { formatRelativeDate } from "@/shared/lib/date";
import { cn } from "@/shared/lib/ui/utils";
import { LibraryItemStatus } from "@/shared/types";

function toDate(value: Date | string | null | undefined): Date | null {
  if (value === null || value === undefined) {
    return null;
  }
  if (value instanceof Date) {
    return value;
  }
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

export interface GetContextualDateInput {
  status: LibraryItemStatus;
  startedAt?: Date | string | null;
  createdAt: Date | string;
  updatedAt?: Date | string | null;
}

export function getContextualDate(
  input: GetContextualDateInput
): string | null {
  const { status, startedAt, createdAt, updatedAt } = input;
  const created = toDate(createdAt);
  const started = toDate(startedAt);
  const updated = toDate(updatedAt);

  if (
    status === LibraryItemStatus.PLAYING ||
    status === LibraryItemStatus.UP_NEXT
  ) {
    if (started) {
      return `Started ${formatRelativeDate(started)}`;
    }
    if (created) {
      return `Added ${formatRelativeDate(created)}`;
    }
    return null;
  }

  if (status === LibraryItemStatus.PLAYED) {
    if (updated) {
      return `Finished ${formatRelativeDate(updated)}`;
    }
    if (created) {
      return `Added ${formatRelativeDate(created)}`;
    }
    return null;
  }

  if (created) {
    return `Added ${formatRelativeDate(created)}`;
  }
  return null;
}

export interface LibraryCardMetadataProps {
  status: LibraryItemStatus;
  startedAt?: Date | string | null;
  createdAt: Date | string;
  updatedAt?: Date | string | null;
  platform?: string | null;
  className?: string;
}

export function LibraryCardMetadata(props: LibraryCardMetadataProps) {
  const { status, startedAt, createdAt, updatedAt, platform, className } =
    props;
  const contextualDate = getContextualDate({
    status,
    startedAt,
    createdAt,
    updatedAt,
  });
  const hasPlatform =
    typeof platform === "string" && platform.trim().length > 0;

  if (!hasPlatform && !contextualDate) {
    return <div className="h-4" aria-hidden />;
  }

  return (
    <div
      data-testid="library-card-metadata"
      className={cn(
        "text-muted-foreground mt-0.5 flex h-4 items-center truncate text-[11px] leading-none",
        className
      )}
    >
      {hasPlatform && (
        <Badge
          variant="secondary"
          className="h-4 px-1.5 py-0 text-[10px] leading-none font-medium"
        >
          {platform}
        </Badge>
      )}
      {hasPlatform && contextualDate && (
        <span aria-hidden className="mx-1.5">
          •
        </span>
      )}
      {contextualDate && <span className="truncate">{contextualDate}</span>}
    </div>
  );
}

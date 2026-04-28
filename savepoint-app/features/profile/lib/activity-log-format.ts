import type { ActivityLogItem } from "./activity-log-types";

const STATUS_LABELS: Record<string, string> = {
  WISHLIST: "Wishlist",
  SHELF: "Shelf",
  UP_NEXT: "Up Next",
  PLAYING: "Playing",
  PLAYED: "Played",
};

export function formatStatus(status: string): string {
  return STATUS_LABELS[status] ?? status;
}

export function getRelativeTime(date: Date): string {
  const diffSeconds = Math.floor((Date.now() - date.getTime()) / 1000);
  if (diffSeconds < 60) return "just now";

  const diffMinutes = Math.floor(diffSeconds / 60);
  if (diffMinutes < 60) return `${diffMinutes}m ago`;

  const diffHours = Math.floor(diffMinutes / 60);
  if (diffHours < 24) return `${diffHours}h ago`;

  const diffDays = Math.floor(diffHours / 24);
  if (diffDays < 30) return `${diffDays}d ago`;

  const diffMonths = Math.floor(diffDays / 30);
  if (diffDays < 365) return `${diffMonths}mo ago`;

  return `${Math.floor(diffDays / 365)}y ago`;
}

export function isStatusChange(item: ActivityLogItem): boolean {
  if (!item.statusChangedAt) return false;
  const activityTs = item.activityTimestamp.getTime();
  const changedTs = item.statusChangedAt.getTime();
  const createdTs = item.createdAt.getTime();
  return activityTs === changedTs && changedTs > createdTs;
}

import Image from "next/image";
import Link from "next/link";

import type { FeedItem } from "../types";

const STATUS_LABELS: Record<string, string> = {
  WISHLIST: "Wishlist",
  SHELF: "Shelf",
  UP_NEXT: "Up Next",
  PLAYING: "Playing",
  PLAYED: "Played",
};

function formatStatus(status: string): string {
  return STATUS_LABELS[status] ?? status;
}

function getRelativeTime(date: Date): string {
  const now = Date.now();
  const diffMs = now - date.getTime();
  const diffSeconds = Math.floor(diffMs / 1000);

  if (diffSeconds < 60) return "just now";

  const diffMinutes = Math.floor(diffSeconds / 60);
  if (diffMinutes < 60) return `${diffMinutes}m ago`;

  const diffHours = Math.floor(diffMinutes / 60);
  if (diffHours < 24) return `${diffHours}h ago`;

  const diffDays = Math.floor(diffHours / 24);
  if (diffDays < 30) return `${diffDays}d ago`;

  const diffMonths = Math.floor(diffDays / 30);
  if (diffMonths < 12) return `${diffMonths}mo ago`;

  const diffYears = Math.floor(diffDays / 365);
  return `${diffYears}y ago`;
}

function UserAvatar({ user }: { user: FeedItem["user"] }) {
  const displayName = user.name ?? user.username ?? "Unknown";
  const initial = displayName.charAt(0).toUpperCase();

  if (user.image) {
    return (
      <Image
        width={36}
        height={36}
        src={user.image}
        alt={`${displayName}'s avatar`}
        className="ring-border/50 h-9 w-9 rounded-full object-cover ring-1"
      />
    );
  }

  return (
    <div className="bg-primary/10 text-primary flex h-9 w-9 items-center justify-center rounded-full text-xs font-semibold">
      {initial}
    </div>
  );
}

function GameCoverThumbnail({ game }: { game: FeedItem["game"] }) {
  if (!game.coverImage) {
    return (
      <div className="bg-muted text-muted-foreground flex h-12 w-9 shrink-0 items-center justify-center rounded text-[8px]">
        N/A
      </div>
    );
  }

  const isIgdbUrl = game.coverImage.includes("igdb.com");
  const src = isIgdbUrl
    ? game.coverImage
    : `https://images.igdb.com/igdb/image/upload/t_thumb/${game.coverImage}.jpg`;

  return (
    <Image
      width={36}
      height={48}
      src={src}
      alt={`${game.title} cover`}
      className="h-12 w-9 shrink-0 rounded object-cover"
    />
  );
}

function EventDescription({ item }: { item: FeedItem }) {
  const gameLink = (
    <Link
      href={`/games/${item.game.slug}`}
      className="text-foreground font-medium hover:underline"
    >
      {item.game.title}
    </Link>
  );

  if (item.eventType === "LIBRARY_ADD") {
    return (
      <p className="text-muted-foreground text-sm">
        added {gameLink} to their library
      </p>
    );
  }

  return (
    <p className="text-muted-foreground text-sm">
      marked {gameLink} as{" "}
      <span className="text-foreground font-medium">
        {formatStatus(item.status)}
      </span>
    </p>
  );
}

export function ActivityFeedItem({ item }: { item: FeedItem }) {
  const displayName = item.user.name ?? item.user.username ?? "Unknown";

  return (
    <div className="flex gap-3 py-3">
      <div className="shrink-0">
        {item.user.username ? (
          <Link href={`/u/${item.user.username}`}>
            <UserAvatar user={item.user} />
          </Link>
        ) : (
          <UserAvatar user={item.user} />
        )}
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              {item.user.username ? (
                <Link
                  href={`/u/${item.user.username}`}
                  className="text-foreground truncate text-sm font-medium hover:underline"
                >
                  {displayName}
                </Link>
              ) : (
                <span className="text-foreground truncate text-sm font-medium">
                  {displayName}
                </span>
              )}
              <span className="text-muted-foreground shrink-0 text-xs">
                {getRelativeTime(item.timestamp)}
              </span>
            </div>

            <EventDescription item={item} />
          </div>

          <Link href={`/games/${item.game.slug}`} className="shrink-0">
            <GameCoverThumbnail game={item.game} />
          </Link>
        </div>
      </div>
    </div>
  );
}

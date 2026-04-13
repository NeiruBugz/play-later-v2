"use client";

import {
  type FeedItemRow,
  type PaginatedFeedResult,
} from "@/data-access-layer/repository";
import { Loader2 } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef } from "react";

import { useActivityLog } from "../hooks/use-activity-log";

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
  const diffMs = Date.now() - date.getTime();
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

function isStatusChange(row: FeedItemRow): boolean {
  if (!row.statusChangedAt) return false;
  const activityTs = row.activityTimestamp.getTime();
  const changedTs = row.statusChangedAt.getTime();
  const createdTs = row.createdAt.getTime();
  return activityTs === changedTs && changedTs > createdTs;
}

function UserAvatar({
  name,
  username,
  image,
}: {
  name: string | null;
  username: string | null;
  image: string | null;
}) {
  const displayName = name ?? username ?? "Unknown";
  if (image) {
    return (
      <Image
        width={36}
        height={36}
        src={image}
        alt={`${displayName}'s avatar`}
        className="ring-border/50 h-9 w-9 rounded-full object-cover ring-1"
      />
    );
  }
  const initial = displayName.charAt(0).toUpperCase();
  return (
    <div className="bg-primary/10 text-primary flex h-9 w-9 items-center justify-center rounded-full text-xs font-semibold">
      {initial}
    </div>
  );
}

function GameCoverThumbnail({
  coverImage,
  title,
}: {
  coverImage: string | null;
  title: string;
}) {
  if (!coverImage) {
    return (
      <div className="bg-muted text-muted-foreground flex h-12 w-9 shrink-0 items-center justify-center rounded text-[8px]">
        N/A
      </div>
    );
  }
  const isIgdbUrl = coverImage.includes("igdb.com");
  const src = isIgdbUrl
    ? coverImage
    : `https://images.igdb.com/igdb/image/upload/t_thumb/${coverImage}.jpg`;
  return (
    <Image
      width={36}
      height={48}
      src={src}
      alt={`${title} cover`}
      className="h-12 w-9 shrink-0 rounded object-cover"
    />
  );
}

function ActivityLogRow({ item }: { item: FeedItemRow }) {
  const displayName = item.userName ?? item.userUsername ?? "Unknown";
  const statusChange = isStatusChange(item);

  const gameLink = (
    <Link
      href={`/games/${item.gameSlug}`}
      className="text-foreground font-medium hover:underline"
    >
      {item.gameTitle}
    </Link>
  );

  return (
    <li className="flex gap-3 py-3">
      <div className="shrink-0">
        {item.userUsername ? (
          <Link href={`/u/${item.userUsername}`}>
            <UserAvatar
              name={item.userName}
              username={item.userUsername}
              image={item.userImage}
            />
          </Link>
        ) : (
          <UserAvatar
            name={item.userName}
            username={item.userUsername}
            image={item.userImage}
          />
        )}
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              {item.userUsername ? (
                <Link
                  href={`/u/${item.userUsername}`}
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
                {getRelativeTime(item.activityTimestamp)}
              </span>
            </div>

            {statusChange ? (
              <p className="text-muted-foreground text-sm">
                marked {gameLink} as{" "}
                <span className="text-foreground font-medium">
                  {formatStatus(item.status)}
                </span>
              </p>
            ) : (
              <p className="text-muted-foreground text-sm">
                added {gameLink} to their library
              </p>
            )}
          </div>

          <Link href={`/games/${item.gameSlug}`} className="shrink-0">
            <GameCoverThumbnail
              coverImage={item.gameCoverImage}
              title={item.gameTitle}
            />
          </Link>
        </div>
      </div>
    </li>
  );
}

export type ActivityLogProps = {
  userId: string;
  initialData?: PaginatedFeedResult;
};

export function ActivityLog({ userId, initialData }: ActivityLogProps) {
  const sentinelRef = useRef<HTMLDivElement>(null);

  const { data, fetchNextPage, hasNextPage, isFetchingNextPage } =
    useActivityLog({ userId, initialData });

  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const [entry] = entries;
        if (entry?.isIntersecting && hasNextPage && !isFetchingNextPage) {
          fetchNextPage();
        }
      },
      { rootMargin: "200px" }
    );

    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  const items =
    data?.pages.flatMap((page: PaginatedFeedResult) => page.items) ?? [];

  if (items.length === 0) {
    return (
      <p className="text-muted-foreground py-6 text-center text-sm">
        No activity yet.
      </p>
    );
  }

  return (
    <>
      <ul className="divide-border/40 divide-y">
        {items.map((item) => (
          <ActivityLogRow key={item.id} item={item} />
        ))}
      </ul>

      {hasNextPage && (
        <div
          ref={sentinelRef}
          data-testid="activity-log-sentinel"
          className="flex justify-center py-4"
        >
          {isFetchingNextPage && (
            <Loader2
              data-testid="activity-log-loading"
              className="text-muted-foreground h-5 w-5 animate-spin"
            />
          )}
        </div>
      )}

      {!hasNextPage && items.length > 0 && (
        <div className="flex justify-center py-4">
          <p className="text-muted-foreground text-xs">No more activity</p>
        </div>
      )}
    </>
  );
}

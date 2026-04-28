"use client";

import { Loader2 } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useRef, type ReactNode } from "react";

import { useInfiniteScrollSentinel } from "@/shared/hooks/use-infinite-scroll-sentinel";

import { useActivityLog } from "../hooks/use-activity-log";
import {
  formatStatus,
  getRelativeTime,
  isStatusChange,
} from "../lib/activity-log-format";
import type {
  ActivityLogItem as FeedItemRow,
  ActivityLogPage as PaginatedFeedResult,
} from "../lib/activity-log-types";

export type ActivityLogProps = {
  userId: string;
  initialData?: PaginatedFeedResult;
};

export function ActivityLog({ userId, initialData }: ActivityLogProps) {
  const sentinelRef = useRef<HTMLDivElement>(null);

  const { data, fetchNextPage, hasNextPage, isFetchingNextPage } =
    useActivityLog({ userId, initialData });

  useInfiniteScrollSentinel(sentinelRef, {
    hasNextPage,
    isFetchingNextPage,
    fetchNextPage,
  });

  if (!data) return null;

  const items = data.pages.flatMap((page: PaginatedFeedResult) => page.items);

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
        <UserLink username={item.userUsername}>
          <UserAvatar
            name={item.userName}
            username={item.userUsername}
            image={item.userImage}
          />
        </UserLink>
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <UserLink
                username={item.userUsername}
                className="text-foreground truncate text-sm font-medium hover:underline"
              >
                {displayName}
              </UserLink>
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

function UserLink({
  username,
  className,
  children,
}: {
  username: string | null;
  className?: string;
  children: ReactNode;
}) {
  if (!username) {
    return className ? (
      <span className={className}>{children}</span>
    ) : (
      <>{children}</>
    );
  }

  return (
    <Link href={`/u/${username}`} className={className}>
      {children}
    </Link>
  );
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

  return (
    <div className="bg-primary/10 text-primary flex h-9 w-9 items-center justify-center rounded-full text-xs font-semibold">
      {displayName.charAt(0).toUpperCase()}
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

  const isFullUrl = /^https?:\/\//i.test(coverImage);
  const src = isFullUrl
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

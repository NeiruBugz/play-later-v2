import { Info } from "lucide-react";
import Link from "next/link";

import type { FeedItem } from "../types";
import { ActivityFeedItem } from "./activity-feed-item";
import { FollowButton } from "./follow-button";

type ActivityFeedEmptyProps = {
  items: FeedItem[];
};

function PopularFeedBanner() {
  return (
    <div className="bg-muted/50 border-border/60 flex items-start gap-2.5 rounded-lg border px-4 py-3">
      <Info className="text-muted-foreground mt-0.5 h-4 w-4 shrink-0" />
      <p className="text-muted-foreground text-sm">
        Showing popular activity. Follow gamers to personalize your feed.
      </p>
    </div>
  );
}

function PopularFeedItem({ item }: { item: FeedItem }) {
  return (
    <div className="flex items-center gap-3">
      <div className="min-w-0 flex-1">
        <ActivityFeedItem item={item} />
      </div>

      {item.user.username ? (
        <div className="shrink-0">
          <FollowButton followingId={item.user.id} initialIsFollowing={false} />
        </div>
      ) : null}
    </div>
  );
}

export function ActivityFeedEmpty({ items }: ActivityFeedEmptyProps) {
  if (items.length === 0) {
    return (
      <p className="text-muted-foreground py-6 text-center text-sm">
        No activity yet. Check back later or{" "}
        <Link href="/games/search" className="text-primary hover:underline">
          browse games
        </Link>{" "}
        to get started.
      </p>
    );
  }

  return (
    <div className="space-y-4">
      <PopularFeedBanner />

      <div className="divide-border/40 divide-y">
        {items.map((item) => (
          <PopularFeedItem key={item.id} item={item} />
        ))}
      </div>
    </div>
  );
}

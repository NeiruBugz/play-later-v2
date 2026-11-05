import { useState } from "react";

import type {
  ActivityFeedResult,
  FeedItem,
} from "@/entities/activity-feed/model";
import type { LibraryItemStatus } from "@/entities/library-item/model";
import { formatLocaleDate } from "@/shared/lib/date";
import { getErrorMessage } from "@/shared/lib/errors";
import { Button } from "@/shared/ui/button";
import { EmptyState } from "@/shared/ui/empty-state";

import type { ProfileActivityTabProps } from "./profile-activity-tab.type";

const ACTIVITY_PHRASE: Record<LibraryItemStatus, string> = {
  WANT: "wants to play",
  PLAYING: "is playing",
  DONE: "is done with",
};

function activityLine(item: FeedItem): string {
  const handle = item.userUsername
    ? `@${item.userUsername}`
    : (item.userName ?? "Someone");
  return `${handle} ${ACTIVITY_PHRASE[item.status as LibraryItemStatus]} ${item.gameTitle}`;
}

export function ProfileActivityTab({
  initialItems,
  initialNextCursor,
  loadMore,
}: ProfileActivityTabProps) {
  const [items, setItems] = useState<ReadonlyArray<FeedItem>>(initialItems);
  const [cursor, setCursor] =
    useState<ActivityFeedResult["nextCursor"]>(initialNextCursor);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (items.length === 0) {
    return (
      <EmptyState
        data-testid="profile-activity-empty"
        title="No activity yet"
        description="Activity will appear here once notes and library changes are tracked publicly."
      />
    );
  }

  const handleLoadMore = async () => {
    if (!cursor || loading) return;
    setLoading(true);
    setError(null);
    try {
      const next = await loadMore(cursor);
      setItems((prev) => [...prev, ...next.items]);
      setCursor(next.nextCursor);
    } catch (err) {
      setError(getErrorMessage(err, "Couldn't load more activity"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-2" data-testid="profile-activity-tab">
      <ul className="divide-border/50 divide-y">
        {items.map((item) => (
          <li
            key={item.id}
            className="py-3 text-sm"
            data-testid="profile-activity-entry"
          >
            <p className="text-foreground">{activityLine(item)}</p>
            <p className="text-muted-foreground text-xs">
              {formatLocaleDate(item.activityTimestamp)}
            </p>
          </li>
        ))}
      </ul>
      {error ? (
        <EmptyState
          role="alert"
          title="Couldn't load activity"
          description={error}
        />
      ) : null}
      {cursor ? (
        <Button
          type="button"
          variant="outline"
          onClick={handleLoadMore}
          disabled={loading}
        >
          {loading ? "Loading..." : "Load more"}
        </Button>
      ) : null}
    </div>
  );
}

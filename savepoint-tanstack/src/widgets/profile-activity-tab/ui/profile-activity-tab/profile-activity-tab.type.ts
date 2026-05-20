import type {
  ActivityFeedResult,
  FeedItem,
} from "@/entities/activity-feed/model";

export type ProfileActivityTabProps = {
  initialItems: ReadonlyArray<FeedItem>;
  initialNextCursor: ActivityFeedResult["nextCursor"];
  /**
   * Fetcher invoked when the user clicks "Load more" — receives the keyset
   * cursor returned from the previous page and resolves to the next page.
   * Route owns the choice of `getActivityFeedFn` (viewer-feed) vs
   * `getActivityForUserFn` (per-user public activity).
   */
  loadMore: (
    cursor: NonNullable<ActivityFeedResult["nextCursor"]>
  ) => Promise<ActivityFeedResult>;
};

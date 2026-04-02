export type FeedItemRow = {
  id: number;
  status: string;
  createdAt: Date;
  statusChangedAt: Date | null;
  activityTimestamp: Date;
  userId: string;
  gameId: string;
  userName: string | null;
  userUsername: string | null;
  userImage: string | null;
  gameTitle: string;
  gameCoverImage: string | null;
  gameSlug: string;
};

export type FeedCursor = {
  timestamp: Date;
  id: number;
};

export type PaginatedFeedResult = {
  items: FeedItemRow[];
  nextCursor: FeedCursor | null;
};

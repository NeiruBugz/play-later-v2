export type FeedEventType = "LIBRARY_ADD" | "STATUS_CHANGE";

// TODO: Expand with full feed item fields once activity feed is implemented
export type FeedItem = {
  id: string;
  eventType: FeedEventType;
  userId: string;
  gameId: string;
  createdAt: Date;
};

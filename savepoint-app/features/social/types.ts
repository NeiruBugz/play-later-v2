export type FeedEventType = "LIBRARY_ADD" | "STATUS_CHANGE";

export type FeedItem = {
  id: string;
  eventType: FeedEventType;
  status: string;
  timestamp: Date;
  user: {
    id: string;
    name: string | null;
    username: string | null;
    image: string | null;
  };
  game: {
    id: string;
    title: string;
    coverImage: string | null;
    slug: string;
  };
};

export type FeedCursor = {
  timestamp: string;
  id: string;
};

export type PaginatedFeed = {
  items: FeedItem[];
  nextCursor: FeedCursor | null;
};

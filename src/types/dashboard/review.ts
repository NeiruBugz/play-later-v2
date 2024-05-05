export type ReviewItem = {
  author: {
    name: null | string;
    username: null | string;
  };
  content: string;
  createdAt: Date;
  deletedAt: Date | null;
  game: {
    imageUrl: string;
    title: string;
  };
  gameId: string;
  id: number;
  name: null | string;
  userId: string;
};

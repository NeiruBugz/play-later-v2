type CreateReviewInput = {
  gameId: string;
  userId: string;
  rating: number;
  content?: string;
  completedOn?: string;
};

export type { CreateReviewInput };

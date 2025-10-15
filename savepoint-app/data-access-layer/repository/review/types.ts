export type CreateReviewInput = {
  userId: string;
  gameId: string;
  review: {
    rating: number;
    content?: string;
    completedOn: string | undefined;
  };
};

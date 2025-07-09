export type CreateReviewInput = {
  userId: string;
  gameId: string;
  review: {
    rating: number;
    content: string;
    completedOn: Date | undefined;
  };
};

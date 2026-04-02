export type FollowUserProfile = {
  id: string;
  name: string | null;
  username: string | null;
  image: string | null;
};

export type PaginationOptions = {
  skip?: number;
  take?: number;
};

export type PaginatedFollowersResult = {
  followers: FollowUserProfile[];
  total: number;
};

export type PaginatedFollowingResult = {
  following: FollowUserProfile[];
  total: number;
};

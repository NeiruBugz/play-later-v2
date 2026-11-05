export type UseUpNextMembershipArgs = {
  id: number;
  gameTitle: string;
  upNextPosition: number | null;
};

export type UseUpNextMembershipResult = {
  upNextPosition: number | null;
  isQueued: boolean;
  put: () => Promise<void>;
  remove: () => Promise<void>;
  isPending: boolean;
};

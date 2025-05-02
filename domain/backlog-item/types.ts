type CreateBacklogItemInput = {
  backlogItem: {
    backlogStatus: string;
    acquisitionType: string;
    platform?: string;
    startedAt?: Date;
    completedAt?: Date;
  };
  userId: string;
  gameId: string;
};

type UpdateBacklogItemInput = {
  id: number;
  platform: string;
  status: string;
  startedAt?: Date;
  completedAt?: Date;
};

type UpdateBacklogItemStatusInput = {
  id: number;
  status: string;
};

export type {
  CreateBacklogItemInput,
  UpdateBacklogItemInput,
  UpdateBacklogItemStatusInput,
};

import {
  User,
  type AcquisitionType,
  type BacklogItem,
  type BacklogItemStatus,
  type Game,
  type Prisma,
} from "@prisma/client";

export type CreateBacklogItemInput = {
  userId: string;
  gameId: string;
  backlogItem: {
    status: BacklogItemStatus;
    acquisitionType: AcquisitionType;
    platform?: string;
    startedAt?: Date;
    completedAt?: Date;
  };
};

export type DeleteBacklogItemInput = {
  backlogItemId: number;
  userId: string;
};

export type UpdateBacklogItemInput = {
  userId: string;
  backlogItem: {
    id: number;
    status: BacklogItemStatus;
    platform?: string;
    startedAt?: Date;
    completedAt?: Date;
  };
};

export type GetBacklogItemsForUserByIgdbIdInput = {
  userId: string;
  igdbId: number;
};

export type GetManyBacklogItemsInput = {
  userId: string;
  gameId: string;
};

export type GetBacklogCountInput = {
  userId: string;
  status?: BacklogItemStatus;
  gteClause?: Prisma.BacklogItemWhereInput;
};

export type UserWithBacklogItemsResponse = {
  user: User;
  backlogItems: (BacklogItem & { game: Game })[];
};

import type { PublicUserRef } from "@/entities/follow/model";

export type UserListVariant = "followers" | "following";

export type UserListProps = {
  variant: UserListVariant;
  entries: ReadonlyArray<PublicUserRef>;
  total: number;
};

export type GetUserBySteamIdInput = {
  userId: string;
  steamId: string;
};

export type UpdateUserSteamDataInput = {
  userId: string;
  steamId: string | null;
  username: string | null;
  avatar: string | null;
};

export type GetUserByUsernameInput = {
  username: string;
};

export type UpdateUserDataInput = {
  userId: string;
  username: string | null;
  steamProfileUrl: string | null;
};

export type DefaultUserSelect = {
  readonly id: string;
  readonly name: string | null;
  readonly username: string | null;
  readonly steamProfileURL: string | null;
  readonly steamConnectedAt: Date | null;
  readonly email: string | null;
};

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

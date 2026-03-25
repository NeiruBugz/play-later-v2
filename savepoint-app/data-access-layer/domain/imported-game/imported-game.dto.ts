export type Storefront = "STEAM" | "PLAYSTATION" | "XBOX";
export type IgdbMatchStatus = "PENDING" | "MATCHED" | "UNMATCHED";

export type ImportedGameDto = {
  id: string;
  name: string;
  storefront: Storefront;
  storefrontGameId: string | null;
  playtime: number | null;
  playtimeWindows: number | null;
  playtimeMac: number | null;
  playtimeLinux: number | null;
  lastPlayedAt: Date | null;
  img_icon_url: string | null;
  img_logo_url: string | null;
  igdbMatchStatus: IgdbMatchStatus;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
  userId: string;
};

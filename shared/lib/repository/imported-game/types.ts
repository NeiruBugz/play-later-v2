import type { Prisma, Storefront } from "@prisma/client";

export type GetFilteredImportedGamesInput = {
  whereClause: Prisma.ImportedGameWhereInput;
  page: number;
  limit: number;
  orderBy: Prisma.ImportedGameOrderByWithRelationInput;
};

type SteamGame = {
  name: string;
  storefront: Storefront;
  playtime: number;
  img_icon_url: string;
  img_logo_url: string;
  storefrontGameId: string;
  userId: string;
};

export type CreateManyImportedGamesInput = {
  games: Array<SteamGame>;
};

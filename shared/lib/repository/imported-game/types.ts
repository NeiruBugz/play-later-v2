import type { Prisma } from "@prisma/client";

export type GetFilteredImportedGamesInput = {
  whereClause: Prisma.ImportedGameWhereInput;
  page: number;
  limit: number;
  orderBy: Prisma.ImportedGameOrderByWithRelationInput;
};

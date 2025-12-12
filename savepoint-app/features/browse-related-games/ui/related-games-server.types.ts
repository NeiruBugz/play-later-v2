import type { Collection } from "igdb-api-types";

export interface RelatedGamesServerProps {
  collections: Pick<Collection, "id" | "name">[];
}

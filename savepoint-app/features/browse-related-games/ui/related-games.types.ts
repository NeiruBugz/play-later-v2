import type { Collection } from "igdb-api-types";

export interface RelatedGamesProps {
  collections: Pick<Collection, "id" | "name">[];
}

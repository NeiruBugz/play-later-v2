import type { RelatedGamesPage } from "../related-games-infinite-list";

export type RelatedGamesTabsSection = {
  collectionId: number;
  collectionName: string;
  pageSize: number;
  firstPage: RelatedGamesPage;
};

export type RelatedGamesTabsProps = {
  sections: ReadonlyArray<RelatedGamesTabsSection>;
};

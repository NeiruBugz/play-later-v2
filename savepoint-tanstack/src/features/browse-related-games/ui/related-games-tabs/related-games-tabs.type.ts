import type { ReactNode } from "react";

import type { RelatedGame } from "../../api";
import type { RelatedGamesPage } from "../related-games-infinite-list";

export type RelatedGamesTabsSection = {
  collectionId: number;
  collectionName: string;
  pageSize: number;
  firstPage: RelatedGamesPage;
};

export type RelatedGamesTabsProps = {
  sections: ReadonlyArray<RelatedGamesTabsSection>;
  /**
   * Render prop forwarded to each `RelatedGamesInfiniteList`. Injected by the
   * composing route/widget so the feature never imports from `widgets/`.
   */
  renderGame: (game: RelatedGame) => ReactNode;
};

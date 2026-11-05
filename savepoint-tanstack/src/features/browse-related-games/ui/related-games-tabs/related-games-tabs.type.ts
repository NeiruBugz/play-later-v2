import type { ReactNode } from "react";

import type { RelatedCollection, RelatedGame } from "../../api";

export type RelatedGamesTabsSection = RelatedCollection;

export type RelatedGamesTabsProps = {
  sections: ReadonlyArray<RelatedGamesTabsSection>;
  /**
   * Render prop forwarded to each `RelatedGamesList`. Injected by the
   * composing route/widget so the feature never imports from `widgets/`.
   */
  renderGame: (game: RelatedGame) => ReactNode;
};

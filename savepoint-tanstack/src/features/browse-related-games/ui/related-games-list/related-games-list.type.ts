import type { ReactNode } from "react";

import type { RelatedGame } from "../../api";

export interface RelatedGamesListProps {
  games: ReadonlyArray<RelatedGame>;
  /**
   * Render prop for a single game card. Injected by the composing route so
   * the feature never imports from the `widgets/` layer.
   */
  renderGame: (game: RelatedGame) => ReactNode;
}

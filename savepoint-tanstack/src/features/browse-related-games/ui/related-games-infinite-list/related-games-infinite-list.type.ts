import type { ReactNode } from "react";

import type { RelatedGame } from "../../api";

export interface RelatedGamesPage {
  games: RelatedGame[];
  total: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
}

export interface RelatedGamesInfiniteListProps {
  collectionId: number;
  pageSize: number;
  firstPage: RelatedGamesPage;
  /**
   * Render prop for a single game card. Receives the `RelatedGame` data and
   * must return a ReactNode. Injected by the composing widget/route so that
   * the feature itself never imports from the `widgets/` layer.
   *
   * Typical usage (from `games.$slug.tsx` via `RelatedGamesTabs`):
   * ```tsx
   * renderGame={(game) => (
   *   <GameCard
   *     game={{ slug: game.slug, title: game.title, coverImageId: game.coverImageId }}
   *     density="minimal"
   *   />
   * )}
   * ```
   */
  renderGame: (game: RelatedGame) => ReactNode;
}

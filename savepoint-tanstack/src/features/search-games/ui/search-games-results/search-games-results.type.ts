import type { ReactNode } from "react";

export interface SearchGamesResultsProps {
  /** Debounced query value, sourced from the URL by the route. */
  query: string;
  /**
   * Slot for the add affordance on results the viewer doesn't own. Injected by
   * the route (the composition seam) so this feature never imports the sibling
   * `add-game` feature. Receives the result's IGDB id + title.
   */
  renderAddAction?: (game: { igdbId: number; name: string }) => ReactNode;
}

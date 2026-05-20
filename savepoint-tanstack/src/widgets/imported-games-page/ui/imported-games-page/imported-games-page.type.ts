import type { ImportedGame } from "@/entities/imported-game/model/types";

import type { ImportedGamesFilters } from "../imported-games-filter-bar";

export type ImportedGamesPageProps = {
  /** Games returned by the route loader. Already filtered server-side. */
  games: ReadonlyArray<ImportedGame>;
  /**
   * Steam connection state. When `null`, the empty-state CTA links to
   * `/settings/account`; when set, it offers a "Sync from Steam" button.
   */
  steamId: string | null;
  /** Whether the `?include=ignored` query param is set. Reorders the list. */
  includeIgnored?: boolean;
  /**
   * Current URL filter / sort / search state. When any field is set we treat
   * the surface as "filtered" — the no-matches empty state replaces the
   * onboarding empty states only in that case.
   */
  filters?: ImportedGamesFilters;
};

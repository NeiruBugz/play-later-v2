export type ComposeJournalEntryFormProps = {
  /**
   * Pre-select a game association (used when the compose page is reached from
   * a game-detail "Log a session" link via `?gameId=`). The tanstack journal
   * model keeps the game picker out of the form (Slice 16 divergence); this
   * prop is the only association surface.
   */
  defaultGameId?: string | null;
};

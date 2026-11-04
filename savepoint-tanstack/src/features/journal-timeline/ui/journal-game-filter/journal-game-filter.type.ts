export type JournalGameFilterOption = { id: string; title: string };

export type JournalGameFilterProps = {
  options: JournalGameFilterOption[];
  /** A game id, `"none"` for notes without a game, or `undefined` for all notes. */
  value: string | undefined;
  onChange: (value: string | undefined) => void;
};

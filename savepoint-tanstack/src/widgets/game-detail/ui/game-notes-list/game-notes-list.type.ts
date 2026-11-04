export type GameNote = {
  id: string;
  content: string;
  playedMinutes: number | null;
  createdAt: Date;
};

export type GameNotesListProps = {
  notes: GameNote[];
  onNewNote: () => void;
};

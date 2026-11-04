export type Play = {
  id: string | number;
  startedAt: Date | string | null;
  finishedAt: Date | string | null;
};

export type PlayHistoryProps = {
  plays: Play[];
};

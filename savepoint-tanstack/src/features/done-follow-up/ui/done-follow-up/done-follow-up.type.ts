export type DoneFollowUpProps = {
  itemId: number;
  gameTitle: string;
  currentRating: number | null;
  onClose: () => void;
  onUndo: () => Promise<void>;
  onSaved: () => void;
};

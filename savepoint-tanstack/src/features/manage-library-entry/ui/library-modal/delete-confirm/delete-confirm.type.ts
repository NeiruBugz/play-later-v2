export type DeleteConfirmProps = {
  itemId: number;
  /** The game title the user must type to arm the destructive action. */
  gameTitle: string;
  onCancel: () => void;
  /** Called after a successful delete (the modal closes itself). */
  onDeleted: () => void;
};

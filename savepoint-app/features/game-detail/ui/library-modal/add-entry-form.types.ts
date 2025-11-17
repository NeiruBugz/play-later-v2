export interface AddEntryFormProps {
  igdbId: number;
  gameId?: string;
  gameTitle: string;
  isEditMode?: boolean;
  onSuccess: () => void;
  onCancel: () => void;
}

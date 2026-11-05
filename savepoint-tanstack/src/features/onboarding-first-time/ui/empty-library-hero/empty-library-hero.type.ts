export type EmptyLibraryHeroProps = {
  libraryItemCount: number;
  journalEntryCount: number;
  userImage: string | null;
  userSteamId: string | null;
};

export type EmptyLibraryHeroActionProps = {
  onAddGame: () => void;
};

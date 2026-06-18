export type LogSessionForGameProps = {
  game: string;
  /** Display name of the selected game. Shown in the header card inside the form. */
  gameTitle?: string;
  /** IGDB cover image ID for the header thumbnail. */
  coverImage?: string | null;
  onClose: () => void;
};

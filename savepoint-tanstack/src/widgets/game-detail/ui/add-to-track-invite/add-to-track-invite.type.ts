export type AddToTrackInviteProps = {
  igdbId: number;
  gameTitle: string;
  /** Whether a viewer is authenticated. Drives add-vs-sign-in affordance. */
  isSignedIn: boolean;
};

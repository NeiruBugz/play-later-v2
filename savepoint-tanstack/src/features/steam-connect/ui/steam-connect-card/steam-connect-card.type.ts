export interface SteamConnectCardProps {
  /**
   * The user's currently-linked Steam64 ID, or `null` if not yet connected.
   * Sourced from `User.steamId64` by the parent route loader.
   */
  steamId: string | null;

  /**
   * Precomputed Steam OpenID `checkid_setup` redirect URL. Built server-side
   * from `request.url` in `getSteamConnectionFn` so the `<a href>` matches
   * across SSR and client hydration (avoids the `href="#"` → real-URL flip
   * that React refuses to patch on hydration).
   */
  connectUrl: string;
}

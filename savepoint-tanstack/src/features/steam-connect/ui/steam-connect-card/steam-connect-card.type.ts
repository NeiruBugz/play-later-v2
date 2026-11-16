import type { ReactNode } from "react";

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

  /**
   * Rendered inside the card while connected. The route composes it (e.g. the
   * storefront-sync progress line) so this feature never imports a sibling.
   */
  syncSlot?: ReactNode;
}

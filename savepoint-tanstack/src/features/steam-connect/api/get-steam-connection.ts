import { createServerFn } from "@tanstack/react-start";
import { getRequest } from "@tanstack/react-start/server";

import { getOnboardingSignals } from "@/entities/profile/api/get-onboarding-signals.server";
import { requireUserId } from "@/entities/session/api/require-user-id";

import { buildSteamOpenIdLoginUrl } from "../ui/steam-connect-card/steam-connect-card.utility";

/**
 * Loader-only server fn: returns the viewer's linked Steam ID (or null)
 * AND the precomputed Steam OpenID login URL.
 *
 * The login URL is built server-side from the request's `Host` header so the
 * `<a href>` is identical on SSR and client — avoids the hydration mismatch
 * that occurred when the URL was computed via `window.location.origin` only
 * on the client (href flipped from `#` → real URL during hydration, which
 * React refuses to patch).
 */
export type SteamConnectionView = {
  steamId: string | null;
  connectUrl: string;
};

export const getSteamConnectionFn = createServerFn({ method: "GET" }).handler(
  async (): Promise<SteamConnectionView> => {
    const userId = await requireUserId();
    const { steamId64 } = await getOnboardingSignals(userId);

    const request = getRequest();
    const url = new URL(request.url);
    const origin = url.origin;

    return {
      steamId: steamId64,
      connectUrl: buildSteamOpenIdLoginUrl(origin),
    };
  }
);

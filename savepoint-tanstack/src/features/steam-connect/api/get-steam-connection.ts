import { env } from "@env";
import { createServerFn } from "@tanstack/react-start";

import { getOnboardingSignals } from "@/entities/profile/api/get-onboarding-signals.server";
import { requireUserId } from "@/entities/session/api/require-user-id";
import { createSteamLoginState } from "@/shared/api/steam";

import { buildSteamOpenIdLoginUrl } from "../ui/steam-connect-card/steam-connect-card.utility";

/**
 * Loader-only server fn: returns the viewer's linked Steam ID (or null)
 * AND the precomputed Steam OpenID login URL.
 *
 * The login URL is built server-side so the `<a href>` is identical on SSR and
 * client — avoids the hydration mismatch that occurred when the URL was
 * computed via `window.location.origin` only on the client. Its `return_to` is
 * anchored on `BETTER_AUTH_URL` (the origin the callback verifier requires)
 * and carries a short-lived state bound to the signed-in user.
 */
export type SteamConnectionView = {
  steamId: string | null;
  connectUrl: string;
};

export const getSteamConnectionFn = createServerFn({ method: "GET" }).handler(
  async (): Promise<SteamConnectionView> => {
    const userId = await requireUserId();
    const { steamId64 } = await getOnboardingSignals(userId);

    const state = createSteamLoginState({
      userId,
      secret: env.BETTER_AUTH_SECRET,
    });

    return {
      steamId: steamId64,
      connectUrl: buildSteamOpenIdLoginUrl(env.BETTER_AUTH_URL, state),
    };
  }
);

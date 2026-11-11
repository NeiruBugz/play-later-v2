/**
 * Build the Steam OpenID `checkid_setup` redirect URL.
 *
 * Pure string composition — the OpenID 2.0 protocol requires the client to
 * send the user to Steam's `/openid/login` endpoint with a fixed bundle of
 * `openid.*` query params; Steam then redirects back to `returnTo` with the
 * signed response, which the `/steam/callback` route verifies via
 * `connectSteamFn`.
 *
 * `state` is the signed, user-bound value from `createSteamLoginState`; it
 * rides inside `return_to` (which Steam signs) and is checked on callback.
 *
 * `realm` MUST be the bare origin (no path). `returnTo` MUST be on the same
 * origin/realm. Both are derived through `URL` so a `siteUrl` with a trailing
 * slash (e.g. `BETTER_AUTH_URL=https://app.example.com/`) cannot produce a
 * `//steam/callback` return-to that the callback verifier rejects.
 */
export function buildSteamOpenIdLoginUrl(
  siteUrl: string,
  state: string
): string {
  const realm = new URL(siteUrl).origin;
  const returnTo = new URL("/steam/callback", realm);
  returnTo.searchParams.set("state", state);
  const params = new URLSearchParams({
    "openid.ns": "http://specs.openid.net/auth/2.0",
    "openid.mode": "checkid_setup",
    "openid.return_to": returnTo.toString(),
    "openid.realm": realm,
    "openid.identity": "http://specs.openid.net/auth/2.0/identifier_select",
    "openid.claimed_id": "http://specs.openid.net/auth/2.0/identifier_select",
  });
  return `https://steamcommunity.com/openid/login?${params.toString()}`;
}

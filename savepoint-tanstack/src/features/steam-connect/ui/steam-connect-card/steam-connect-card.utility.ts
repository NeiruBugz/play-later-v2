/**
 * Build the Steam OpenID `checkid_setup` redirect URL.
 *
 * Pure string composition — the OpenID 2.0 protocol requires the client to
 * send the user to Steam's `/openid/login` endpoint with a fixed bundle of
 * `openid.*` query params; Steam then redirects back to `returnTo` with the
 * signed response, which the `/steam/callback` route verifies via
 * `connectSteamFn`.
 *
 * `realm` MUST be the bare origin (no path). `returnTo` MUST be on the same
 * origin/realm.
 */
export function buildSteamOpenIdLoginUrl(returnToOrigin: string): string {
  const realm = returnToOrigin;
  const returnTo = `${returnToOrigin}/steam/callback`;
  const params = new URLSearchParams({
    "openid.ns": "http://specs.openid.net/auth/2.0",
    "openid.mode": "checkid_setup",
    "openid.return_to": returnTo,
    "openid.realm": realm,
    "openid.identity": "http://specs.openid.net/auth/2.0/identifier_select",
    "openid.claimed_id": "http://specs.openid.net/auth/2.0/identifier_select",
  });
  return `https://steamcommunity.com/openid/login?${params.toString()}`;
}

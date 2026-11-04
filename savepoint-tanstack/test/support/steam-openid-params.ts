import { env } from "@env";

import { createSteamLoginState } from "@/shared/api/steam/login-state.server";

export const STEAM_ID_64 = "76561198012345678";

export function buildSteamReturnTo(userId: string): string {
  const state = createSteamLoginState({
    userId,
    secret: env.BETTER_AUTH_SECRET,
  });
  return `${env.BETTER_AUTH_URL}/steam/callback?state=${state}`;
}

export function buildValidOpenIdParams(userId: string): Record<string, string> {
  return {
    "openid.mode": "id_res",
    "openid.ns": "http://specs.openid.net/auth/2.0",
    "openid.claimed_id": `https://steamcommunity.com/openid/id/${STEAM_ID_64}`,
    "openid.identity": `https://steamcommunity.com/openid/id/${STEAM_ID_64}`,
    "openid.return_to": buildSteamReturnTo(userId),
    "openid.sig": "test-signature",
    "openid.signed":
      "signed,op_endpoint,claimed_id,identity,return_to,response_nonce,assoc_handle",
    "openid.assoc_handle": "12345",
    "openid.response_nonce": "2026-05-20T00:00:00Zabcdef",
    "openid.op_endpoint": "https://steamcommunity.com/openid/login",
  };
}

import { env } from "@/env.mjs";
import SteamAuth from "node-steam-openid";

export const steamAuth = new SteamAuth({
  realm: env.AUTH_URL,
  returnUrl: `${env.AUTH_URL}/api/steam/callback`,
  apiKey: env.STEAM_API_KEY,
});

import { env } from "@/env.mjs";

export const API_URL = "https://api.igdb.com/v4";

export const TOKEN_URL = `https://id.twitch.tv/oauth2/token?client_id=${env.IGDB_CLIENT_ID}&client_secret=${env.IGDB_CLIENT_SECRET}&grant_type=client_credentials`;
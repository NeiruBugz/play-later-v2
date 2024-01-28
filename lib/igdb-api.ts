"use server"

import { env } from "@/env"

const IGDB_BASE_URL = "https://api.igdb.com/v4"
const TWITCH_OAUTH = "https://id.twitch.tv/oauth2/token"

async function authorizeIGDB() {
  const url = new URL(TWITCH_OAUTH)
  url.searchParams.append("client_id", env.IGDB_CLIENT_ID as string)
  url.searchParams.append("client_secret", env.IGDB_CLIENT_SECRET as string)
  url.searchParams.append("grant_type", "client_credentials")
  try {
    const request = await fetch(url, {
      method: "POST",
    })

    const response = await request.json()
    console.log("TWITCH_AUTH: ", response)
  } catch (error) {
    console.error(error)
  }
}

export { authorizeIGDB }

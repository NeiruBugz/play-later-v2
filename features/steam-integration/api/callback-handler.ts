"use server";

import { getServerUserId } from "@/auth";
import { NextRequest, NextResponse } from "next/server";

import { steamAuth } from "@/features/steam-integration/lib/steam-auth";
import { getUserBySteamId, updateUserSteamData } from "@/shared/lib/repository";

async function callbackHandler(request: NextRequest) {
  try {
    const steamUser = await steamAuth.authenticate(request);
    const applicationUserId = await getServerUserId();

    if (!applicationUserId) {
      const url = new URL("/user/settings", request.url);
      url.searchParams.set("error", "session_expired");
      return NextResponse.redirect(url.toString());
    }

    const { steamid, username, avatar } = steamUser;
    const existingUser = await getUserBySteamId({
      userId: applicationUserId,
      steamId: steamid,
    });

    if (existingUser) {
      const url = new URL("/user/settings", request.url);
      url.searchParams.set("error", "steam_already_connected");
      return NextResponse.redirect(url.toString());
    }

    await updateUserSteamData({
      userId: applicationUserId,
      steamId: steamid,
      username,
      avatar: avatar.large,
    });

    const url = new URL("/user/settings", request.url);
    url.searchParams.set("success", "steam_connected");
    return NextResponse.redirect(url.toString());
  } catch (error) {
    console.error("Steam callback error:", error);
    const url = new URL("/user/settings", request.url);
    url.searchParams.set("error", "steam_connection_failed");
    return NextResponse.redirect(url.toString());
  }
}

export { callbackHandler as GET };

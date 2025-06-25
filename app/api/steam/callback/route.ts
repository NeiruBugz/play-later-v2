import { getServerUserId } from "@/auth";
import { UserService } from "@/domain/user/service";
import { steamAuth } from "@/features/steam-integration/lib/steam-auth";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  try {
    const steamUser = await steamAuth.authenticate(request);
    const applicationUserId = await getServerUserId();

    if (!applicationUserId) {
      const url = new URL("/user/settings", request.url);
      url.searchParams.set("error", "session_expired");
      return NextResponse.redirect(url.toString());
    }

    console.log("steamUser", { steamUser });

    const { steamid, profile, username, avatar } = steamUser;
    const existingUser = await UserService.getUserBySteamId(
      applicationUserId,
      steamid
    );

    if (existingUser) {
      const url = new URL("/user/settings", request.url);
      url.searchParams.set("error", "steam_already_connected");
      return NextResponse.redirect(url.toString());
    }

    await UserService.updateUserSteamData({
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

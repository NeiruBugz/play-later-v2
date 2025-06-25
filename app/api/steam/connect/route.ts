import { getServerUserId } from "@/auth";
import { steamAuth } from "@/features/steam-integration/lib/steam-auth";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  try {
    const userId = await getServerUserId();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const redirectUrl = await steamAuth.getRedirectUrl();

    const url = new URL(redirectUrl);
    url.searchParams.set("state", userId);

    return NextResponse.redirect(url.toString());
  } catch (error) {
    console.error("Steam connect error:", error);
    return NextResponse.json(
      { error: "Failed to connect to Steam" },
      { status: 500 }
    );
  }
}

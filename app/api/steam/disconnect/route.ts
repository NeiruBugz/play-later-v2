import { getServerUserId } from "@/auth";
import { NextResponse } from "next/server";

import { updateUserSteamData } from "@/shared/lib/repository";

export async function POST() {
  try {
    const userId = await getServerUserId();
    if (userId == null || userId === "") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await updateUserSteamData({
      userId,
      steamId: null,
      username: null,
      avatar: null,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to disconnect Steam", cause: error },
      { status: 500 }
    );
  }
}

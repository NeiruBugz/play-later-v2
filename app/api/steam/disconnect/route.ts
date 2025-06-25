import { getServerUserId } from "@/auth";
import { prisma } from "@/shared/lib/db";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const userId = await getServerUserId();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await prisma.user.update({
      where: { id: userId },
      data: {
        steamId64: null,
        steamUsername: null,
        steamProfileURL: null,
        steamAvatar: null,
        steamConnectedAt: null,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Steam disconnect error:", error);
    return NextResponse.json(
      { error: "Failed to disconnect Steam" },
      { status: 500 }
    );
  }
}

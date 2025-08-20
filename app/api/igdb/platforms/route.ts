import { NextResponse } from "next/server";

import { IgdbService } from "@/shared/services";

const igdbService = new IgdbService();

export async function GET() {
  try {
    // Call service layer
    const result = await igdbService.getPlatforms();

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 500 });
    }

    return NextResponse.json(result.data);
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to get platforms", cause: error },
      { status: 500 }
    );
  }
}

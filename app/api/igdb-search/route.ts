import { NextResponse } from "next/server";

import { GameSearchService } from "@/shared/services";

const gameSearchService = new GameSearchService();

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get("q");
  const platforms = searchParams.get("platforms");

  if (query != null && query !== "undefined") {
    const result = await gameSearchService.searchGames({
      name: query,
      fields: {
        platforms: platforms ?? "",
      },
    });

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    return NextResponse.json({ response: result.data?.games });
  }

  return NextResponse.json(
    { error: "Query parameter 'q' is required" },
    { status: 400 }
  );
}

import { NextResponse } from "next/server";

import igdbApi from "@/shared/lib/igdb";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get("q");
  const platforms = searchParams.get("platforms");

  if (query != null && query !== "undefined") {
    const response = await igdbApi.search({
      name: query,
      fields: {
        platforms: platforms ?? "",
      },
    });
    return NextResponse.json({ response });
  }
}

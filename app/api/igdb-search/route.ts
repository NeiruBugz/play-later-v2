import igdbApi from "@/shared/lib/igdb";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get("q");
  const platforms = searchParams.get("platforms");

  if (query && query !== "undefined") {
    const response = await igdbApi.search({
      name: query,
      fields: {
        platforms: platforms || "",
      },
    });
    return NextResponse.json({ response });
  }
}

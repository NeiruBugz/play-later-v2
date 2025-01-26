import igdbApi from "@/src/shared/api/igdb";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get("q");
  const platform = searchParams.get("platform");

  if (query && query !== "undefined") {
    const response = await igdbApi.search({
      name: query,
      fields: {
        platform: platform || "",
      },
    });
    return NextResponse.json({ response });
  }
}

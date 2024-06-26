import igdbApi from "@/src/shared/api/igdb";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get("q");

  if (query && query !== "undefined") {
    const response = await igdbApi.search({ name: query });
    return NextResponse.json({ response });
  }
}

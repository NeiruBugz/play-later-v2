import { NextResponse } from "next/server";
import igdbApi from "@/src/shared/api/igdb";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const query = searchParams.get("q");

  if (query && query !== "undefined") {
    const response = await igdbApi.search({ name: query });
    return NextResponse.json({ response });
  }
}

export async function POST(req: Request) {
  const { searchParams } = new URL(req.url);
  const query = searchParams.get("q");

  if (query && query !== "undefined") {
    const response = await igdbApi.search({ name: query });
    return NextResponse.json({ response });
  }
}

import { NextResponse } from "next/server";

import { searchHowLongToBeat } from "@/lib/hltb-search";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const query = searchParams.get("q");

  if (query && query !== "undefined") {
    const response = await searchHowLongToBeat(query);
    return NextResponse.json({ response });
  }
}

export async function POST(req: Request) {
  const { searchParams } = new URL(req.url);
  const query = searchParams.get("q");

  if (query && query !== "undefined") {
    const response = await searchHowLongToBeat(query);
    return NextResponse.json({ response });
  }
}

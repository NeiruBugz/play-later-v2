import { NextResponse } from "next/server";

import { searchHowLongToBeat } from "@/lib/hltb-search";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get("q");

  if (!query) {
    return NextResponse.error();
  }

  console.log(query);
  const [result] = await searchHowLongToBeat(query);
  console.log(result);

  return NextResponse.json({
    id: result.id,
    gameplayTime: result.gameplayMain,
  });
}

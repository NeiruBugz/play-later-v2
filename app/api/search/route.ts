import { NextResponse } from "next/server"
import { HowLongToBeatService } from "howlongtobeat"

async function searchHowLongToBeat(query: string) {
  const hltb = new HowLongToBeatService()
  const response = await hltb.search(query)
  return response
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const query = searchParams.get("q")

  if (typeof query === "string" && query !== "undefined") {
    const response = await searchHowLongToBeat(query)
    return NextResponse.json({ response })
  }
}

export async function POST(req: Request) {
  const { searchParams } = new URL(req.url)
  const query = searchParams.get("q")

  if (typeof query === "string" && query !== "undefined") {
    const response = await searchHowLongToBeat(query)
    return NextResponse.json({ response })
  }
}

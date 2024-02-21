import { NextResponse } from "next/server"

import { searchHowLongToBeat } from "@/lib/hltb-search"

export async function GET(req: Request) {
  console.log(req)
  const { searchParams } = new URL(req.url)
  console.log(searchParams)
  const query = searchParams.get("q")
  console.log(query)

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

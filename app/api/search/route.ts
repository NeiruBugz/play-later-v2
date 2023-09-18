import { revalidatePath } from "next/cache"
import { NextResponse } from "next/server"
import { HowLongToBeatEntry, HowLongToBeatService } from "howlongtobeat"

export async function GET(req: Request) {
  const hltb = new HowLongToBeatService()
  const { searchParams } = new URL(req.url)
  const query = searchParams.get("q")
  if (typeof query === "string" && query !== "undefined") {
    const response = await hltb.search(query)

    return NextResponse.json({ response })
  }
}

export async function POST(req: Request) {
  const hltb = new HowLongToBeatService()
  const { searchParams } = new URL(req.url)
  const query = searchParams.get("q")
  if (typeof query === "string" && query !== "undefined") {
    const response = await hltb.search(query)

    return NextResponse.json({ response })
  }
}

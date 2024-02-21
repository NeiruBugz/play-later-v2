import { HowLongToBeatService } from "howlongtobeat"

export async function searchHowLongToBeat(query?: string | null) {
  if (!query) {
    return []
  }
  const hltb = new HowLongToBeatService()
  const response = await hltb.search(query)
  return response
}

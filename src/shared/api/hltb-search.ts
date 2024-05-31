import { HowLongToBeatService } from "howlongtobeat";

export async function searchHowLongToBeat(query?: null | string) {
  if (!query) {
    return [];
  }
  const hltb = new HowLongToBeatService();
  return await hltb.search(query);
}

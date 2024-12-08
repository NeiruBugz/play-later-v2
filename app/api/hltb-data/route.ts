import { HowLongToBeatService } from "howlongtobeat";
import { NextResponse } from "next/server";

async function fetchHowLongToBeatData(gameTitle: string) {
  if (gameTitle.length === 0) {
    return undefined;
  }

  try {
    const htlbService = new HowLongToBeatService();
    const data = await htlbService.search(gameTitle);

    if (!data) {
      return undefined;
    }
    const [firstResult] = data;
    return firstResult;
  } catch (error) {
    console.error(error);
    return undefined;
  }
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get("q");

  if (!query) {
    return NextResponse.error();
  }

  const howLongToBeatResponse = await fetchHowLongToBeatData(query);

  if (!howLongToBeatResponse) {
    return NextResponse.json({ error: "No results found" }, { status: 404 });
  }

  return NextResponse.json({
    mainStory: howLongToBeatResponse.gameplayMain,
    mainExtra: howLongToBeatResponse.gameplayMainExtra,
    completionist: howLongToBeatResponse.gameplayCompletionist,
    description: howLongToBeatResponse.description,
    id: howLongToBeatResponse.id,
  });
}

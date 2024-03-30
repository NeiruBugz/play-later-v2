import { Game, List } from "@prisma/client";

import { getListGamesArtworks } from "@/app/(features)/(protected)/library/lib/actions";

export async function getListGames(lists: List[]) {
  const artworksMap = new Map<
    List["id"],
    Array<{ id: Game["id"]; artwork: Game["imageUrl"]; game: Game["title"] }>
  >();
  if (lists.length === 0) {
    return artworksMap;
  }

  for (const list of lists) {
    const games = await getListGamesArtworks(list.id);
    if (games.length) {
      artworksMap.set(list.id, games.slice(0, 6));
    }
  }

  return artworksMap;
}

import { isExternalGameId } from "./is-external-game";

export function getGameUrl(gameId: string): string {
  return isExternalGameId(gameId)
    ? `/game/external/${gameId}`
    : `/game/${gameId}`;
}

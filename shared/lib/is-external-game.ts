export function isExternalGameId(gameId: string): boolean {
  return !isNaN(Number(gameId)) && Number.isInteger(Number(gameId));
}

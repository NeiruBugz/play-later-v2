export function determineGameSource(gameId: string) {
  const isNumeric = !isNaN(Number(gameId)) && Number.isInteger(Number(gameId));
  return isNumeric ? "EXTERNAL" : "INTERNAL";
}

function steamIdToSteam64(steamId: string): number {

  const parts = steamId.split(':');


  const y = parseInt(parts[2], 10);
  const z = parseInt(parts[3], 10);

  return 76561197960265728 + (z * 2) + y;
}

export { steamIdToSteam64 };

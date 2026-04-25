export type IgdbPlatformLike = {
  id: number;
  name?: string;
};

export type KnownPlatformLike = {
  igdbId: number | null;
  name: string;
};

export function resolvePrimaryPlatform(params: {
  igdbPlatforms: IgdbPlatformLike[] | undefined | null;
  knownPlatforms: KnownPlatformLike[];
}): string | null {
  const { igdbPlatforms, knownPlatforms } = params;

  if (!igdbPlatforms || igdbPlatforms.length === 0) {
    return null;
  }

  for (const igdbPlatform of igdbPlatforms) {
    const match = knownPlatforms.find(
      (known) => known.igdbId === igdbPlatform.id
    );
    if (match) {
      return match.name;
    }
  }

  return null;
}

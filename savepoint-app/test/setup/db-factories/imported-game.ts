import { getTestDatabase } from "@/test/setup/database";
import { faker, seedFaker } from "@/test/setup/faker";
import type { IgdbMatchStatus, ImportedGame, Storefront } from "@prisma/client";

let importedGameCounter = 0;

export const resetImportedGameCounter = () => {
  importedGameCounter = 0;
};

export type ImportedGameFactoryOptions = {
  userId?: string;
  name?: string;
  storefront?: Storefront;
  storefrontGameId?: string;
  playtime?: number;
  playtimeWindows?: number;
  playtimeMac?: number;
  playtimeLinux?: number;
  lastPlayedAt?: Date | null;
  img_icon_url?: string;
  img_logo_url?: string;
  igdbMatchStatus?: IgdbMatchStatus;
};

export const createImportedGameData = (
  overrides: Partial<ImportedGameFactoryOptions> = {}
): ImportedGameFactoryOptions => {
  const uniqueId = ++importedGameCounter;
  const name = overrides.name || `${faker.commerce.productName()} ${uniqueId}`;

  return {
    name,
    storefront: overrides.storefront || "STEAM",
    storefrontGameId: overrides.storefrontGameId || faker.string.numeric(6),
    playtime: overrides.playtime ?? 0,
    playtimeWindows: overrides.playtimeWindows ?? 0,
    playtimeMac: overrides.playtimeMac ?? 0,
    playtimeLinux: overrides.playtimeLinux ?? 0,
    lastPlayedAt:
      overrides.lastPlayedAt === undefined ? null : overrides.lastPlayedAt,
    img_icon_url: overrides.img_icon_url || `icon_${uniqueId}.jpg`,
    img_logo_url: overrides.img_logo_url || `logo_${uniqueId}.jpg`,
    igdbMatchStatus: overrides.igdbMatchStatus || "PENDING",
    ...overrides,
  };
};

export const createSeededImportedGameData = (
  seed: number = 12345,
  overrides?: Partial<ImportedGameFactoryOptions>
): ReturnType<typeof createImportedGameData> => {
  seedFaker(seed);
  return createImportedGameData(overrides);
};

export const createImportedGame = async (
  options: ImportedGameFactoryOptions & { userId: string }
): Promise<ImportedGame> => {
  const data = createImportedGameData(options);

  if (!options.userId) {
    throw new Error("userId is required for createImportedGame");
  }

  return getTestDatabase().importedGame.create({
    data: {
      userId: options.userId,
      name: data.name!,
      storefront: data.storefront!,
      storefrontGameId: data.storefrontGameId,
      playtime: data.playtime,
      playtimeWindows: data.playtimeWindows,
      playtimeMac: data.playtimeMac,
      playtimeLinux: data.playtimeLinux,
      lastPlayedAt: data.lastPlayedAt,
      img_icon_url: data.img_icon_url,
      img_logo_url: data.img_logo_url,
      igdbMatchStatus: data.igdbMatchStatus,
    },
  });
};

export const createImportedGames = async (
  count: number,
  options: ImportedGameFactoryOptions & { userId: string }
): Promise<ImportedGame[]> => {
  const games = [];
  for (let i = 0; i < count; i++) {
    games.push(await createImportedGame(options));
  }
  return games;
};

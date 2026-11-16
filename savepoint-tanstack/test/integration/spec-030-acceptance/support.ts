import type { IsolatedDatabase } from "../../setup/isolated-db.ts";
import {
  steamLastPlayedDaysAgo,
  type IgdbCatalogueGame,
  type RawSteamGame,
} from "../storefront-sync/stubs.ts";

export const SPEC_TAG = "@spec: 030-background-storefront-import";

export const LONG_AGO = new Date("2024-01-01T00:00:00.000Z");

export const igdbGame = (id: number, name: string): IgdbCatalogueGame => ({
  id,
  name,
  slug: `${name.toLowerCase().replaceAll(" ", "-")}-${id}`,
  game_type: 0,
});

export const steamGame = (
  appid: number,
  name: string,
  options: { playtime?: number; lastPlayedDaysAgo?: number } = {}
): RawSteamGame => ({
  appid,
  name,
  playtime_forever: options.playtime ?? 0,
  ...(options.lastPlayedDaysAgo === undefined
    ? {}
    : { rtime_last_played: steamLastPlayedDaysAgo(options.lastPlayedDaysAgo) }),
});

export async function wipeSyncTables(db: IsolatedDatabase): Promise<void> {
  await db.prisma.libraryItem.deleteMany();
  await db.prisma.importJob.deleteMany();
  await db.prisma.importedGame.deleteMany();
  await db.prisma.game.deleteMany();
  await db.prisma.user.deleteMany();
}

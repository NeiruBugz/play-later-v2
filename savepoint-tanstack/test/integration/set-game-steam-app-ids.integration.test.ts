import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";

import { setGameSteamAppIds } from "@/entities/game/api/set-game-steam-app-ids.server";

import { createGame } from "../factories/index.ts";
import {
  setupIsolatedDatabase,
  type IsolatedDatabase,
} from "../setup/isolated-db.ts";

let db: IsolatedDatabase;

beforeAll(async () => {
  db = await setupIsolatedDatabase("set-game-steam-app-ids");
}, 60_000);

afterAll(async () => {
  await db?.teardown();
});

beforeEach(async () => {
  await db.prisma.game.deleteMany();
});

const steamAppIdOf = async (gameId: string) =>
  (await db.prisma.game.findUniqueOrThrow({ where: { id: gameId } }))
    .steamAppId;

describe("setGameSteamAppIds", () => {
  describe("given games without a Steam app id", () => {
    it("sets it on each", async () => {
      const a = await createGame(db.prisma);
      const b = await createGame(db.prisma);

      await setGameSteamAppIds([
        { gameId: a.id, steamAppId: 730 },
        { gameId: b.id, steamAppId: 440 },
      ]);

      expect(await steamAppIdOf(a.id)).toBe(730);
      expect(await steamAppIdOf(b.id)).toBe(440);
    });
  });

  describe("given a game that already has a Steam app id", () => {
    it("keeps the existing one", async () => {
      const game = await createGame(db.prisma, { steamAppId: 570 });

      await setGameSteamAppIds([{ gameId: game.id, steamAppId: 730 }]);

      expect(await steamAppIdOf(game.id)).toBe(570);
    });
  });

  describe("given the same game twice", () => {
    it("sets the first value without failing", async () => {
      const game = await createGame(db.prisma);

      await setGameSteamAppIds([
        { gameId: game.id, steamAppId: 730 },
        { gameId: game.id, steamAppId: 731 },
      ]);

      expect(await steamAppIdOf(game.id)).toBe(730);
    });
  });

  describe("given no pairs", () => {
    it("does nothing", async () => {
      await expect(setGameSteamAppIds([])).resolves.toBeUndefined();
    });
  });
});

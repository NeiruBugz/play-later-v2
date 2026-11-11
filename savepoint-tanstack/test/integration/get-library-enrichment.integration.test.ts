import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";

import { getLibrary } from "@/entities/library-item/api/get-library.server";

import {
  createGame,
  createLibraryItem,
  createUser,
} from "../factories/index.ts";
import {
  setupIsolatedDatabase,
  type IsolatedDatabase,
} from "../setup/isolated-db.ts";

let db: IsolatedDatabase;

beforeAll(async () => {
  db = await setupIsolatedDatabase("get-library-enrichment");
}, 60_000);

afterAll(async () => {
  await db?.teardown();
});

beforeEach(async () => {
  await db.prisma.libraryItem.deleteMany();
  await db.prisma.game.deleteMany();
  await db.prisma.user.deleteMany();
});

describe(getLibrary, () => {
  describe("given a library game with stored length and cover tint", () => {
    beforeEach(async () => {
      const user = await createUser(db.prisma);
      const game = await createGame(db.prisma, {
        timeToCreditsSeconds: 52_200,
        coverHue: 25,
        coverChroma: 0.14,
      });
      await createLibraryItem(db.prisma, {
        userId: user.id,
        gameId: game.id,
        status: "PLAYING",
      });
    });

    it("returns time to credits, hue and chroma on the game", async () => {
      const user = await db.prisma.user.findFirstOrThrow();

      const { items } = await getLibrary(user.id, {});

      expect(items[0]?.game).toMatchObject({
        timeToCreditsSeconds: 52_200,
        coverHue: 25,
        coverChroma: 0.14,
      });
    });
  });

  describe("given a library game that was never enriched", () => {
    beforeEach(async () => {
      const user = await createUser(db.prisma);
      const game = await createGame(db.prisma);
      await createLibraryItem(db.prisma, {
        userId: user.id,
        gameId: game.id,
        status: "WANT",
      });
    });

    it("returns null length and tint", async () => {
      const user = await db.prisma.user.findFirstOrThrow();

      const { items } = await getLibrary(user.id, {});

      expect(items[0]?.game).toMatchObject({
        timeToCreditsSeconds: null,
        coverHue: null,
        coverChroma: null,
      });
    });
  });
});

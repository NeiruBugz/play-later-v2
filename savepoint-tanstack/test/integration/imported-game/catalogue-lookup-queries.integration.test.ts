import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";

import { applyLookupResults } from "@/entities/imported-game/api/apply-lookup-results.server";
import { findLookupCandidates } from "@/entities/imported-game/api/find-lookup-candidates.server";
import { resolveImportedGamesFromCatalogue } from "@/entities/imported-game/api/resolve-imported-games-from-catalogue.server";

import {
  createGame,
  createLibraryItem,
  createUser,
} from "../../factories/index.ts";
import {
  setupIsolatedDatabase,
  type IsolatedDatabase,
} from "../../setup/isolated-db.ts";

let db: IsolatedDatabase;

beforeAll(async () => {
  db = await setupIsolatedDatabase("catalogue-lookup-queries");
}, 60_000);

afterAll(async () => {
  await db?.teardown();
});

const LONG_AGO = new Date("2024-01-01T00:00:00.000Z");

let aliceId: string;
let bobId: string;

const actions = {
  seedImportedGame: (
    storefrontGameId: string,
    overrides: Record<string, unknown> = {},
    userId = aliceId
  ) =>
    db.prisma.importedGame.create({
      data: {
        userId,
        storefront: "STEAM",
        storefrontGameId,
        name: `Seeded ${storefrontGameId}`,
        ...overrides,
      },
    }),
};

const elements = {
  importedGame: (id: string) =>
    db.prisma.importedGame.findUniqueOrThrow({ where: { id } }),
};

beforeEach(async () => {
  await db.prisma.libraryItem.deleteMany();
  await db.prisma.importedGame.deleteMany();
  await db.prisma.game.deleteMany();
  await db.prisma.user.deleteMany();
  aliceId = (await createUser(db.prisma)).id;
  bobId = (await createUser(db.prisma)).id;
});

describe("resolveImportedGamesFromCatalogue", () => {
  describe("given owned games whose Steam app id is already on a catalogue game", () => {
    it("links them, stamps lookedUpAt and returns how many it resolved", async () => {
      const cs2 = await createGame(db.prisma, { steamAppId: 730 });
      const row = await actions.seedImportedGame("730");
      await actions.seedImportedGame("999");

      const resolved = await resolveImportedGamesFromCatalogue(
        aliceId,
        "STEAM"
      );

      expect(resolved).toBe(1);
      const after = await elements.importedGame(row.id);
      expect(after.gameId).toBe(cs2.id);
      expect(after.lookedUpAt).toBeInstanceOf(Date);
    });

    it("leaves the unmatched rows untouched", async () => {
      await createGame(db.prisma, { steamAppId: 730 });
      const unmatched = await actions.seedImportedGame("999");

      await resolveImportedGamesFromCatalogue(aliceId, "STEAM");

      const after = await elements.importedGame(unmatched.id);
      expect(after.gameId).toBeNull();
      expect(after.lookedUpAt).toBeNull();
    });
  });

  describe("given two catalogue games carrying the same Steam app id", () => {
    it("picks the earliest created one", async () => {
      const older = await createGame(db.prisma, {
        steamAppId: 730,
        createdAt: new Date("2023-01-01T00:00:00.000Z"),
      });
      await createGame(db.prisma, {
        steamAppId: 730,
        createdAt: new Date("2024-06-01T00:00:00.000Z"),
      });
      const row = await actions.seedImportedGame("730");

      await resolveImportedGamesFromCatalogue(aliceId, "STEAM");

      expect((await elements.importedGame(row.id)).gameId).toBe(older.id);
    });
  });

  describe("given rows that must not be touched", () => {
    it("skips dismissed, already-added, soft-deleted, already-linked and other users' rows", async () => {
      await createGame(db.prisma, { steamAppId: 730 });
      const linked = await createGame(db.prisma);
      const ignored = await actions.seedImportedGame("730", {
        igdbMatchStatus: "IGNORED",
      });
      const matched = await actions.seedImportedGame("730", {
        igdbMatchStatus: "MATCHED",
        storefrontGameId: "731",
      });
      const deleted = await actions.seedImportedGame("730", {
        deletedAt: LONG_AGO,
        storefrontGameId: "732",
      });
      const alreadyLinked = await actions.seedImportedGame("733", {
        gameId: linked.id,
      });
      const otherUsers = await actions.seedImportedGame("730", {}, bobId);

      const resolved = await resolveImportedGamesFromCatalogue(
        aliceId,
        "STEAM"
      );

      expect(resolved).toBe(0);
      expect((await elements.importedGame(ignored.id)).gameId).toBeNull();
      expect((await elements.importedGame(matched.id)).gameId).toBeNull();
      expect((await elements.importedGame(deleted.id)).gameId).toBeNull();
      expect((await elements.importedGame(alreadyLinked.id)).gameId).toBe(
        linked.id
      );
      expect((await elements.importedGame(otherUsers.id)).gameId).toBeNull();
    });
  });

  describe("given a storefront id that is not a number", () => {
    it("ignores it instead of failing the whole resolution", async () => {
      await createGame(db.prisma, { steamAppId: 730 });
      await actions.seedImportedGame("not-a-number");
      await actions.seedImportedGame("99999999999999");
      await actions.seedImportedGame("730");

      expect(await resolveImportedGamesFromCatalogue(aliceId, "STEAM")).toBe(1);
    });
  });

  describe("given no rows", () => {
    it("resolves nothing", async () => {
      expect(await resolveImportedGamesFromCatalogue(aliceId, "STEAM")).toBe(0);
    });
  });
});

describe("findLookupCandidates", () => {
  describe("given a mix of rows", () => {
    let libraryGame: { id: string };
    let linkedGame: { id: string };

    beforeEach(async () => {
      libraryGame = await createGame(db.prisma);
      linkedGame = await createGame(db.prisma);
      await createLibraryItem(db.prisma, {
        userId: aliceId,
        gameId: libraryGame.id,
      });
      await actions.seedImportedGame("1", {
        id: "ig-1",
        playtime: 120,
        lastPlayedAt: LONG_AGO,
      });
      await actions.seedImportedGame("2", {
        id: "ig-2",
        lookedUpAt: LONG_AGO,
      });
      await actions.seedImportedGame("3", {
        id: "ig-3",
        gameId: linkedGame.id,
        lookedUpAt: LONG_AGO,
      });
      await actions.seedImportedGame("4", {
        id: "ig-4",
        gameId: libraryGame.id,
        lookedUpAt: LONG_AGO,
      });
      await actions.seedImportedGame("5", {
        id: "ig-5",
        igdbMatchStatus: "IGNORED",
      });
      await actions.seedImportedGame("6", {
        id: "ig-6",
        igdbMatchStatus: "MATCHED",
      });
      await actions.seedImportedGame("7", { id: "ig-7", deletedAt: LONG_AGO });
      await actions.seedImportedGame("8", { id: "ig-8" }, bobId);
    });

    it("returns only the rows that still need a lookup, including previous needs-a-match rows", async () => {
      const candidates = await findLookupCandidates(aliceId, "STEAM", {
        includeResolved: false,
      });

      expect(candidates.map((c) => c.id)).toEqual(["ig-1", "ig-2"]);
    });

    it("also returns linked rows that are not in the library when resolved rows are included", async () => {
      const candidates = await findLookupCandidates(aliceId, "STEAM", {
        includeResolved: true,
      });

      expect(candidates.map((c) => c.id)).toEqual(["ig-1", "ig-2", "ig-3"]);
    });

    it("exposes what the lookup and add-all need", async () => {
      const [first] = await findLookupCandidates(aliceId, "STEAM", {
        includeResolved: false,
      });

      expect(first).toEqual({
        id: "ig-1",
        storefrontGameId: "1",
        gameId: null,
        playtime: 120,
        lastPlayedAt: LONG_AGO,
      });
    });
  });
});

describe("applyLookupResults", () => {
  describe("given found and unfound rows", () => {
    it("links the found one and stamps lookedUpAt on both", async () => {
      const game = await createGame(db.prisma);
      const found = await actions.seedImportedGame("1");
      const unfound = await actions.seedImportedGame("2");

      await applyLookupResults([
        { id: found.id, gameId: game.id },
        { id: unfound.id, gameId: null },
      ]);

      const foundAfter = await elements.importedGame(found.id);
      const unfoundAfter = await elements.importedGame(unfound.id);
      expect(foundAfter.gameId).toBe(game.id);
      expect(foundAfter.lookedUpAt).toBeInstanceOf(Date);
      expect(unfoundAfter.gameId).toBeNull();
      expect(unfoundAfter.lookedUpAt).toBeInstanceOf(Date);
    });
  });

  describe("given a row that is already linked and a null result", () => {
    it("keeps the existing link", async () => {
      const game = await createGame(db.prisma);
      const row = await actions.seedImportedGame("1", { gameId: game.id });

      await applyLookupResults([{ id: row.id, gameId: null }]);

      expect((await elements.importedGame(row.id)).gameId).toBe(game.id);
    });
  });

  describe("given no rows", () => {
    it("does nothing", async () => {
      await expect(applyLookupResults([])).resolves.toBeUndefined();
    });
  });
});

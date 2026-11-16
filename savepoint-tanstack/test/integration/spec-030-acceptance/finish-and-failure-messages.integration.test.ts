/**
 * @spec: 030-background-storefront-import
 * @regression
 *
 * What the person is told when a sync ends (functional spec 2.5, 2.6): the real
 * pipeline writes the job, the status read reports it, and the wording the app
 * shows is derived from that status exactly as the UI does
 * (`formatSyncSummary`, `syncFailureMessage`). Steam and IGDB are stubbed.
 */
import {
  afterAll,
  afterEach,
  beforeAll,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from "vitest";

import { findImportedGamesForUser } from "@/entities/imported-game/api/find-imported-games-for-user.server";
import { getSteamSyncStatusWorker } from "@/features/storefront-sync/api/get-sync-status.worker";
import { drainInlineSyncQueue } from "@/features/storefront-sync/api/inline-queue";
import { markSyncNoticeSeenWorker } from "@/features/storefront-sync/api/mark-notice-seen.worker";
import { startSteamSyncWorker } from "@/features/storefront-sync/api/start-sync.worker";
import {
  formatSyncSummary,
  syncFailureMessage,
} from "@/features/storefront-sync/lib";
import type { SteamSyncStatus } from "@/features/storefront-sync/model/types";
import { igdbFetch } from "@/shared/api/igdb/fetch";

import {
  createGame,
  createLibraryItem,
  createUser,
} from "../../factories/index.ts";
import {
  setupIsolatedDatabase,
  type IsolatedDatabase,
} from "../../setup/isolated-db.ts";
import {
  externalGamesResponder,
  STEAM_ID_64,
  stubSteam,
  stubSteamBody,
  stubSteamHttpStatus,
  stubSteamNetworkFailure,
} from "../storefront-sync/stubs.ts";
import { igdbGame, LONG_AGO, steamGame, wipeSyncTables } from "./support.ts";

vi.hoisted(() => {
  process.env.STOREFRONT_SYNC_QUEUE = "inline";
});

vi.mock("@/shared/api/igdb/fetch", () => ({ igdbFetch: vi.fn() }));

const igdbFetchMock = vi.mocked(igdbFetch);

let db: IsolatedDatabase;

beforeAll(async () => {
  db = await setupIsolatedDatabase("spec-030-messages");
}, 60_000);

afterAll(async () => {
  await db?.teardown();
});

let aliceId: string;

const elements = {
  status: async (): Promise<SteamSyncStatus> => {
    const status = await getSteamSyncStatusWorker(aliceId);
    if (!status) throw new Error("expected a sync to have run");
    return status;
  },
  finishMessage: async () => formatSyncSummary(await elements.status()),
  failureMessage: async () =>
    syncFailureMessage((await elements.status()).failureCode),
  importPageNames: async () =>
    (await findImportedGamesForUser(aliceId, { limit: 100 })).games
      .map((game) => game.name)
      .sort(),
  importedGames: () =>
    db.prisma.importedGame.findMany({
      where: { userId: aliceId },
      orderBy: { storefrontGameId: "asc" },
    }),
};

const actions = {
  sync: async (addAllToLibrary = false) => {
    const { jobId } = await startSteamSyncWorker(aliceId, { addAllToLibrary });
    await drainInlineSyncQueue();
    return jobId;
  },
  knowCatalogue: (appIds: number[]) =>
    igdbFetchMock.mockImplementation(
      externalGamesResponder(
        Object.fromEntries(
          appIds.map((appId) => [
            appId,
            igdbGame(9500 + appId, `Catalogue ${appId}`),
          ])
        )
      )
    ),
  seedEarlierImport: () =>
    db.prisma.importedGame.createMany({
      data: [11, 12].map((appId) => ({
        userId: aliceId,
        storefront: "STEAM" as const,
        storefrontGameId: String(appId),
        name: `Earlier game ${appId}`,
        createdAt: LONG_AGO,
      })),
    }),
};

beforeEach(async () => {
  igdbFetchMock.mockReset();
  igdbFetchMock.mockImplementation(externalGamesResponder({}));
  await wipeSyncTables(db);
  aliceId = (await createUser(db.prisma, { steamId64: STEAM_ID_64 })).id;
});

afterEach(async () => {
  await drainInlineSyncQueue();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe("@spec: 030-background-storefront-import @regression the finish message of a real sync (2.5.1)", () => {
  describe("given a first sync that brings in exactly one game the catalogue knows", () => {
    beforeEach(async () => {
      actions.knowCatalogue([1]);
      stubSteam([steamGame(1, "Only Game")]);
      await actions.sync();
    });

    it("reads '1 new game' and says nothing about matches", async () => {
      expect(await elements.finishMessage()).toBe("1 new game");
    });
  });

  describe("given a library of three games synced a second time with nothing new", () => {
    beforeEach(async () => {
      actions.knowCatalogue([1, 2, 3]);
      stubSteam([1, 2, 3].map((appId) => steamGame(appId, `Game ${appId}`)));
      await actions.sync();
      await actions.sync();
    });

    it("has no 'new games' part rather than repeating the library's size as new", async () => {
      expect(await elements.finishMessage()).toBe("3 already on your list");
    });
  });

  describe("given an earlier import of two games, then a ticked sync that finds a third and cannot place a fourth", () => {
    beforeEach(async () => {
      await actions.seedEarlierImport();
      actions.knowCatalogue([11, 12, 13]);
      stubSteam([
        steamGame(11, "Game 11"),
        steamGame(12, "Game 12"),
        steamGame(13, "Game 13"),
        steamGame(14, "Game 14"),
      ]);
      await actions.sync(true);
    });

    it("joins the non-empty parts with ' · ', counting the added games among the others", async () => {
      expect(await elements.finishMessage()).toBe(
        "2 new games · 2 already on your list · 3 added to your library · 1 needs a match"
      );
    });
  });

  describe("given an unticked sync of the same library", () => {
    beforeEach(async () => {
      await actions.seedEarlierImport();
      actions.knowCatalogue([11, 12, 13]);
      stubSteam([
        steamGame(11, "Game 11"),
        steamGame(12, "Game 12"),
        steamGame(13, "Game 13"),
        steamGame(14, "Game 14"),
      ]);
      await actions.sync(false);
    });

    it("leaves the 'added to your library' part out entirely", async () => {
      expect(await elements.finishMessage()).toBe(
        "2 new games · 2 already on your list · 1 needs a match"
      );
    });
  });

  describe("given games that are already in the library", () => {
    beforeEach(async () => {
      const game = await createGame(db.prisma, { steamAppId: 1 });
      await createLibraryItem(db.prisma, {
        userId: aliceId,
        gameId: game.id,
        status: "WANT",
        createdAt: LONG_AGO,
      });
      stubSteam([steamGame(1, "Already Tracked")]);
      await actions.sync();
    });

    it("does not count them as new", async () => {
      expect(await elements.finishMessage()).toBe("");
    });
  });
});

describe("@spec: 030-background-storefront-import @regression a message is shown once, the latest one (2.5.2, 2.6.3)", () => {
  describe("given two syncs ended while the person was away", () => {
    let firstJobId: string;
    let secondJobId: string;

    beforeEach(async () => {
      actions.knowCatalogue([1, 2]);
      stubSteam([steamGame(1, "Game 1")]);
      firstJobId = await actions.sync();
      stubSteam([steamGame(1, "Game 1"), steamGame(2, "Game 2")]);
      secondJobId = await actions.sync();
    });

    it("waits with only the most recent sync's result, unseen", async () => {
      expect(await elements.status()).toMatchObject({
        jobId: secondJobId,
        status: "FINISHED",
        noticeSeen: false,
        newGames: 1,
      });
    });

    describe("when the person closes it on one device", () => {
      beforeEach(async () => {
        await markSyncNoticeSeenWorker(aliceId, { jobId: secondJobId });
      });

      it("is not shown again when they open SavePoint on any device", async () => {
        expect((await elements.status()).noticeSeen).toBe(true);
      });

      it("does not resurrect the older sync's result either", async () => {
        const older = await db.prisma.importJob.findUniqueOrThrow({
          where: { id: firstJobId },
        });

        expect(older.noticeSeenAt).not.toBeNull();
      });
    });
  });

  describe("given a sync that failed while the person was away", () => {
    let failedJobId: string;

    beforeEach(async () => {
      stubSteamHttpStatus(503);
      failedJobId = await actions.sync();
    });

    it("waits as an unseen 'failed' result with its reason", async () => {
      expect(await elements.status()).toMatchObject({
        jobId: failedJobId,
        status: "FAILED",
        noticeSeen: false,
      });
      expect(await elements.failureMessage()).toBe(
        "Steam is temporarily unavailable. Please try again later."
      );
    });

    it("is shown once: closing it marks it seen", async () => {
      await markSyncNoticeSeenWorker(aliceId, { jobId: failedJobId });

      expect((await elements.status()).noticeSeen).toBe(true);
    });
  });
});

describe("@spec: 030-background-storefront-import @regression what Steam can answer, and the words the person reads (2.6.1, 2.6.2)", () => {
  const PRIVACY_MESSAGE =
    "We couldn't see any games on your Steam account. If you own games, open Steam → Privacy Settings, set 'Game details' to Public, and untick 'Always keep my total playtime private'. Steam can take a few minutes to apply the change — then sync again.";

  describe.each([
    {
      steamSays: "a private library with no response body",
      stub: () => stubSteamBody({ response: {} }),
      message: PRIVACY_MESSAGE,
    },
    {
      steamSays: "a game count with the games hidden",
      stub: () => stubSteamBody({ response: { game_count: 42 } }),
      message: PRIVACY_MESSAGE,
    },
    {
      steamSays: "an account that owns no games",
      stub: () => stubSteamBody({ response: { game_count: 0, games: [] } }),
      message: PRIVACY_MESSAGE,
    },
    {
      steamSays: "HTTP 503",
      stub: () => stubSteamHttpStatus(503),
      message: "Steam is temporarily unavailable. Please try again later.",
    },
    {
      steamSays: "no response at all",
      stub: () => stubSteamNetworkFailure(),
      message: "Steam is temporarily unavailable. Please try again later.",
    },
    {
      steamSays: "HTTP 429",
      stub: () => stubSteamHttpStatus(429),
      message:
        "Too many requests to Steam. Please wait a moment and try again.",
    },
  ])("given Steam answers with $steamSays", ({ stub, message }) => {
    let importedBefore: Awaited<ReturnType<typeof elements.importedGames>>;

    beforeEach(async () => {
      await actions.seedEarlierImport();
      importedBefore = await elements.importedGames();
      stub();
      await actions.sync();
    });

    it("fails the sync with the spec's message, never '0 games imported'", async () => {
      expect(await elements.status()).toMatchObject({ status: "FAILED" });
      expect(await elements.failureMessage()).toBe(message);
    });

    it("leaves the import page's games unchanged", async () => {
      expect(await elements.importedGames()).toEqual(importedBefore);
    });

    it("lets the person sync again straight away", async () => {
      stubSteam([steamGame(11, "Game 11")]);

      await actions.sync();

      expect((await elements.status()).status).toBe("FINISHED");
    });
  });

  // FINDING (spec 2.6.1, "If Steam returns games without time played, the sync
  // succeeds and those games show 'Never played', with Want as their suggested
  // status"): FAILS today. `OwnedGameRawSchema` in
  // `src/shared/api/steam/steam-fetch.ts` requires `playtime_forever`, so a game
  // without it is a schema-drift UpstreamError and the whole sync fails
  // (UNKNOWN) instead of succeeding. Fix in the implementation: make
  // `playtime_forever` optional (default 0) in the raw schema.
  describe("[FINDING] given Steam returns games without any time played", () => {
    beforeEach(async () => {
      stubSteamBody({
        response: {
          game_count: 2,
          games: [
            { appid: 61, name: "Playtime Hidden One" },
            { appid: 62, name: "Playtime Hidden Two" },
          ],
        },
      });
      actions.knowCatalogue([61, 62]);
      await actions.sync(true);
    });

    it("succeeds instead of failing the sync", async () => {
      expect((await elements.status()).status).toBe("FINISHED");
    });

    it("shows the games as never played", async () => {
      expect(
        (await elements.importedGames()).map((row) => row.playtime)
      ).toEqual([0, 0]);
    });

    it("suggests Want, so an add-all sync adds them as Want", async () => {
      expect(
        (
          await db.prisma.libraryItem.findMany({ where: { userId: aliceId } })
        ).map((item) => item.status)
      ).toEqual(["WANT", "WANT"]);
    });
  });
});

describe("@spec: 030-background-storefront-import @regression a sync that stopped moving (2.6.4)", () => {
  describe("given a sync that has shown no change for 31 minutes", () => {
    beforeEach(async () => {
      const job = await db.prisma.importJob.create({
        data: {
          userId: aliceId,
          storefront: "STEAM",
          storefrontAccountId: STEAM_ID_64,
          status: "LOOKING_UP",
        },
      });
      await db.prisma.$executeRaw`
        UPDATE "ImportJob"
        SET "createdAt" = now() - make_interval(mins => 32),
            "updatedAt" = now() - make_interval(mins => 31)
        WHERE "id" = ${job.id}
      `;
    });

    it("reads 'Steam sync stopped unexpectedly. Please sync again.'", async () => {
      expect(await elements.failureMessage()).toBe(
        "Steam sync stopped unexpectedly. Please sync again."
      );
    });

    it("lets the person press Sync and start a new sync", async () => {
      stubSteam([steamGame(1, "Game 1")]);

      await actions.sync();

      expect((await elements.status()).status).toBe("FINISHED");
    });
  });
});

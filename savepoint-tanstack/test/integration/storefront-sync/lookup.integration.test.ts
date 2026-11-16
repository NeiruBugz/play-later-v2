/**
 * RED integration tests for spec 030 Slice 2: every owned game is looked up in
 * the catalogue (locally first, then IGDB), found games link to their `Game`,
 * the rest become "needs a match", and the imported-games read hides games that
 * are already in the library.
 *
 * CONTRACT (implementers build against exactly this; paths are under src/)
 *
 *   Prisma (one additive migration)
 *     ImportedGame.gameId     String?   FK -> Game, onDelete SetNull, indexed
 *     ImportedGame.lookedUpAt DateTime? null = not looked up yet
 *                                       set + gameId        = found
 *                                       set + gameId = null = needs a match
 *     ImportedGame.game       Game?     the relation field is named `game`
 *     Game @@index([steamAppId])        NOT unique
 *
 *   shared/api/queue/types.ts
 *     SyncQueueName = "gather" | "enrich"
 *     gather sends every enrich message with `queue.send("enrich", message)`,
 *     one call per chunk; `message` satisfies enrichMessageSchema
 *     (features/storefront-sync/model/messages.ts, already built).
 *
 *   features/storefront-sync/api/inline-queue.ts
 *     The inline queue routes "enrich" bodies to runEnrichMessage with
 *     receiveCount 1 (and "gather" to runGatherMessage as today).
 *     drainInlineSyncQueue() still resolves only when both queues are idle.
 *
 *   features/storefront-sync/api/gather.worker.ts  runGatherMessage (Slice 2)
 *     1. claim, fetch Steam, upsertImportedGamesBatch (as in Slice 1)
 *     2. local resolution: live, not-IGNORED, not-MATCHED rows with gameId null
 *        whose storefrontGameId equals some Game.steamAppId get
 *        gameId = that Game (DISTINCT ON steamAppId, earliest createdAt) and
 *        lookedUpAt = now()
 *     3. candidates = live, not-IGNORED, not-MATCHED rows that are not in the
 *        user's library by gameId, ordered by id. Rows with gameId IS NULL
 *        (never looked up, or previously needs-a-match) need a lookup.
 *     4. chunks of <= 200 rows needing a lookup, in id order; chunk i carries
 *        { v: 1, jobId, chunkIndex: i, importedGameIds, lookupCount }
 *        where lookupCount = importedGameIds.length while add-all is off
 *     5. recordGatherPlan({ totalToLookUp: candidates, lookedUp: locally
 *        resolved candidates, refreshedGames, totalChunks }) BEFORE sending
 *     6. zero chunks -> the job finishes at once (recordGatherPlan already does)
 *
 *   features/storefront-sync/api/enrich.worker.ts
 *     runEnrichMessage(args: { message: EnrichMessage; receiveCount: number }): Promise<void>
 *     - drops the message unless the job is LOOKING_UP (no IGDB call, no writes)
 *     - keeps only the chunk's rows that still need a lookup (gameId IS NULL,
 *       live, owned by the job's user), asks IGDB ONCE:
 *         matchSteamGamesByAppIds(storefrontGameIds)
 *     - found:   upsertGamesFromIgdbBatch + setGameSteamAppIds (only where
 *                Game.steamAppId IS NULL) + applyLookupResults -> gameId, lookedUpAt
 *     - unfound: lookedUpAt = now(), gameId stays null
 *     - recordChunkDone marks the chunk index and adds lookupCount to
 *       `lookedUp` in ONE atomic UPDATE guarded by the chunk-index marker, then
 *       finalizeImportJobIfComplete runs
 *     - receiveCount < SYNC_MAX_RECEIVE_COUNT: an IGDB failure is THROWN so the
 *       queue retries; nothing is written
 *     - receiveCount >= SYNC_MAX_RECEIVE_COUNT (env, optional, default 3): no
 *       IGDB call; every row that needs a lookup becomes needs-a-match, the chunk
 *       is recorded done and the job can finish
 *
 *   shared/api/igdb/match-steam-games.ts
 *     matchSteamGamesByAppIds(appIds: string[]): Promise<Map<string, SearchResponseItem>>
 *     keyed by Steam app id; unfound ids are absent (see its unit test)
 *
 *   entities/game/api/upsert-games-from-igdb-batch.server.ts
 *     upsertGamesFromIgdbBatch(payloads: SearchResponseItem[]): Promise<Map<number, string>>
 *     igdbId -> Game.id; creates missing Games (title, slug, cover URL, release date as
 *     upsertGameFromIgdbPayload does today), leaves existing ones alone
 *
 *   entities/game/api/set-game-steam-app-ids.server.ts
 *     setGameSteamAppIds(pairs: Array<{ gameId: string; steamAppId: number }>): Promise<void>
 *     UPDATE ... WHERE steamAppId IS NULL
 *
 *   entities/imported-game/model/types.ts
 *     ImportedGameWithGame = ImportedGame & {
 *       game: { title: string; coverImage: string | null; releaseDate: Date | null } | null
 *     }
 *     PaginatedImportedGames.games: ImportedGameWithGame[]
 *
 *   entities/imported-game/api/find-imported-games-for-user.server.ts
 *     findImportedGamesForUser(userId, options) joins `game` (title, coverImage,
 *     releaseDate) and excludes rows whose gameId is a game in THAT user's library;
 *     rows with gameId null are kept; `total` / `totalPages` agree with the filter.
 *
 *   features/steam-import/api/import-game-to-library.worker.ts
 *     importGameToLibraryWorker for a row with gameId set and no manualIgdbId
 *     adds that catalogue game directly (no Steam -> IGDB re-match, never
 *     NeedsManualMatchError). See import-found-game.integration.test.ts.
 *
 * Out of scope here (later slices): add-all, summary counts (newGames /
 * needsMatch / refreshedGames), notice, failure mapping.
 *
 * Steam is stubbed at the HTTP edge, IGDB at `src/shared/api/igdb/fetch.ts`
 * (see ./stubs.ts). Enrich messages are intercepted by spying on the inline
 * queue's `send` when a test needs to deliver them by hand.
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
import { runEnrichMessage } from "@/features/storefront-sync/api/enrich.worker";
import { getSteamSyncStatusWorker } from "@/features/storefront-sync/api/get-sync-status.worker";
import {
  drainInlineSyncQueue,
  inlineSyncQueue,
} from "@/features/storefront-sync/api/inline-queue";
import { startSteamSyncWorker } from "@/features/storefront-sync/api/start-sync.worker";
import {
  enrichMessageSchema,
  type EnrichMessage,
} from "@/features/storefront-sync/model/messages";
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
  makeOwnedGames,
  requestedSteamAppIds,
  STEAM_ID_64,
  stubSteam,
  THREE_GAMES,
  type IgdbCatalogueGame,
} from "./stubs.ts";

vi.hoisted(() => {
  process.env.STOREFRONT_SYNC_QUEUE = "inline";
});

vi.mock("@/shared/api/igdb/fetch", () => ({ igdbFetch: vi.fn() }));

const igdbFetchMock = vi.mocked(igdbFetch);

let db: IsolatedDatabase;

beforeAll(async () => {
  db = await setupIsolatedDatabase("storefront-sync-lookup");
}, 60_000);

afterAll(async () => {
  await db?.teardown();
});

const DEFAULT_MAX_RECEIVE_COUNT = 3;
const LONG_AGO = new Date("2024-01-01T00:00:00.000Z");

const COUNTER_STRIKE: IgdbCatalogueGame = {
  id: 7003,
  name: "Counter-Strike 2",
  slug: "counter-strike-2",
  first_release_date: 1347494400,
  cover: { image_id: "co1abc" },
  game_type: 0,
};
const TEAM_FORTRESS: IgdbCatalogueGame = {
  id: 7001,
  name: "Team Fortress 2",
  slug: "team-fortress-2",
  game_type: 0,
};
const DOTA: IgdbCatalogueGame = {
  id: 7002,
  name: "Dota 2",
  slug: "dota-2",
  game_type: 0,
};

let aliceId: string;

const elements = {
  findImportedGame: (storefrontGameId: string) =>
    db.prisma.importedGame.findFirstOrThrow({
      where: { userId: aliceId, storefront: "STEAM", storefrontGameId },
    }),
  findGameByIgdbId: (igdbId: number) =>
    db.prisma.game.findUniqueOrThrow({ where: { igdbId } }),
  findImportJob: (jobId: string) =>
    db.prisma.importJob.findUniqueOrThrow({ where: { id: jobId } }),
  findImportedGameIds: async (...storefrontGameIds: string[]) =>
    (
      await db.prisma.importedGame.findMany({
        where: { userId: aliceId, storefrontGameId: { in: storefrontGameIds } },
        select: { id: true },
      })
    )
      .map((row) => row.id)
      .sort(),
  igdbRequestedIds: (callIndex: number) =>
    requestedSteamAppIds(String(igdbFetchMock.mock.calls[callIndex]?.[1])),
  syncStatus: () => getSteamSyncStatusWorker(aliceId),
};

const actions = {
  sync: async () => {
    const { jobId } = await startSteamSyncWorker(aliceId, {
      addAllToLibrary: false,
    });
    await drainInlineSyncQueue();
    return jobId;
  },
  /** Runs gather but keeps the enrich messages for the test to deliver by hand. */
  syncHoldingEnrichMessages: async () => {
    const held: EnrichMessage[] = [];
    const deliverNow = inlineSyncQueue.send.bind(inlineSyncQueue);
    vi.spyOn(inlineSyncQueue, "send").mockImplementation(
      async (queue, body) => {
        if (queue === "enrich") {
          held.push(enrichMessageSchema.parse(body));
          return;
        }
        await deliverNow(queue, body);
      }
    );
    const { jobId } = await startSteamSyncWorker(aliceId, {
      addAllToLibrary: false,
    });
    await drainInlineSyncQueue();
    held.sort((a, b) => a.chunkIndex - b.chunkIndex);
    return { jobId, held };
  },
  seedImportedGame: (
    storefrontGameId: string,
    overrides: Record<string, unknown> = {}
  ) =>
    db.prisma.importedGame.create({
      data: {
        userId: aliceId,
        storefront: "STEAM",
        storefrontGameId,
        name: `Seeded ${storefrontGameId}`,
        createdAt: LONG_AGO,
        ...overrides,
      },
    }),
};

beforeEach(async () => {
  igdbFetchMock.mockReset();
  igdbFetchMock.mockImplementation(externalGamesResponder({}));
  await db.prisma.libraryItem.deleteMany();
  await db.prisma.importJob.deleteMany();
  await db.prisma.importedGame.deleteMany();
  await db.prisma.game.deleteMany();
  await db.prisma.user.deleteMany();
  aliceId = (await createUser(db.prisma, { steamId64: STEAM_ID_64 })).id;
});

afterEach(async () => {
  await drainInlineSyncQueue();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe("gather: what the catalogue already knows", () => {
  describe("given one of three owned games is already in the catalogue by Steam app id", () => {
    let knownGameId: string;
    let held: EnrichMessage[];
    let jobId: string;

    beforeEach(async () => {
      knownGameId = (
        await createGame(db.prisma, {
          igdbId: 7003,
          title: "Counter-Strike 2",
          slug: "counter-strike-2",
          steamAppId: 730,
        })
      ).id;
      stubSteam(THREE_GAMES);
      ({ jobId, held } = await actions.syncHoldingEnrichMessages());
    });

    it("links the known game to its imported row", async () => {
      const row = await elements.findImportedGame("730");

      expect(row.gameId).toBe(knownGameId);
      expect(row.lookedUpAt).not.toBeNull();
    });

    it("leaves the unknown games not looked up yet", async () => {
      const rows = [
        await elements.findImportedGame("440"),
        await elements.findImportedGame("570"),
      ];

      expect(rows.map((r) => [r.gameId, r.lookedUpAt])).toEqual([
        [null, null],
        [null, null],
      ]);
    });

    it("counts the known game as looked up straight away", async () => {
      expect(await elements.syncStatus()).toMatchObject({
        jobId,
        status: "LOOKING_UP",
        totalToLookUp: 3,
        lookedUp: 1,
      });
    });

    it("sends the two unknown games as a single chunk", async () => {
      expect(held).toHaveLength(1);
      expect(held[0]).toMatchObject({
        v: 1,
        jobId,
        chunkIndex: 0,
        lookupCount: 2,
      });
      expect([...(held[0]?.importedGameIds ?? [])].sort()).toEqual(
        await elements.findImportedGameIds("440", "570")
      );
    });

    it("has not asked IGDB anything yet", () => {
      expect(igdbFetchMock).not.toHaveBeenCalled();
    });
  });

  describe("given every owned game is already in the catalogue", () => {
    let jobId: string;

    beforeEach(async () => {
      for (const [index, game] of THREE_GAMES.entries()) {
        await createGame(db.prisma, {
          igdbId: 8000 + index,
          slug: `known-${game.appid}`,
          steamAppId: game.appid,
        });
      }
      stubSteam(THREE_GAMES);
      jobId = await actions.sync();
    });

    it("finishes the job at once with everything counted as looked up", async () => {
      expect(await elements.syncStatus()).toMatchObject({
        jobId,
        status: "FINISHED",
        totalToLookUp: 3,
        lookedUp: 3,
      });
    });

    it("never asks IGDB", () => {
      expect(igdbFetchMock).not.toHaveBeenCalled();
    });
  });

  describe("given removed, already-added and in-library games among the owned games", () => {
    let held: EnrichMessage[];

    beforeEach(async () => {
      const libraryGame = await createGame(db.prisma, { igdbId: 8100 });
      await createLibraryItem(db.prisma, {
        userId: aliceId,
        gameId: libraryGame.id,
      });
      await actions.seedImportedGame("440", { igdbMatchStatus: "IGNORED" });
      await actions.seedImportedGame("570", { igdbMatchStatus: "MATCHED" });
      await actions.seedImportedGame("620", {
        gameId: libraryGame.id,
        lookedUpAt: LONG_AGO,
      });
      stubSteam([
        { appid: 730, name: "Counter-Strike 2", playtime_forever: 0 },
        { appid: 440, name: "Team Fortress 2", playtime_forever: 0 },
        { appid: 570, name: "Dota 2", playtime_forever: 0 },
        { appid: 620, name: "Portal 2", playtime_forever: 0 },
      ]);
      ({ held } = await actions.syncHoldingEnrichMessages());
    });

    it("plans a lookup for the new game only", async () => {
      expect((await elements.syncStatus())?.totalToLookUp).toBe(1);
      expect(held.map((m) => m.lookupCount)).toEqual([1]);
    });

    it("sends only that game for lookup", async () => {
      expect(held[0]?.importedGameIds).toEqual(
        await elements.findImportedGameIds("730")
      );
    });
  });

  describe("given 450 owned games that the catalogue does not know", () => {
    let held: EnrichMessage[];
    let jobId: string;

    beforeEach(async () => {
      stubSteam(makeOwnedGames(450));
      ({ jobId, held } = await actions.syncHoldingEnrichMessages());
    });

    it("splits them into chunks of at most 200, numbered in order", () => {
      expect(held.map((m) => [m.chunkIndex, m.importedGameIds.length])).toEqual(
        [
          [0, 200],
          [1, 200],
          [2, 50],
        ]
      );
    });

    it("tells each chunk how many games it has to look up", () => {
      expect(held.map((m) => m.lookupCount)).toEqual([200, 200, 50]);
    });

    it("puts every game in exactly one chunk", async () => {
      const sent = held.flatMap((m) => m.importedGameIds).sort();

      expect(sent).toEqual(
        await db.prisma.importedGame
          .findMany({ where: { userId: aliceId }, select: { id: true } })
          .then((rows) => rows.map((r) => r.id).sort())
      );
    });

    it("records the plan before anything is looked up", async () => {
      expect(await elements.findImportJob(jobId)).toMatchObject({
        status: "LOOKING_UP",
        totalToLookUp: 450,
        lookedUp: 0,
        totalChunks: 3,
      });
    });
  });
});

describe("enrich: looking games up in IGDB through the inline queue", () => {
  describe("given IGDB knows all three games, two of them already in the catalogue", () => {
    let jobId: string;
    let teamFortressId: string;
    let dotaId: string;

    beforeEach(async () => {
      teamFortressId = (
        await createGame(db.prisma, {
          igdbId: 7001,
          title: "Team Fortress 2",
          slug: "team-fortress-2",
          steamAppId: null,
        })
      ).id;
      dotaId = (
        await createGame(db.prisma, {
          igdbId: 7002,
          title: "Dota 2",
          slug: "dota-2",
          steamAppId: 999,
        })
      ).id;
      igdbFetchMock.mockImplementation(
        externalGamesResponder({
          "730": COUNTER_STRIKE,
          "440": TEAM_FORTRESS,
          "570": DOTA,
        })
      );
      stubSteam(THREE_GAMES);
      jobId = await actions.sync();
    });

    it("asks IGDB once, for all three Steam app ids", () => {
      expect(igdbFetchMock).toHaveBeenCalledTimes(1);
      expect(igdbFetchMock.mock.calls[0]?.[0]).toBe("/external_games");
      expect(elements.igdbRequestedIds(0).sort()).toEqual([
        "440",
        "570",
        "730",
      ]);
    });

    it("links every imported game to its catalogue game", async () => {
      const counterStrike = await elements.findGameByIgdbId(7003);

      expect(
        (
          await Promise.all(
            ["730", "440", "570"].map(elements.findImportedGame)
          )
        ).map((row) => [row.gameId, row.lookedUpAt !== null])
      ).toEqual([
        [counterStrike.id, true],
        [teamFortressId, true],
        [dotaId, true],
      ]);
    });

    it("adds the game IGDB knows that the catalogue lacked", async () => {
      expect(await elements.findGameByIgdbId(7003)).toMatchObject({
        title: "Counter-Strike 2",
        slug: "counter-strike-2",
        releaseDate: new Date("2012-09-13T00:00:00.000Z"),
      });
      expect((await elements.findGameByIgdbId(7003)).coverImage).toContain(
        "co1abc"
      );
    });

    it("records the Steam app id on a game that had none", async () => {
      expect((await elements.findGameByIgdbId(7001)).steamAppId).toBe(440);
      expect((await elements.findGameByIgdbId(7003)).steamAppId).toBe(730);
    });

    it("keeps the Steam app id a game already had", async () => {
      expect((await elements.findGameByIgdbId(7002)).steamAppId).toBe(999);
    });

    it("finishes the job with every game counted as looked up", async () => {
      expect(await elements.syncStatus()).toMatchObject({
        jobId,
        status: "FINISHED",
        totalToLookUp: 3,
        lookedUp: 3,
      });
    });

    it("shows the catalogue game on the imported games list", async () => {
      const { games } = await findImportedGamesForUser(aliceId);
      const counterStrike = games.find((g) => g.storefrontGameId === "730");

      expect(counterStrike?.game).toMatchObject({
        title: "Counter-Strike 2",
        releaseDate: new Date("2012-09-13T00:00:00.000Z"),
      });
      expect(counterStrike?.game?.coverImage).toContain("co1abc");
    });
  });

  describe("given IGDB knows only one game, has an id with no game, and has never heard of the third", () => {
    let jobId: string;

    beforeEach(async () => {
      igdbFetchMock.mockImplementation(
        externalGamesResponder({ "730": COUNTER_STRIKE, "570": null })
      );
      stubSteam(THREE_GAMES);
      jobId = await actions.sync();
    });

    it("links the known game", async () => {
      const row = await elements.findImportedGame("730");

      expect(row.gameId).not.toBeNull();
    });

    it.each(["440", "570"])(
      "marks Steam game %s as looked up with no match",
      async (appId) => {
        const row = await elements.findImportedGame(appId);

        expect(row.gameId).toBeNull();
        expect(row.lookedUpAt).not.toBeNull();
      }
    );

    it("still finishes the job with everything counted as looked up", async () => {
      expect(await elements.syncStatus()).toMatchObject({
        jobId,
        status: "FINISHED",
        totalToLookUp: 3,
        lookedUp: 3,
      });
    });

    describe("when the user syncs again and IGDB now knows one of the unmatched games", () => {
      beforeEach(async () => {
        igdbFetchMock.mockClear();
        igdbFetchMock.mockImplementation(
          externalGamesResponder({
            "730": COUNTER_STRIKE,
            "440": TEAM_FORTRESS,
            "570": null,
          })
        );
        await actions.sync();
      });

      it("looks the unmatched games up again and links the one that is now known", async () => {
        expect((await elements.findImportedGame("440")).gameId).not.toBeNull();
      });

      it("keeps the game IGDB still cannot place as needing a match", async () => {
        expect((await elements.findImportedGame("570")).gameId).toBeNull();
      });

      it("does not ask about the game that was already found", () => {
        expect(elements.igdbRequestedIds(0).sort()).toEqual(["440", "570"]);
      });
    });
  });

  describe("given a chunk is delivered twice while another chunk is still outstanding", () => {
    let jobId: string;
    let held: EnrichMessage[];

    beforeEach(async () => {
      stubSteam(makeOwnedGames(201));
      ({ jobId, held } = await actions.syncHoldingEnrichMessages());
      await runEnrichMessage({ message: held[0]!, receiveCount: 1 });
      await runEnrichMessage({ message: held[0]!, receiveCount: 2 });
    });

    it("counts that chunk's games only once", async () => {
      expect(await elements.syncStatus()).toMatchObject({
        jobId,
        status: "LOOKING_UP",
        totalToLookUp: 201,
        lookedUp: 200,
      });
    });

    describe("when the other chunk is then delivered", () => {
      beforeEach(async () => {
        await runEnrichMessage({ message: held[1]!, receiveCount: 1 });
      });

      it("finishes the job with every game counted exactly once", async () => {
        expect(await elements.syncStatus()).toMatchObject({
          status: "FINISHED",
          totalToLookUp: 201,
          lookedUp: 201,
        });
      });
    });
  });

  describe("given the chunk is on its final delivery attempt", () => {
    let held: EnrichMessage[];

    beforeEach(async () => {
      stubSteam(THREE_GAMES);
      ({ held } = await actions.syncHoldingEnrichMessages());
      igdbFetchMock.mockClear();
      igdbFetchMock.mockRejectedValue(new Error("IGDB is down"));
      await runEnrichMessage({
        message: held[0]!,
        receiveCount: DEFAULT_MAX_RECEIVE_COUNT,
      });
    });

    it("marks every game in the chunk as needing a match", async () => {
      const rows = await Promise.all(
        ["730", "440", "570"].map(elements.findImportedGame)
      );

      expect(rows.map((r) => [r.gameId, r.lookedUpAt !== null])).toEqual([
        [null, true],
        [null, true],
        [null, true],
      ]);
    });

    it("does not ask IGDB again", () => {
      expect(igdbFetchMock).not.toHaveBeenCalled();
    });

    it("still finishes the job", async () => {
      expect(await elements.syncStatus()).toMatchObject({
        status: "FINISHED",
        totalToLookUp: 3,
        lookedUp: 3,
      });
    });
  });

  describe("given IGDB fails on an earlier delivery attempt", () => {
    let held: EnrichMessage[];
    let delivery: Promise<void>;

    beforeEach(async () => {
      stubSteam(THREE_GAMES);
      ({ held } = await actions.syncHoldingEnrichMessages());
      igdbFetchMock.mockRejectedValue(new Error("IGDB is down"));
      delivery = runEnrichMessage({
        message: held[0]!,
        receiveCount: DEFAULT_MAX_RECEIVE_COUNT - 1,
      });
    });

    it("fails the delivery so the queue retries it", async () => {
      await expect(delivery).rejects.toThrow();
    });

    it("leaves the games not looked up and the job running", async () => {
      await delivery.catch(() => undefined);

      expect((await elements.findImportedGame("440")).lookedUpAt).toBeNull();
      expect((await elements.syncStatus())?.status).toBe("LOOKING_UP");
    });
  });

  describe("given a chunk arrives after its job has failed", () => {
    let jobId: string;
    let held: EnrichMessage[];

    beforeEach(async () => {
      stubSteam(THREE_GAMES);
      ({ jobId, held } = await actions.syncHoldingEnrichMessages());
      await db.prisma.importJob.update({
        where: { id: jobId },
        data: {
          status: "FAILED",
          failureCode: "UNKNOWN",
          finishedAt: new Date(),
        },
      });
      igdbFetchMock.mockClear();
      igdbFetchMock.mockImplementation(
        externalGamesResponder({ "730": COUNTER_STRIKE })
      );
      await runEnrichMessage({ message: held[0]!, receiveCount: 1 });
    });

    it("drops the chunk without asking IGDB", () => {
      expect(igdbFetchMock).not.toHaveBeenCalled();
    });

    it("leaves the games and the job as they were", async () => {
      expect((await elements.findImportedGame("730")).lookedUpAt).toBeNull();
      expect(await elements.findImportJob(jobId)).toMatchObject({
        status: "FAILED",
        lookedUp: 0,
      });
    });
  });
});

describe("findImportedGamesForUser", () => {
  describe("given games linked to the catalogue, in and out of the user's library", () => {
    let result: Awaited<ReturnType<typeof findImportedGamesForUser>>;

    beforeEach(async () => {
      const bob = await createUser(db.prisma);
      const inAliceLibrary = await createGame(db.prisma, { igdbId: 9001 });
      const inBobLibrary = await createGame(db.prisma, { igdbId: 9002 });
      const inNobodyLibrary = await createGame(db.prisma, {
        igdbId: 9003,
        title: "Half-Life 2",
        coverImage:
          "https://images.igdb.com/igdb/image/upload/t_cover_big/co1.jpg",
        releaseDate: new Date("2004-11-16T00:00:00.000Z"),
      });
      await createLibraryItem(db.prisma, {
        userId: aliceId,
        gameId: inAliceLibrary.id,
      });
      await createLibraryItem(db.prisma, {
        userId: bob.id,
        gameId: inBobLibrary.id,
      });
      await actions.seedImportedGame("1", {
        name: "Already in my library",
        gameId: inAliceLibrary.id,
        lookedUpAt: LONG_AGO,
      });
      await actions.seedImportedGame("2", {
        name: "In someone else's library",
        gameId: inBobLibrary.id,
        lookedUpAt: LONG_AGO,
      });
      await actions.seedImportedGame("3", {
        name: "Found",
        gameId: inNobodyLibrary.id,
        lookedUpAt: LONG_AGO,
      });
      await actions.seedImportedGame("4", {
        name: "Needs a match",
        lookedUpAt: LONG_AGO,
      });
      await actions.seedImportedGame("5", { name: "Not looked up yet" });
      result = await findImportedGamesForUser(aliceId);
    });

    it("leaves out the game that is already in the user's library", () => {
      expect(result.games.map((g) => g.name).sort()).toEqual([
        "Found",
        "In someone else's library",
        "Needs a match",
        "Not looked up yet",
      ]);
    });

    it("counts only the rows it returns", () => {
      expect(result.total).toBe(4);
    });

    it("exposes the catalogue game's title, cover and release date on a found row", () => {
      expect(result.games.find((g) => g.name === "Found")?.game).toEqual({
        title: "Half-Life 2",
        coverImage:
          "https://images.igdb.com/igdb/image/upload/t_cover_big/co1.jpg",
        releaseDate: new Date("2004-11-16T00:00:00.000Z"),
      });
    });

    it("exposes no game on a row that was never matched", () => {
      expect(
        result.games.find((g) => g.name === "Needs a match")?.game
      ).toBeNull();
    });
  });
});

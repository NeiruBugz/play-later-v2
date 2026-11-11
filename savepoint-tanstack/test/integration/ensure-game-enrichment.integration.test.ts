import {
  afterAll,
  beforeAll,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from "vitest";

import {
  ensureGameEnrichment,
  ensureGamesEnrichment,
} from "@/entities/game/api/ensure-game-enrichment.server";
import { igdbFetch } from "@/shared/api/igdb/fetch";

import { createGame } from "../factories/index.ts";
import {
  setupIsolatedDatabase,
  type IsolatedDatabase,
} from "../setup/isolated-db.ts";

vi.mock("@/shared/api/igdb/fetch", () => ({ igdbFetch: vi.fn() }));

const igdbFetchMock = vi.mocked(igdbFetch);

const DAY_MS = 24 * 60 * 60 * 1000;
const BATCH_SIZE = 10;

let db: IsolatedDatabase;

beforeAll(async () => {
  db = await setupIsolatedDatabase("ensure-game-enrichment");
}, 60_000);

afterAll(async () => {
  await db?.teardown();
});

beforeEach(async () => {
  igdbFetchMock.mockReset();
  await db.prisma.game.deleteMany();
});

function idsRequestedIn(query: string): number[] {
  const match = /game_id = \(([^)]*)\)/.exec(query);
  return match?.[1]?.split(",").map((id) => Number(id.trim())) ?? [];
}

function answerWithTimesFor(
  times: (igdbId: number) => { hastily?: number; completely?: number } | null
) {
  igdbFetchMock.mockImplementation(async (_resource, query) => {
    const requested = idsRequestedIn(query);
    const ids = requested.length > 0 ? requested : [singleIdIn(query)];
    return ids.flatMap((igdbId) => {
      const found = times(igdbId);
      return found ? [{ id: igdbId, game_id: igdbId, ...found }] : [];
    });
  });
}

function singleIdIn(query: string): number {
  return Number(/game_id = (\d+)/.exec(query)?.[1]);
}

async function reload(id: string) {
  return db.prisma.game.findUniqueOrThrow({ where: { id } });
}

describe(ensureGameEnrichment, () => {
  describe("given a game that was never fetched and IGDB has both times", () => {
    it("stores time to credits from hastily and time to 100% from completely", async () => {
      const game = await createGame(db.prisma);
      answerWithTimesFor(() => ({ hastily: 36_000, completely: 90_000 }));

      await ensureGameEnrichment(game);

      expect(await reload(game.id)).toMatchObject({
        timeToCreditsSeconds: 36_000,
        timeToCompleteSeconds: 90_000,
      });
    });

    it("marks the game as fetched", async () => {
      const game = await createGame(db.prisma);
      answerWithTimesFor(() => ({ hastily: 36_000, completely: 90_000 }));

      await ensureGameEnrichment(game);

      expect((await reload(game.id)).timesToBeatFetchedAt).not.toBeNull();
    });
  });

  describe("given IGDB has no times for the game", () => {
    it("marks it fetched with no times so it is not refetched on every view", async () => {
      const game = await createGame(db.prisma);
      igdbFetchMock.mockResolvedValue([]);

      await ensureGameEnrichment(game);

      expect(await reload(game.id)).toMatchObject({
        timeToCreditsSeconds: null,
        timeToCompleteSeconds: null,
        timesToBeatFetchedAt: expect.any(Date),
      });
    });
  });

  describe("given IGDB fails", () => {
    it("does not throw and leaves the game unfetched so a later view retries", async () => {
      const game = await createGame(db.prisma);
      igdbFetchMock.mockRejectedValue(new Error("IGDB 500"));

      await expect(ensureGameEnrichment(game)).resolves.not.toThrow();

      expect(await reload(game.id)).toMatchObject({
        timeToCreditsSeconds: null,
        timeToCompleteSeconds: null,
        timesToBeatFetchedAt: null,
      });
    });
  });

  describe("given the times were fetched more than 30 days ago", () => {
    it("fetches again and stores the new times", async () => {
      const game = await createGame(db.prisma, {
        timeToCreditsSeconds: 3_600,
        timeToCompleteSeconds: 7_200,
        timesToBeatFetchedAt: new Date(Date.now() - 31 * DAY_MS),
      });
      answerWithTimesFor(() => ({ hastily: 40_000, completely: 95_000 }));

      await ensureGameEnrichment(game);

      expect(await reload(game.id)).toMatchObject({
        timeToCreditsSeconds: 40_000,
        timeToCompleteSeconds: 95_000,
      });
    });
  });

  describe("given the times were fetched less than 30 days ago", () => {
    it("keeps the stored times and does not ask IGDB", async () => {
      const game = await createGame(db.prisma, {
        timeToCreditsSeconds: 3_600,
        timeToCompleteSeconds: 7_200,
        timesToBeatFetchedAt: new Date(Date.now() - 29 * DAY_MS),
      });
      answerWithTimesFor(() => ({ hastily: 40_000, completely: 95_000 }));

      await ensureGameEnrichment(game);

      expect(igdbFetchMock).not.toHaveBeenCalled();
      expect(await reload(game.id)).toMatchObject({
        timeToCreditsSeconds: 3_600,
        timeToCompleteSeconds: 7_200,
      });
    });
  });
});

describe(ensureGamesEnrichment, () => {
  describe("given 25 games that were never fetched", () => {
    let games: Awaited<ReturnType<typeof createGame>>[];

    beforeEach(async () => {
      games = [];
      for (let i = 0; i < 25; i++) games.push(await createGame(db.prisma));
      answerWithTimesFor((igdbId) => ({
        hastily: igdbId,
        completely: igdbId * 2,
      }));
      await ensureGamesEnrichment(games);
    });

    it("asks IGDB for at most 10 games per request", () => {
      const sizes = igdbFetchMock.mock.calls.map(
        ([, query]) => idsRequestedIn(query).length
      );
      expect(sizes.toSorted((a, b) => b - a)).toEqual([
        BATCH_SIZE,
        BATCH_SIZE,
        5,
      ]);
    });

    it("stores each game's own times", async () => {
      const first = games[0]!;
      const last = games[24]!;
      expect(await reload(first.id)).toMatchObject({
        timeToCreditsSeconds: first.igdbId,
        timeToCompleteSeconds: first.igdbId * 2,
      });
      expect(await reload(last.id)).toMatchObject({
        timeToCreditsSeconds: last.igdbId,
        timeToCompleteSeconds: last.igdbId * 2,
      });
    });
  });

  describe("given a mix of fresh and never-fetched games", () => {
    it("asks IGDB only for the games that need it", async () => {
      const fresh = await createGame(db.prisma, {
        timesToBeatFetchedAt: new Date(Date.now() - DAY_MS),
      });
      const needy = await createGame(db.prisma);
      answerWithTimesFor(() => ({ hastily: 1, completely: 2 }));

      await ensureGamesEnrichment([fresh, needy]);

      expect(
        igdbFetchMock.mock.calls.flatMap(([, q]) => idsRequestedIn(q))
      ).toEqual([needy.igdbId]);
    });
  });

  describe("given IGDB fails for a batch", () => {
    it("does not throw and leaves those games unfetched", async () => {
      const game = await createGame(db.prisma);
      igdbFetchMock.mockRejectedValue(new Error("IGDB 500"));

      await expect(ensureGamesEnrichment([game])).resolves.not.toThrow();

      expect((await reload(game.id)).timesToBeatFetchedAt).toBeNull();
    });
  });
});

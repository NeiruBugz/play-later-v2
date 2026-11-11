import {
  afterAll,
  beforeAll,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from "vitest";

import { backfillGameEnrichment } from "@/entities/game/api/backfill-game-enrichment.server";
import { igdbFetch } from "@/shared/api/igdb/fetch";

import { createGame } from "../factories/index.ts";
import {
  setupIsolatedDatabase,
  type IsolatedDatabase,
} from "../setup/isolated-db.ts";

vi.mock("@/shared/api/igdb/fetch", () => ({ igdbFetch: vi.fn() }));

const igdbFetchMock = vi.mocked(igdbFetch);
const NO_DELAY = { delayBetweenRequestsMs: 0 };

let db: IsolatedDatabase;

beforeAll(async () => {
  db = await setupIsolatedDatabase("backfill-game-enrichment");
}, 60_000);

afterAll(async () => {
  await db?.teardown();
});

beforeEach(async () => {
  igdbFetchMock.mockReset();
  await db.prisma.game.deleteMany();
});

function igdbKnowsTimesFor(knownIgdbIds: number[]) {
  igdbFetchMock.mockImplementation(async (_resource, query) => {
    const asked = /game_id = \(?([\d,\s]+)\)?/.exec(query)?.[1] ?? "";
    return asked
      .split(",")
      .map((id) => Number(id.trim()))
      .filter((id) => knownIgdbIds.includes(id))
      .map((id) => ({ id, game_id: id, hastily: 36_000, completely: 90_000 }));
  });
}

describe(backfillGameEnrichment, () => {
  describe("given games that were never enriched", () => {
    let known: Awaited<ReturnType<typeof createGame>>;
    let unknown: Awaited<ReturnType<typeof createGame>>;

    beforeEach(async () => {
      known = await createGame(db.prisma);
      unknown = await createGame(db.prisma);
      igdbKnowsTimesFor([known.igdbId]);
    });

    it("fills in the time to credits for games IGDB knows", async () => {
      await backfillGameEnrichment(NO_DELAY);

      const reloaded = await db.prisma.game.findUniqueOrThrow({
        where: { id: known.id },
      });
      expect(reloaded.timeToCreditsSeconds).toBe(36_000);
    });

    it("reports how many games now have a credits time", async () => {
      const coverage = await backfillGameEnrichment(NO_DELAY);

      expect(coverage).toEqual({ totalGames: 2, gamesWithCreditsTime: 1 });
    });

    it("leaves a game IGDB has no times for without a credits time", async () => {
      await backfillGameEnrichment(NO_DELAY);

      const reloaded = await db.prisma.game.findUniqueOrThrow({
        where: { id: unknown.id },
      });
      expect(reloaded.timeToCreditsSeconds).toBeNull();
    });
  });

  describe("given the backfill already ran", () => {
    beforeEach(async () => {
      const game = await createGame(db.prisma);
      await createGame(db.prisma);
      igdbKnowsTimesFor([game.igdbId]);
      await backfillGameEnrichment(NO_DELAY);
      igdbFetchMock.mockClear();
    });

    it("asks IGDB for nothing on a rerun", async () => {
      await backfillGameEnrichment(NO_DELAY);

      expect(igdbFetchMock).not.toHaveBeenCalled();
    });

    it("reports the same coverage on a rerun", async () => {
      const coverage = await backfillGameEnrichment(NO_DELAY);

      expect(coverage).toEqual({ totalGames: 2, gamesWithCreditsTime: 1 });
    });
  });
});

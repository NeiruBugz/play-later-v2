import {
  afterAll,
  beforeAll,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from "vitest";

import { getGameDetails } from "@/entities/game/api/get-game-details.server";
import { igdbFetch } from "@/shared/api/igdb/fetch";

import {
  setupIsolatedDatabase,
  type IsolatedDatabase,
} from "../setup/isolated-db.ts";

vi.mock("@/shared/api/igdb/fetch", () => ({ igdbFetch: vi.fn() }));

const igdbFetchMock = vi.mocked(igdbFetch);

const IGDB_ID = 76340;
const GAME_SLUG = "elden-ring";
const SLOW_IGDB_MS = 4_000;
const ENRICHMENT_CAP_MS = 1_500;

const IGDB_GAME = {
  id: IGDB_ID,
  name: "Elden Ring",
  slug: GAME_SLUG,
  summary: "Elden Ring summary text from IGDB.",
  cover: { id: 1, image_id: "co5s5v" },
  first_release_date: 1645747200,
};

let db: IsolatedDatabase;

beforeAll(async () => {
  db = await setupIsolatedDatabase("get-game-details-enrichment");
}, 60_000);

afterAll(async () => {
  await db?.teardown();
});

beforeEach(async () => {
  igdbFetchMock.mockReset();
  await db.prisma.game.deleteMany();
});

function igdbAnswers(timesToBeat: () => Promise<unknown>) {
  igdbFetchMock.mockImplementation(async (resource) =>
    resource === "/game_time_to_beats" ? timesToBeat() : [IGDB_GAME]
  );
}

describe(getGameDetails, () => {
  describe("given a signed-out viewer opens a game IGDB has times for", () => {
    it("returns the time to credits and the time to 100%", async () => {
      igdbAnswers(async () => [
        { id: 1, game_id: IGDB_ID, hastily: 36_000, completely: 90_000 },
      ]);

      const result = await getGameDetails({ slug: GAME_SLUG });

      expect(result).toMatchObject({
        timeToCreditsSeconds: 36_000,
        timeToCompleteSeconds: 90_000,
      });
    });

    it("keeps the times so the next view does not ask IGDB again", async () => {
      igdbAnswers(async () => [
        { id: 1, game_id: IGDB_ID, hastily: 36_000, completely: 90_000 },
      ]);
      await getGameDetails({ slug: GAME_SLUG });
      const timesCalls = () =>
        igdbFetchMock.mock.calls.filter(
          ([resource]) => resource === "/game_time_to_beats"
        ).length;
      const callsAfterFirstView = timesCalls();

      const second = await getGameDetails({ slug: GAME_SLUG });

      expect(second.timeToCreditsSeconds).toBe(36_000);
      expect(timesCalls()).toBe(callsAfterFirstView);
    });
  });

  describe("given IGDB has no times for the game", () => {
    it("returns the page with both times empty", async () => {
      igdbAnswers(async () => []);

      const result = await getGameDetails({ slug: GAME_SLUG });

      expect(result.game.slug).toBe(GAME_SLUG);
      expect(result).toMatchObject({
        timeToCreditsSeconds: null,
        timeToCompleteSeconds: null,
      });
    });
  });

  describe("given IGDB answers the times request slowly", () => {
    it("returns the page without times after at most 1.5 seconds", async () => {
      igdbAnswers(
        () =>
          new Promise((resolve) =>
            setTimeout(
              () => resolve([{ game_id: IGDB_ID, hastily: 36_000 }]),
              SLOW_IGDB_MS
            )
          )
      );
      const startedAt = Date.now();

      const result = await getGameDetails({ slug: GAME_SLUG });

      expect(Date.now() - startedAt).toBeLessThan(ENRICHMENT_CAP_MS + 1_000);
      expect(result.game.slug).toBe(GAME_SLUG);
      expect(result).toMatchObject({
        timeToCreditsSeconds: null,
        timeToCompleteSeconds: null,
      });
    });
  });
});

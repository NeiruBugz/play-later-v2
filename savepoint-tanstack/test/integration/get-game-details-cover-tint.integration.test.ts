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

import { getGameDetails } from "@/entities/game/api/get-game-details.server";
import { igdbFetch } from "@/shared/api/igdb/fetch";

import {
  setupIsolatedDatabase,
  type IsolatedDatabase,
} from "../setup/isolated-db.ts";
import { GREY_COVER_JPEG, RED_COVER_JPEG } from "../support/cover-jpegs.ts";

vi.mock("@/shared/api/igdb/fetch", () => ({ igdbFetch: vi.fn() }));

const igdbFetchMock = vi.mocked(igdbFetch);
const fetchMock = vi.fn<typeof fetch>();

const IGDB_ID = 76340;
const GAME_SLUG = "elden-ring";
const RED_HUE = 28;
const HUE_TOLERANCE = 15;

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
  db = await setupIsolatedDatabase("get-game-details-cover-tint");
}, 60_000);

afterAll(async () => {
  await db?.teardown();
});

beforeEach(async () => {
  igdbFetchMock.mockReset();
  igdbFetchMock.mockImplementation(async (resource) =>
    resource === "/game_time_to_beats" ? [] : [IGDB_GAME]
  );
  fetchMock.mockReset();
  vi.stubGlobal("fetch", fetchMock);
  await db.prisma.game.deleteMany();
});

afterEach(() => {
  vi.unstubAllGlobals();
});

function coverServerSends(bytes: Buffer) {
  fetchMock.mockImplementation(
    async () =>
      new Response(new Uint8Array(bytes), {
        status: 200,
        headers: { "content-type": "image/jpeg" },
      })
  );
}

describe(getGameDetails, () => {
  describe("given a signed-out viewer opens a game with a red cover", () => {
    it("returns the cover tint with a red hue", async () => {
      coverServerSends(RED_COVER_JPEG);

      const result = await getGameDetails({ slug: GAME_SLUG });

      expect(result.coverTint).not.toBeNull();
      expect(Math.abs(result.coverTint!.hue - RED_HUE)).toBeLessThan(
        HUE_TOLERANCE
      );
      expect(result.coverTint!.chroma).toBeGreaterThan(0.1);
    });
  });

  describe("given a game with a black-and-white cover", () => {
    it("returns no tint", async () => {
      coverServerSends(GREY_COVER_JPEG);

      const result = await getGameDetails({ slug: GAME_SLUG });

      expect(result.coverTint).toBeNull();
    });
  });

  describe("given the cover image cannot be fetched", () => {
    it("still returns the page, with no tint", async () => {
      fetchMock.mockRejectedValue(new Error("network down"));

      const result = await getGameDetails({ slug: GAME_SLUG });

      expect(result.game.slug).toBe(GAME_SLUG);
      expect(result.coverTint).toBeNull();
    });
  });
});

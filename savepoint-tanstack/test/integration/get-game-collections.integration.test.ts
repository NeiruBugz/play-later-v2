/**
 * Integration test for `getGameCollectionsByIgdbId` (Slice 14 phase-2 rework).
 *
 * IGDB transport mocked via vi.stubGlobal("fetch", ...) following the pattern
 * in get-game-details.integration.test.ts. No DB writes expected — pure
 * read-through IGDB query.
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

import { getGameCollectionsByIgdbId } from "@/entities/game/api";
import { __resetTokenCacheForTests } from "@/shared/api/igdb/token";
import { UpstreamError } from "@/shared/lib/errors";

import {
  setupIsolatedDatabase,
  type IsolatedDatabase,
} from "../setup/isolated-db.ts";

let db: IsolatedDatabase;

beforeAll(async () => {
  db = await setupIsolatedDatabase("get-game-collections");
}, 60_000);

afterAll(async () => {
  await db?.teardown();
});

const FAKE_TOKEN_RESPONSE = {
  access_token: "tok",
  expires_in: 3600,
  token_type: "bearer",
};

const IGDB_ID = 7777;

function makeFetchMock({
  igdbBody,
  igdbOk = true,
  igdbStatus = 200,
}: {
  igdbBody: unknown;
  igdbOk?: boolean;
  igdbStatus?: number;
}) {
  return vi.fn().mockImplementation((url: string) => {
    if (url.includes("id.twitch.tv")) {
      return Promise.resolve({
        ok: true,
        status: 200,
        statusText: "OK",
        json: async () => FAKE_TOKEN_RESPONSE,
      } as Response);
    }
    if (url.includes("api.igdb.com")) {
      return Promise.resolve({
        ok: igdbOk,
        status: igdbStatus,
        statusText: igdbOk ? "OK" : "Internal Server Error",
        json: async () => igdbBody,
      } as Response);
    }
    return Promise.reject(new Error(`Unexpected fetch URL in test: ${url}`));
  });
}

beforeEach(() => {
  __resetTokenCacheForTests();
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe("getGameCollectionsByIgdbId", () => {
  it("returns collection refs from the IGDB response", async () => {
    vi.stubGlobal(
      "fetch",
      makeFetchMock({
        igdbBody: [
          {
            id: IGDB_ID,
            collections: [
              { id: 11, name: "Souls Series" },
              { id: 22, name: "Elden Universe" },
            ],
          },
        ],
      })
    );

    const refs = await getGameCollectionsByIgdbId({ igdbId: IGDB_ID });

    expect(refs).toEqual([
      { id: 11, name: "Souls Series" },
      { id: 22, name: "Elden Universe" },
    ]);
  });

  it("returns an empty array when IGDB returns no items", async () => {
    vi.stubGlobal("fetch", makeFetchMock({ igdbBody: [] }));

    const refs = await getGameCollectionsByIgdbId({ igdbId: IGDB_ID });
    expect(refs).toEqual([]);
  });

  it("returns an empty array when the item has no `collections` field", async () => {
    vi.stubGlobal("fetch", makeFetchMock({ igdbBody: [{ id: IGDB_ID }] }));

    const refs = await getGameCollectionsByIgdbId({ igdbId: IGDB_ID });
    expect(refs).toEqual([]);
  });

  it("throws UpstreamError on transport / non-2xx", async () => {
    vi.stubGlobal(
      "fetch",
      makeFetchMock({
        igdbBody: { error: "boom" },
        igdbOk: false,
        igdbStatus: 500,
      })
    );

    await expect(
      getGameCollectionsByIgdbId({ igdbId: IGDB_ID })
    ).rejects.toThrow(UpstreamError);
  });

  it("throws UpstreamError when the response shape is malformed", async () => {
    vi.stubGlobal(
      "fetch",
      makeFetchMock({ igdbBody: [{ id: "not-a-number" }] })
    );

    await expect(
      getGameCollectionsByIgdbId({ igdbId: IGDB_ID })
    ).rejects.toThrow(UpstreamError);
  });

  it("does not write to the Game table (read-through only)", async () => {
    vi.stubGlobal(
      "fetch",
      makeFetchMock({
        igdbBody: [{ id: IGDB_ID, collections: [{ id: 1, name: "X" }] }],
      })
    );

    const before = await db.prisma.game.count();
    await getGameCollectionsByIgdbId({ igdbId: IGDB_ID });
    const after = await db.prisma.game.count();

    expect(after).toBe(before);
  });
});

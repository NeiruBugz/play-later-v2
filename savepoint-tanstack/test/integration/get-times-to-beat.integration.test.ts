/**
 * Integration test for `getTimesToBeat`.
 *
 * IGDB transport mocked via vi.stubGlobal("fetch", ...). No DB writes —
 * read-through IGDB query against `/game_time_to_beats`. `hastily` is the time
 * to credits, `completely` the time to 100%; `normally` is not read.
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

import { getTimesToBeat } from "@/entities/game/api/get-times-to-beat.server";
import { __resetTokenCacheForTests } from "@/shared/api/igdb/token";
import { UpstreamError } from "@/shared/lib/errors";

import {
  setupIsolatedDatabase,
  type IsolatedDatabase,
} from "../setup/isolated-db.ts";

let db: IsolatedDatabase;

beforeAll(async () => {
  db = await setupIsolatedDatabase("get-times-to-beat");
}, 60_000);

afterAll(async () => {
  await db?.teardown();
});

const FAKE_TOKEN_RESPONSE = {
  access_token: "tok",
  expires_in: 3600,
  token_type: "bearer",
};

const IGDB_ID = 5555;

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

describe("getTimesToBeat", () => {
  it("returns raw seconds when IGDB has both fields", async () => {
    vi.stubGlobal(
      "fetch",
      makeFetchMock({
        igdbBody: [{ id: 1, hastily: 36000, completely: 90000 }],
      })
    );

    const result = await getTimesToBeat({ igdbId: IGDB_ID });
    expect(result).toEqual({
      timeToCreditsSeconds: 36000,
      timeToCompleteSeconds: 90000,
    });
  });

  it("asks IGDB for hastily and completely", async () => {
    const fetchMock = makeFetchMock({ igdbBody: [] });
    vi.stubGlobal("fetch", fetchMock);

    await getTimesToBeat({ igdbId: IGDB_ID });

    const igdbCall = fetchMock.mock.calls.find(([url]) =>
      String(url).includes("api.igdb.com")
    );
    expect(String(igdbCall?.[1]?.body)).toContain(
      "fields hastily, completely;"
    );
  });

  it("ignores `normally` — it is not the time to credits", async () => {
    vi.stubGlobal(
      "fetch",
      makeFetchMock({ igdbBody: [{ id: 1, normally: 50000 }] })
    );

    const result = await getTimesToBeat({ igdbId: IGDB_ID });
    expect(result).toBeNull();
  });

  it("returns null when IGDB returns no items for the game", async () => {
    vi.stubGlobal("fetch", makeFetchMock({ igdbBody: [] }));

    const result = await getTimesToBeat({ igdbId: IGDB_ID });
    expect(result).toBeNull();
  });

  it("returns null when both `hastily` and `completely` are missing", async () => {
    vi.stubGlobal("fetch", makeFetchMock({ igdbBody: [{ id: 1 }] }));

    const result = await getTimesToBeat({ igdbId: IGDB_ID });
    expect(result).toBeNull();
  });

  it("returns the time to credits only when `completely` is missing", async () => {
    vi.stubGlobal(
      "fetch",
      makeFetchMock({ igdbBody: [{ id: 1, hastily: 18000 }] })
    );

    const result = await getTimesToBeat({ igdbId: IGDB_ID });
    expect(result).toEqual({
      timeToCreditsSeconds: 18000,
      timeToCompleteSeconds: null,
    });
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

    await expect(getTimesToBeat({ igdbId: IGDB_ID })).rejects.toThrow(
      UpstreamError
    );
  });

  it("throws UpstreamError on malformed response", async () => {
    vi.stubGlobal(
      "fetch",
      makeFetchMock({ igdbBody: [{ hastily: "not-a-number" }] })
    );

    await expect(getTimesToBeat({ igdbId: IGDB_ID })).rejects.toThrow(
      UpstreamError
    );
  });

  it("does not write to the Game table", async () => {
    vi.stubGlobal(
      "fetch",
      makeFetchMock({ igdbBody: [{ id: 1, hastily: 36000 }] })
    );

    const before = await db.prisma.game.count();
    await getTimesToBeat({ igdbId: IGDB_ID });
    const after = await db.prisma.game.count();

    expect(after).toBe(before);
  });
});

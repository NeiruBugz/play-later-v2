import type { RequestContext } from "@/data-access-layer/handlers/types";
import type { GameSearchResult } from "@/data-access-layer/services/igdb/types";
import { ServiceErrorCode } from "@/data-access-layer/services/types";

import { igdbSearchHandler } from "./igdb-handler";

// "use cache" functions call cacheLife/cacheTag at runtime. In the Node test
// environment these APIs are unavailable, so we stub them as no-ops.
vi.mock("next/cache", () => ({
  cacheLife: vi.fn(),
  cacheTag: vi.fn(),
}));

// vi.hoisted runs before vi.mock factories and before the module under test
// is evaluated, so the singleton inside igdb-handler.ts picks up this spy.
const { mockSearchGamesByName } = vi.hoisted(() => ({
  mockSearchGamesByName: vi.fn(),
}));

vi.mock("@/data-access-layer/services", () => ({
  // Must use `function` (not arrow) so `new IgdbService()` works as a constructor.
  IgdbService: vi.fn(function () {
    return { searchGamesByName: mockSearchGamesByName };
  }),
}));

vi.mock("@/shared/lib/rate-limit", () => ({
  checkRateLimit: vi.fn().mockResolvedValue({ allowed: true }),
}));

const makeCtx = (overrides?: Partial<RequestContext>): RequestContext => ({
  ip: "127.0.0.1",
  headers: new Headers(),
  url: new URL("http://localhost/api/games/search"),
  ...overrides,
});

const mockSearchResult: GameSearchResult = {
  games: [
    {
      id: 1,
      name: "Zelda",
      slug: "zelda",
      cover: { id: 1, image_id: "cover1" },
      platforms: [{ id: 130, name: "Nintendo Switch" }],
      first_release_date: 1488326400,
      game_type: 0,
    },
  ],
  count: 1,
};

describe("igdbSearchHandler.search", () => {
  beforeEach(() => {
    mockSearchGamesByName.mockReset();
    mockSearchGamesByName.mockResolvedValue({
      success: true,
      data: mockSearchResult,
    });
  });

  it("happy path: returns status 200 with service data", async () => {
    const result = await igdbSearchHandler.search(
      { query: "zelda", offset: 0 },
      makeCtx()
    );

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.status).toBe(200);
      expect(result.data).toEqual(mockSearchResult);
    }
    expect(mockSearchGamesByName).toHaveBeenCalledTimes(1);
  });

  it("normalization: passes lowercased trimmed query to the service", async () => {
    await igdbSearchHandler.search(
      { query: "  Zelda  ", offset: 0 },
      makeCtx()
    );

    expect(mockSearchGamesByName).toHaveBeenCalledWith({
      name: "zelda",
      offset: 0,
    });
  });

  it("returns status 429 when service returns IGDB_RATE_LIMITED", async () => {
    mockSearchGamesByName.mockResolvedValueOnce({
      success: false,
      error: "Rate limited",
      code: ServiceErrorCode.IGDB_RATE_LIMITED,
    });

    const result = await igdbSearchHandler.search(
      { query: "zelda", offset: 0 },
      makeCtx()
    );

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.status).toBe(429);
    }
  });

  it("returns status 400 for an empty query without calling the service", async () => {
    const result = await igdbSearchHandler.search(
      { query: "", offset: 0 },
      makeCtx()
    );

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.status).toBe(400);
    }
    expect(mockSearchGamesByName).not.toHaveBeenCalled();
  });
});

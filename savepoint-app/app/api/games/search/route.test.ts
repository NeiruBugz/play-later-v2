import {
  igdbSearchHandler,
  type HandlerResult,
  type IgdbSearchHandlerOutput,
} from "@/data-access-layer/handlers";
import type { NextRequest } from "next/server";

import { HTTP_STATUS } from "@/shared/config/http-codes";
import { GAME_TYPE } from "@/shared/types";

import { GET } from "./route";

vi.mock("@/data-access-layer/handlers", () => ({
  igdbSearchHandler: {
    search: vi.fn(),
  },
}));

const mockHandlerSearch = vi.mocked(igdbSearchHandler.search);

function createMockRequest(query: string, offset: number = 0): NextRequest {
  const url = new URL(
    `http://localhost/api/games/search?q=${encodeURIComponent(query)}&offset=${offset}`
  );
  return {
    nextUrl: url,
    url: url.toString(),
    headers: {
      get: vi.fn().mockReturnValue("127.0.0.1"),
    },
  } as unknown as NextRequest;
}

describe("GET /api/games/search", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should return games when handler returns success", async () => {
    const handlerResult: HandlerResult<IgdbSearchHandlerOutput> = {
      success: true,
      status: HTTP_STATUS.OK,
      data: {
        games: [
          {
            id: 1,
            name: "The Legend of Zelda: Breath of the Wild",
            cover: { id: 123, image_id: "co3p2d" },
            platforms: [{ id: 130, name: "Nintendo Switch" }],
            first_release_date: 1488326400,
            slug: "the-legend-of-zelda-breath-of-the-wild",
            game_type: GAME_TYPE.MAIN_GAME,
          },
        ],
        count: 1,
      },
    };
    mockHandlerSearch.mockResolvedValue(handlerResult);

    const request = createMockRequest("zelda");
    const response = await GET(request);

    const data = await response.json();
    expect(response.status).toBe(HTTP_STATUS.OK);
    expect(data.games).toHaveLength(1);
    expect(data.games[0].name).toBe("The Legend of Zelda: Breath of the Wild");
    expect(data.count).toBe(1);

    expect(mockHandlerSearch).toHaveBeenCalledWith(
      { query: "zelda", offset: 0 },
      expect.objectContaining({
        ip: "127.0.0.1",
        headers: expect.anything(),
        url: expect.any(URL),
      })
    );
  });

  describe("when handler returns rate limit error", () => {
    it("should return 429 with handler-provided headers", async () => {
      mockHandlerSearch.mockResolvedValue({
        success: false,
        status: HTTP_STATUS.TOO_MANY_REQUESTS,
        error: "Rate limit exceeded. Try again later.",
        headers: {
          "X-RateLimit-Limit": "20",
          "X-RateLimit-Remaining": "0",
          "Retry-After": "60",
        },
      });

      const request = createMockRequest("zelda");
      const response = await GET(request);

      expect(response.status).toBe(HTTP_STATUS.TOO_MANY_REQUESTS);
      const data = await response.json();
      expect(data.error).toBe("Rate limit exceeded. Try again later.");
      expect(response.headers.get("Retry-After")).toBe("60");
      expect(response.headers.get("X-RateLimit-Limit")).toBe("20");
      expect(response.headers.get("X-RateLimit-Remaining")).toBe("0");
    });
  });

  describe("when handler returns service failure", () => {
    it("should propagate handler error and status", async () => {
      mockHandlerSearch.mockResolvedValue({
        success: false,
        status: HTTP_STATUS.INTERNAL_SERVER_ERROR,
        error:
          "Game search is temporarily unavailable. Please try again later.",
      });

      const request = createMockRequest("zelda");
      const response = await GET(request);

      expect(response.status).toBe(HTTP_STATUS.INTERNAL_SERVER_ERROR);
      const data = await response.json();
      expect(data.error).toBe(
        "Game search is temporarily unavailable. Please try again later."
      );
    });
  });

  describe("when handler throws unexpectedly", () => {
    it("should return generic 500", async () => {
      mockHandlerSearch.mockRejectedValue(new Error("boom"));

      const request = createMockRequest("zelda");
      const response = await GET(request);

      expect(response.status).toBe(HTTP_STATUS.INTERNAL_SERVER_ERROR);
      const data = await response.json();
      expect(data.error).toBe(
        "Game search is temporarily unavailable. Please try again later."
      );
    });
  });

  describe("offset parsing", () => {
    it("should default invalid offset to 0", async () => {
      mockHandlerSearch.mockResolvedValue({
        success: true,
        status: HTTP_STATUS.OK,
        data: { games: [], count: 0 },
      });

      const url = new URL(
        "http://localhost/api/games/search?q=mario&offset=-5"
      );
      const request = {
        nextUrl: url,
        url: url.toString(),
        headers: { get: vi.fn().mockReturnValue("127.0.0.1") },
      } as unknown as NextRequest;

      await GET(request);

      expect(mockHandlerSearch).toHaveBeenCalledWith(
        { query: "mario", offset: 0 },
        expect.anything()
      );
    });
  });
});

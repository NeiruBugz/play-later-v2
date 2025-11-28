import { IgdbService } from "@/data-access-layer/services/igdb";
import type { GameSearchResult } from "@/data-access-layer/services/igdb/types";
import type { ServiceResult } from "@/data-access-layer/services/types";
import type { NextRequest } from "next/server";

import { HTTP_STATUS } from "@/shared/config/http-codes";
import { checkRateLimit } from "@/shared/lib/rate-limit";
import { GAME_TYPE } from "@/shared/types";

import { GET } from "./route";

// Mocks
vi.mock("next/cache", () => ({
  unstable_cache: vi.fn((fn) => fn),
}));
vi.mock("@/data-access-layer/services/igdb/igdb-service");
vi.mock("@/shared/lib/rate-limit");

const mockCheckRateLimit = vi.mocked(checkRateLimit);

// Helper to create mock request
function createMockRequest(query: string, offset: number = 0): NextRequest {
  const url = new URL(
    `http://localhost/api/games/search?q=${encodeURIComponent(query)}&offset=${offset}`
  );
  return {
    nextUrl: url,
    headers: {
      get: vi.fn().mockReturnValue("127.0.0.1"),
    },
  } as unknown as NextRequest;
}

describe("GET /api/games/search", () => {
  let mockSearchGamesByName: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    vi.clearAllMocks();

    // Mock IgdbService instance
    mockSearchGamesByName = vi.fn();
    vi.mocked(IgdbService).mockImplementation(
      () =>
        ({
          searchGamesByName: mockSearchGamesByName,
        }) as unknown as IgdbService
    );

    // Default: allow rate limit
    mockCheckRateLimit.mockResolvedValue({
      allowed: true,
      remaining: 19,
    });
  });

  it("should return games when valid query is provided", async () => {
    // Setup mock
    const mockSearchResult: ServiceResult<GameSearchResult> = {
      success: true,
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
    mockSearchGamesByName.mockResolvedValue(mockSearchResult);

    // Execute
    const request = createMockRequest("zelda");
    const response = await GET(request);

    // Assert
    const data = await response.json();
    expect(response.status).toBe(HTTP_STATUS.OK);
    expect(data.games).toHaveLength(1);
    expect(data.games[0].name).toBe("The Legend of Zelda: Breath of the Wild");
    expect(data.count).toBe(1);

    // Verify service was called correctly
    expect(mockSearchGamesByName).toHaveBeenCalledWith({
      name: "zelda",
      offset: 0,
    });
  });

  describe("when rate limit is exceeded", () => {
    it("should return 429 when rate limit exceeded", async () => {
      // Override default rate limit mock
      mockCheckRateLimit.mockResolvedValue({
        allowed: false,
        remaining: 0,
      });

      // Execute
      const request = createMockRequest("zelda");
      const response = await GET(request);

      // Assert
      expect(response.status).toBe(HTTP_STATUS.TOO_MANY_REQUESTS);
      const data = await response.json();
      expect(data.error).toBe("Rate limit exceeded. Try again later.");

      // Verify IGDB service was NOT called
      expect(mockSearchGamesByName).not.toHaveBeenCalled();
    });
  });

  describe("when IGDB service fails", () => {
    it("should return 500 when IGDB service returns error", async () => {
      // Setup: service returns error
      const mockErrorResult: ServiceResult<GameSearchResult> = {
        success: false,
        error: "IGDB API is unavailable",
      };
      mockSearchGamesByName.mockResolvedValue(mockErrorResult);

      // Execute
      const request = createMockRequest("zelda");
      const response = await GET(request);

      // Assert
      expect(response.status).toBe(HTTP_STATUS.INTERNAL_SERVER_ERROR);
      const data = await response.json();
      expect(data.error).toBe(
        "Game search is temporarily unavailable. Please try again later."
      );
    });

    it("should call service on each request when errors occur (errors not cached)", async () => {
      // Setup: service returns error
      const mockErrorResult: ServiceResult<GameSearchResult> = {
        success: false,
        error: "IGDB API is unavailable",
      };
      mockSearchGamesByName.mockResolvedValue(mockErrorResult);

      // Execute: make two requests
      const request1 = createMockRequest("zelda");
      await GET(request1);

      const request2 = createMockRequest("zelda");
      await GET(request2);

      // Assert: service was called TWICE (errors not cached)
      expect(mockSearchGamesByName).toHaveBeenCalledTimes(2);
    });
  });
});

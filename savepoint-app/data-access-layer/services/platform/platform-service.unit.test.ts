import {
  findGameByIgdbId,
  findPlatformsForGame,
  findSystemPlatforms,
  upsertPlatforms,
} from "@/data-access-layer/repository";
import type { Platform } from "@prisma/client";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { NotFoundError } from "@/shared/lib/errors";

import {
  getPlatformsForGame,
  getSystemPlatforms,
  savePlatforms,
} from "./platform-service";

vi.mock("@/data-access-layer/repository", () => ({
  findGameByIgdbId: vi.fn(),
  findPlatformsForGame: vi.fn(),
  findSystemPlatforms: vi.fn(),
  upsertPlatforms: vi.fn(),
}));

const mockPlatform = (overrides: Partial<Platform> = {}): Platform => ({
  id: "plat1",
  igdbId: 167,
  name: "PlayStation 5",
  slug: "ps5",
  abbreviation: "PS5",
  alternativeName: null,
  generation: 9,
  platformFamily: null,
  platformType: null,
  checksum: null,
  createdAt: new Date(),
  updatedAt: new Date(),
  ...overrides,
});

const mockGame = {
  id: "clx123abc456def",
  igdbId: 12345,
  title: "Test Game",
  slug: "test-game",
  summary: "A test game",
  storyline: null,
  coverImage: "https://example.com/cover.jpg",
  releaseDate: new Date("2024-01-01"),
  aggregatedRating: 85.5,
  aggregatedRatingCount: 100,
  category: "main_game",
  checksum: "test-checksum",
  url: "https://igdb.com/games/test-game",
  createdAt: new Date("2025-01-01"),
  updatedAt: new Date("2025-01-01"),
};

describe("getSystemPlatforms", () => {
  let mockFindSystemPlatforms: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    vi.clearAllMocks();
    mockFindSystemPlatforms = vi.mocked(findSystemPlatforms);
  });

  it("returns platform list on success", async () => {
    const platforms = [{ id: "plat1", name: "PlayStation 5", slug: "ps5" }];
    mockFindSystemPlatforms.mockResolvedValue(platforms);

    const result = await getSystemPlatforms();

    expect(result.platforms).toEqual(platforms);
    expect(mockFindSystemPlatforms).toHaveBeenCalledTimes(1);
  });

  it("returns empty list when no platforms exist", async () => {
    mockFindSystemPlatforms.mockResolvedValue([]);

    const result = await getSystemPlatforms();

    expect(result.platforms).toEqual([]);
  });

  it("propagates repository errors as thrown errors", async () => {
    mockFindSystemPlatforms.mockRejectedValue(
      new Error("Database connection failed")
    );

    await expect(getSystemPlatforms()).rejects.toThrow(
      "Database connection failed"
    );
  });
});

describe("savePlatforms", () => {
  let mockUpsertPlatforms: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    vi.clearAllMocks();
    mockUpsertPlatforms = vi.mocked(upsertPlatforms);
  });

  it("returns upserted platforms on success", async () => {
    const platforms = [mockPlatform()];
    mockUpsertPlatforms.mockResolvedValue(platforms);

    const result = await savePlatforms([{ id: 167, name: "PlayStation 5" }]);

    expect(result).toEqual(platforms);
    expect(mockUpsertPlatforms).toHaveBeenCalledTimes(1);
  });

  it("returns empty array for empty input", async () => {
    mockUpsertPlatforms.mockResolvedValue([]);

    const result = await savePlatforms([]);

    expect(result).toEqual([]);
  });

  it("propagates repository errors as thrown errors", async () => {
    mockUpsertPlatforms.mockRejectedValue(new Error("Upsert failed"));

    await expect(savePlatforms([{ id: 1 }])).rejects.toThrow("Upsert failed");
  });
});

describe("getPlatformsForGame", () => {
  let mockFindGameByIgdbId: ReturnType<typeof vi.fn>;
  let mockFindPlatformsForGame: ReturnType<typeof vi.fn>;

  const validIgdbId = 12345;
  const mockSupportedPlatforms: Platform[] = [mockPlatform()];
  const mockOtherPlatforms: Platform[] = [
    mockPlatform({
      id: "plat3",
      igdbId: 6,
      name: "PC (Microsoft Windows)",
      slug: "win",
      abbreviation: "PC",
    }),
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    mockFindGameByIgdbId = vi.mocked(findGameByIgdbId);
    mockFindPlatformsForGame = vi.mocked(findPlatformsForGame);
  });

  describe("success scenarios", () => {
    it("returns grouped platforms when game exists", async () => {
      mockFindGameByIgdbId.mockResolvedValue(mockGame);
      mockFindPlatformsForGame.mockResolvedValue({
        supportedPlatforms: mockSupportedPlatforms,
        otherPlatforms: mockOtherPlatforms,
      });

      const result = await getPlatformsForGame(validIgdbId);

      expect(result.supportedPlatforms).toEqual(mockSupportedPlatforms);
      expect(result.otherPlatforms).toEqual(mockOtherPlatforms);
      expect(mockFindGameByIgdbId).toHaveBeenCalledWith(validIgdbId);
      expect(mockFindPlatformsForGame).toHaveBeenCalledWith(mockGame.id);
    });

    it("returns empty platform arrays when game has none linked", async () => {
      mockFindGameByIgdbId.mockResolvedValue(mockGame);
      mockFindPlatformsForGame.mockResolvedValue({
        supportedPlatforms: [],
        otherPlatforms: [],
      });

      const result = await getPlatformsForGame(validIgdbId);

      expect(result.supportedPlatforms).toEqual([]);
      expect(result.otherPlatforms).toEqual([]);
    });

    it("returns only supported platforms when all are linked", async () => {
      mockFindGameByIgdbId.mockResolvedValue(mockGame);
      mockFindPlatformsForGame.mockResolvedValue({
        supportedPlatforms: mockSupportedPlatforms,
        otherPlatforms: [],
      });

      const result = await getPlatformsForGame(validIgdbId);

      expect(result.supportedPlatforms).toEqual(mockSupportedPlatforms);
      expect(result.otherPlatforms).toEqual([]);
    });

    it("calls repositories in correct order", async () => {
      const callOrder: string[] = [];
      mockFindGameByIgdbId.mockImplementation(async () => {
        callOrder.push("findGameByIgdbId");
        return mockGame;
      });
      mockFindPlatformsForGame.mockImplementation(async () => {
        callOrder.push("findPlatformsForGame");
        return { supportedPlatforms: [], otherPlatforms: [] };
      });

      await getPlatformsForGame(validIgdbId);

      expect(callOrder).toEqual(["findGameByIgdbId", "findPlatformsForGame"]);
    });
  });

  describe("game not found", () => {
    it("throws NotFoundError when game does not exist", async () => {
      mockFindGameByIgdbId.mockResolvedValue(null);

      await expect(getPlatformsForGame(validIgdbId)).rejects.toThrow(
        NotFoundError
      );
      expect(mockFindPlatformsForGame).not.toHaveBeenCalled();
    });

    it("throws NotFoundError for zero igdbId", async () => {
      mockFindGameByIgdbId.mockResolvedValue(null);

      await expect(getPlatformsForGame(0)).rejects.toThrow(NotFoundError);
    });

    it("throws NotFoundError for negative igdbId", async () => {
      mockFindGameByIgdbId.mockResolvedValue(null);

      await expect(getPlatformsForGame(-1)).rejects.toThrow(NotFoundError);
    });

    it("throws NotFoundError for very large igdbId when not found", async () => {
      mockFindGameByIgdbId.mockResolvedValue(null);

      await expect(getPlatformsForGame(999999999)).rejects.toThrow(
        NotFoundError
      );
      expect(mockFindGameByIgdbId).toHaveBeenCalledWith(999999999);
    });
  });

  describe("repository errors propagate", () => {
    it("propagates error from findGameByIgdbId", async () => {
      mockFindGameByIgdbId.mockRejectedValue(
        new Error("Database connection failed")
      );

      await expect(getPlatformsForGame(validIgdbId)).rejects.toThrow(
        "Database connection failed"
      );
      expect(mockFindPlatformsForGame).not.toHaveBeenCalled();
    });

    it("propagates error from findPlatformsForGame", async () => {
      mockFindGameByIgdbId.mockResolvedValue(mockGame);
      mockFindPlatformsForGame.mockRejectedValue(
        new Error("Failed to query platforms")
      );

      await expect(getPlatformsForGame(validIgdbId)).rejects.toThrow(
        "Failed to query platforms"
      );
    });
  });
});

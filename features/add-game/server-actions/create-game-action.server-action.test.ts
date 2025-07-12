import { getServerUserId } from "@/auth";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { saveGameAndAddToBacklog } from "./add-game";
import { createGameAction } from "./create-game-action";

// Mock the add-game module
vi.mock("./add-game", () => ({
  saveGameAndAddToBacklog: vi.fn(),
}));

describe("createGameAction", () => {
  let mockGetServerUserId: ReturnType<typeof vi.mocked<typeof getServerUserId>>;
  let mockSaveGameAndAddToBacklog: ReturnType<
    typeof vi.mocked<typeof saveGameAndAddToBacklog>
  >;
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetServerUserId = vi.mocked(getServerUserId);
    mockSaveGameAndAddToBacklog = vi.mocked(saveGameAndAddToBacklog);
  });

  describe("when user is not authenticated", () => {
    it("should throw authentication error", async () => {
      mockGetServerUserId.mockResolvedValue(undefined);

      const result = await createGameAction({
        igdbId: 12345,
        platform: "PC",
        backlogStatus: "TO_PLAY",
        acquisitionType: "DIGITAL",
      });

      expect(result.serverError).toBe(
        "Authentication required. Please sign in to continue."
      );
    });
  });

  describe("when user is authenticated", () => {
    beforeEach(() => {
      mockGetServerUserId.mockResolvedValue("test-user-id");
    });

    describe("when input is invalid", () => {
      it("should throw validation error for invalid igdbId", async () => {
        const result = await createGameAction({
          // @ts-expect-error - we want to test the validation error
          igdbId: "invalid",
          platform: "PC",
          backlogStatus: "TO_PLAY",
          acquisitionType: "DIGITAL",
        });

        expect(result.serverError).toBeUndefined();
        expect(result.validationErrors?.fieldErrors).toBeDefined();
        expect(result.validationErrors?.fieldErrors?.igdbId).toBeDefined();
      });

      it("should throw validation error for invalid backlogStatus", async () => {
        const result = await createGameAction({
          igdbId: 12345,
          platform: "PC",
          // @ts-expect-error - we want to test the validation error
          backlogStatus: "INVALID_STATUS",
          acquisitionType: "DIGITAL",
        });

        expect(result.serverError).toBeUndefined();
        expect(result.validationErrors?.fieldErrors).toBeDefined();
        expect(
          result.validationErrors?.fieldErrors?.backlogStatus
        ).toBeDefined();
      });

      it("should throw validation error for invalid acquisitionType", async () => {
        const result = await createGameAction({
          igdbId: 12345,
          platform: "PC",
          backlogStatus: "TO_PLAY",
          // @ts-expect-error - we want to test the validation error
          acquisitionType: "INVALID_TYPE",
        });

        expect(result.serverError).toBeUndefined();
        expect(result.validationErrors?.fieldErrors).toBeDefined();
        expect(
          result.validationErrors?.fieldErrors?.acquisitionType
        ).toBeDefined();
      });
    });

    describe("when input is valid", () => {
      it("should create game and return game info", async () => {
        mockSaveGameAndAddToBacklog.mockResolvedValue({
          data: {
            id: "game-123",
            hltbId: null,
            title: "Test Game",
            igdbId: 12345,
            description: "",
            createdAt: new Date(),
            updatedAt: new Date(),
            coverImage: null,
            releaseDate: null,
            mainStory: null,
            mainExtra: null,
            completionist: null,
            steamAppId: null,
          },
        });

        const result = await createGameAction({
          igdbId: 12345,
          platform: "PC",
          backlogStatus: "TO_PLAY",
          acquisitionType: "DIGITAL",
        });

        expect(result.serverError).toBeUndefined();
        expect(result.validationErrors).toBeUndefined();
        expect(result.data?.gameTitle).toBe("Test Game");
        expect(result.data?.gameId).toBe("game-123");

        expect(mockSaveGameAndAddToBacklog).toHaveBeenCalledWith({
          game: {
            igdbId: 12345,
          },
          backlogItem: {
            acquisitionType: "DIGITAL",
            backlogStatus: "TO_PLAY",
            platform: "PC",
          },
        });
      });

      it("should create game with minimal required data", async () => {
        mockSaveGameAndAddToBacklog.mockResolvedValue({
          data: {
            id: "game-456",
            hltbId: null,
            title: "Minimal Game",
            description: "",
            igdbId: 67890,
            createdAt: new Date(),
            updatedAt: new Date(),
            coverImage: null,
            releaseDate: null,
            mainStory: null,
            mainExtra: null,
            completionist: null,
            steamAppId: null,
          },
        });

        const result = await createGameAction({
          igdbId: 67890,
          platform: "PC",
          backlogStatus: "TO_PLAY",
          acquisitionType: "DIGITAL",
        });

        expect(result.serverError).toBeUndefined();
        expect(result.validationErrors).toBeUndefined();
        expect(result.data?.gameTitle).toBe("Minimal Game");
        expect(result.data?.gameId).toBe("game-456");

        expect(mockSaveGameAndAddToBacklog).toHaveBeenCalledWith({
          game: {
            igdbId: 67890,
          },
          backlogItem: {
            acquisitionType: "DIGITAL",
            backlogStatus: "TO_PLAY",
            platform: "PC",
          },
        });
      });
    });
  });
});

import * as authModule from "@/auth";
import { LibraryService } from "@/data-access-layer/services/library/library-service";
import { AcquisitionType, LibraryItemStatus } from "@prisma/client";

import { addGameToLibraryAction } from "./add-game-to-library";

vi.mock("@/auth", () => ({
  getServerUserId: vi.fn(),
}));

vi.mock("@/data-access-layer/services/library/library-service", () => ({
  LibraryService: vi.fn(),
}));

describe("addGameToLibraryAction", () => {
  const mockUserId = "user-123";
  const mockGameId = "game-456";

  let mockLibraryService: {
    addGameToLibrary: ReturnType<typeof vi.fn>;
  };
  let mockGetServerUserId: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    vi.clearAllMocks();

    mockLibraryService = {
      addGameToLibrary: vi.fn(),
    };
    vi.mocked(LibraryService).mockImplementation(
      () => mockLibraryService as any
    );

    mockGetServerUserId = vi.mocked(authModule.getServerUserId);
    mockGetServerUserId.mockResolvedValue(mockUserId);
  });

  it("should successfully add game to library", async () => {
    mockLibraryService.addGameToLibrary.mockResolvedValue({
      success: true,
      data: {
        game: {
          id: mockGameId,
          igdbId: 12345,
          title: "Test Game",
          coverImage: null,
          hltbId: null,
          mainStory: null,
          mainExtra: null,
          completionist: null,
          releaseDate: null,
          description: null,
        },
      },
    });

    const result = await addGameToLibraryAction({
      igdbId: 12345,
      status: LibraryItemStatus.CURIOUS_ABOUT,
      platform: "PlayStation 5",
      acquisitionType: AcquisitionType.DIGITAL,
    });

    expect(result).toEqual({ success: true, gameId: mockGameId });
    expect(mockLibraryService.addGameToLibrary).toHaveBeenCalledWith({
      userId: mockUserId,
      igdbId: 12345,
      status: LibraryItemStatus.CURIOUS_ABOUT,
      platform: "PlayStation 5",
      acquisitionType: AcquisitionType.DIGITAL,
    });
  });

  it("should return error when user is not authenticated", async () => {
    mockGetServerUserId.mockResolvedValue(null);

    const result = await addGameToLibraryAction({
      igdbId: 12345,
      status: LibraryItemStatus.CURIOUS_ABOUT,
      platform: "PlayStation 5",
      acquisitionType: AcquisitionType.DIGITAL,
    });

    expect(result).toEqual({ success: false, error: "Unauthorized" });
    expect(mockLibraryService.addGameToLibrary).not.toHaveBeenCalled();
  });

  it("should return error when service fails", async () => {
    mockLibraryService.addGameToLibrary.mockResolvedValue({
      success: false,
      error: "Game not found",
    });

    const result = await addGameToLibraryAction({
      igdbId: 99999,
      status: LibraryItemStatus.CURIOUS_ABOUT,
      platform: "PlayStation 5",
      acquisitionType: AcquisitionType.DIGITAL,
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toBe("Game not found");
    }
  });

  it("should return error for invalid input (negative igdbId)", async () => {
    const result = await addGameToLibraryAction({
      igdbId: -1,
      status: LibraryItemStatus.CURIOUS_ABOUT,
      platform: "PlayStation 5",
      acquisitionType: AcquisitionType.DIGITAL,
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toBeDefined();
    }
    expect(mockLibraryService.addGameToLibrary).not.toHaveBeenCalled();
  });

  it("should return error when platform is empty", async () => {
    const result = await addGameToLibraryAction({
      igdbId: 12345,
      status: LibraryItemStatus.CURIOUS_ABOUT,
      platform: "",
      acquisitionType: AcquisitionType.DIGITAL,
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toContain("Platform is required");
    }
    expect(mockLibraryService.addGameToLibrary).not.toHaveBeenCalled();
  });

  it("should handle unexpected errors gracefully", async () => {
    mockLibraryService.addGameToLibrary.mockRejectedValue(
      new Error("Unexpected error")
    );

    const result = await addGameToLibraryAction({
      igdbId: 12345,
      status: LibraryItemStatus.CURIOUS_ABOUT,
      platform: "PlayStation 5",
      acquisitionType: AcquisitionType.DIGITAL,
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toBe("Unexpected error");
    }
  });
});

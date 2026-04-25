import { getServerUserId } from "@/auth";
import { LibraryService } from "@/data-access-layer/services";
import { LibraryItemStatus } from "@prisma/client";
import { revalidatePath } from "next/cache";

import { updateLibraryEntryAction } from "./update-library-entry-action";

vi.mock("@/auth", () => ({
  getServerUserId: vi.fn(),
}));

vi.mock("@/data-access-layer/services", () => ({
  LibraryService: vi.fn(),
}));

vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
}));

vi.mock("@/shared/lib", async (importOriginal) => {
  const original = await importOriginal<typeof import("@/shared/lib")>();
  return {
    ...original,
    createLogger: vi.fn(() => ({
      info: vi.fn(),
      warn: vi.fn(),
      error: vi.fn(),
      debug: vi.fn(),
    })),
  };
});

const mockGetServerUserId = vi.mocked(getServerUserId);
const mockRevalidatePath = vi.mocked(revalidatePath);
const MockLibraryService = vi.mocked(LibraryService);

describe("updateLibraryEntryAction", () => {
  let mockUpdateLibraryItem: ReturnType<typeof vi.fn>;

  const mockLibraryItem = {
    id: 1,
    userId: "user-123",
    gameId: "game-abc",
    status: LibraryItemStatus.PLAYING,
    platform: null,
    acquisitionType: "DIGITAL",
    startedAt: null,
    completedAt: null,
    statusChangedAt: null,
    createdAt: new Date("2025-01-01"),
    updatedAt: new Date("2025-01-01"),
  };

  beforeEach(() => {
    vi.clearAllMocks();

    mockUpdateLibraryItem = vi.fn();
    MockLibraryService.mockImplementation(function () {
      return {
        updateLibraryItem: mockUpdateLibraryItem,
      } as any;
    });

    mockGetServerUserId.mockResolvedValue("user-123");
  });

  describe("statusChangedAt on status update", () => {
    it("should pass statusChangedAt when status is included in update", async () => {
      const beforeCall = new Date();
      mockUpdateLibraryItem.mockResolvedValue({
        success: true,
        data: { ...mockLibraryItem, status: LibraryItemStatus.PLAYING },
      });

      await updateLibraryEntryAction({
        libraryItemId: 1,
        status: LibraryItemStatus.PLAYING,
      });

      const afterCall = new Date();

      expect(mockUpdateLibraryItem).toHaveBeenCalledOnce();
      const callArg = mockUpdateLibraryItem.mock.calls[0][0];
      const passedStatusChangedAt = callArg.libraryItem.statusChangedAt;

      expect(passedStatusChangedAt).toBeInstanceOf(Date);
      expect(passedStatusChangedAt.getTime()).toBeGreaterThanOrEqual(
        beforeCall.getTime()
      );
      expect(passedStatusChangedAt.getTime()).toBeLessThanOrEqual(
        afterCall.getTime()
      );
    });

    it("should pass statusChangedAt when status is included alongside other fields", async () => {
      mockUpdateLibraryItem.mockResolvedValue({
        success: true,
        data: {
          ...mockLibraryItem,
          status: LibraryItemStatus.PLAYED,
          startedAt: new Date("2025-05-01"),
          completedAt: new Date("2025-06-01"),
        },
      });

      await updateLibraryEntryAction({
        libraryItemId: 1,
        status: LibraryItemStatus.PLAYED,
        startedAt: new Date("2025-05-01"),
        completedAt: new Date("2025-06-01"),
      });

      const callArg = mockUpdateLibraryItem.mock.calls[0][0];
      expect(callArg.libraryItem.statusChangedAt).toBeInstanceOf(Date);
    });

    it("should reject input and NOT call service when status is omitted", async () => {
      const result = await updateLibraryEntryAction({
        libraryItemId: 1,
        startedAt: new Date("2025-05-01"),
      } as any);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBe("Invalid input data");
      }
      expect(mockUpdateLibraryItem).not.toHaveBeenCalled();
    });

    it("should call updateLibraryItem with correct userId and libraryItemId", async () => {
      mockGetServerUserId.mockResolvedValue("user-456");
      mockUpdateLibraryItem.mockResolvedValue({
        success: true,
        data: { ...mockLibraryItem, userId: "user-456" },
      });

      await updateLibraryEntryAction({
        libraryItemId: 99,
        status: LibraryItemStatus.SHELF,
      });

      expect(mockUpdateLibraryItem).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: "user-456",
          libraryItem: expect.objectContaining({
            id: 99,
            status: LibraryItemStatus.SHELF,
          }),
        })
      );
    });
  });

  describe("success path", () => {
    it("should revalidate game page on success", async () => {
      mockUpdateLibraryItem.mockResolvedValue({
        success: true,
        data: mockLibraryItem,
      });

      await updateLibraryEntryAction({
        libraryItemId: 1,
        status: LibraryItemStatus.PLAYING,
      });

      expect(mockRevalidatePath).toHaveBeenCalledWith("/games/[slug]", "page");
    });

    it("should return success with data from service", async () => {
      mockUpdateLibraryItem.mockResolvedValue({
        success: true,
        data: mockLibraryItem,
      });

      const result = await updateLibraryEntryAction({
        libraryItemId: 1,
        status: LibraryItemStatus.PLAYING,
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toEqual(mockLibraryItem);
      }
    });
  });

  describe("error path", () => {
    it("should return error when service fails", async () => {
      mockUpdateLibraryItem.mockResolvedValue({
        success: false,
        error: "Library item not found",
      });

      const result = await updateLibraryEntryAction({
        libraryItemId: 1,
        status: LibraryItemStatus.PLAYING,
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBe("Failed to update library entry");
      }
    });

    it("should not revalidate when service fails", async () => {
      mockUpdateLibraryItem.mockResolvedValue({
        success: false,
        error: "Some error",
      });

      await updateLibraryEntryAction({
        libraryItemId: 1,
        status: LibraryItemStatus.PLAYING,
      });

      expect(mockRevalidatePath).not.toHaveBeenCalled();
    });

    it("should return error when user is not authenticated", async () => {
      mockGetServerUserId.mockResolvedValue(undefined);

      const result = await updateLibraryEntryAction({
        libraryItemId: 1,
        status: LibraryItemStatus.PLAYING,
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toContain("logged in");
      }

      expect(mockUpdateLibraryItem).not.toHaveBeenCalled();
    });
  });

  describe("platform updates", () => {
    it("forwards a non-empty platform value to the service", async () => {
      mockUpdateLibraryItem.mockResolvedValue({
        success: true,
        data: { ...mockLibraryItem, platform: "PS5" },
      });

      const result = await updateLibraryEntryAction({
        libraryItemId: 1,
        status: LibraryItemStatus.PLAYING,
        platform: "PS5",
      });

      expect(result.success).toBe(true);
      const callArg = mockUpdateLibraryItem.mock.calls[0][0];
      expect(callArg.libraryItem.platform).toBe("PS5");
    });

    it("forwards null when platform is explicitly cleared", async () => {
      mockUpdateLibraryItem.mockResolvedValue({
        success: true,
        data: { ...mockLibraryItem, platform: null },
      });

      await updateLibraryEntryAction({
        libraryItemId: 1,
        status: LibraryItemStatus.PLAYING,
        platform: null,
      });

      const callArg = mockUpdateLibraryItem.mock.calls[0][0];
      expect(callArg.libraryItem.platform).toBeNull();
    });

    it("normalizes empty string to null before forwarding", async () => {
      mockUpdateLibraryItem.mockResolvedValue({
        success: true,
        data: { ...mockLibraryItem, platform: null },
      });

      await updateLibraryEntryAction({
        libraryItemId: 1,
        status: LibraryItemStatus.PLAYING,
        platform: "",
      });

      const callArg = mockUpdateLibraryItem.mock.calls[0][0];
      expect(callArg.libraryItem.platform).toBeNull();
    });

    it("omits platform when not present in input", async () => {
      mockUpdateLibraryItem.mockResolvedValue({
        success: true,
        data: mockLibraryItem,
      });

      await updateLibraryEntryAction({
        libraryItemId: 1,
        status: LibraryItemStatus.PLAYING,
      });

      const callArg = mockUpdateLibraryItem.mock.calls[0][0];
      expect("platform" in callArg.libraryItem).toBe(false);
    });

    it("rejects unauthenticated callers when platform is set", async () => {
      mockGetServerUserId.mockResolvedValue(undefined);

      const result = await updateLibraryEntryAction({
        libraryItemId: 1,
        status: LibraryItemStatus.PLAYING,
        platform: "PS5",
      });

      expect(result.success).toBe(false);
      expect(mockUpdateLibraryItem).not.toHaveBeenCalled();
    });
  });
});

import { LibraryService } from "@/data-access-layer/services/library/library-service";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { NotFoundError } from "@/shared/lib/errors";
import { LibraryItemStatus } from "@/shared/types";

import type { RequestContext } from "../types";
import { getStatusCountsHandler } from "./get-status-counts-handler";

vi.mock("@/data-access-layer/services/library/library-service");

const mockLibraryService = vi.mocked(LibraryService);

const ZEROED_COUNTS = Object.values(LibraryItemStatus).reduce(
  (acc, status) => ({ ...acc, [status]: 0 }),
  {} as Record<LibraryItemStatus, number>
);

describe("getStatusCountsHandler", () => {
  const mockContext: RequestContext = {
    ip: "192.168.1.1",
    headers: new Headers(),
    url: new URL("http://localhost/api/library/status-counts"),
  };

  let mockGetStatusCounts: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    vi.resetAllMocks();

    mockGetStatusCounts = vi.fn();

    mockLibraryService.mockImplementation(function () {
      return {
        getStatusCounts: mockGetStatusCounts,
      } as any;
    });
  });

  describe("Input Validation", () => {
    it("should reject invalid userId (not a CUID)", async () => {
      const result = await getStatusCountsHandler(
        { userId: "not-a-cuid" },
        mockContext
      );

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.status).toBe(400);
        expect(result.error).toContain("Invalid");
      }
      expect(mockGetStatusCounts).not.toHaveBeenCalled();
    });

    it("should accept valid userId with no optional filters", async () => {
      mockGetStatusCounts.mockResolvedValue(ZEROED_COUNTS);

      const result = await getStatusCountsHandler(
        { userId: "clx123abc456def789ghi" },
        mockContext
      );

      expect(result.success).toBe(true);
      expect(mockGetStatusCounts).toHaveBeenCalled();
    });

    it("should accept optional platform and search filters", async () => {
      mockGetStatusCounts.mockResolvedValue(ZEROED_COUNTS);

      const result = await getStatusCountsHandler(
        {
          userId: "clx123abc456def789ghi",
          platform: "PlayStation 5",
          search: "zelda",
        },
        mockContext
      );

      expect(result.success).toBe(true);
    });
  });

  describe("Orchestration", () => {
    it("should call LibraryService.getStatusCounts with validated input", async () => {
      mockGetStatusCounts.mockResolvedValue(ZEROED_COUNTS);

      await getStatusCountsHandler(
        {
          userId: "clx123abc456def789ghi",
          platform: "PC",
          search: "mario",
        },
        mockContext
      );

      expect(mockGetStatusCounts).toHaveBeenCalledWith({
        userId: "clx123abc456def789ghi",
        platform: "PC",
        search: "mario",
      });
    });
  });

  describe("Success Path", () => {
    it("should return counts data with HTTP 200 on success", async () => {
      const mockCounts: Record<LibraryItemStatus, number> = {
        ...ZEROED_COUNTS,
        [LibraryItemStatus.PLAYING]: 3,
        [LibraryItemStatus.WISHLIST]: 7,
      };

      mockGetStatusCounts.mockResolvedValue(mockCounts);

      const result = await getStatusCountsHandler(
        { userId: "clx123abc456def789ghi" },
        mockContext
      );

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.status).toBe(200);
        expect(result.data[LibraryItemStatus.PLAYING]).toBe(3);
        expect(result.data[LibraryItemStatus.WISHLIST]).toBe(7);
      }
    });
  });

  describe("Error Handling", () => {
    it("should return HTTP 500 when service throws an unexpected error", async () => {
      mockGetStatusCounts.mockRejectedValue(new Error("Database error"));

      const result = await getStatusCountsHandler(
        { userId: "clx123abc456def789ghi" },
        mockContext
      );

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.status).toBe(500);
        expect(result.error).toBe("Database error");
      }
    });

    it("should return HTTP 404 when service throws NotFoundError", async () => {
      mockGetStatusCounts.mockRejectedValue(
        new NotFoundError("Library not found")
      );

      const result = await getStatusCountsHandler(
        { userId: "clx123abc456def789ghi" },
        mockContext
      );

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.status).toBe(404);
        expect(result.error).toBe("Library not found");
      }
    });
  });
});

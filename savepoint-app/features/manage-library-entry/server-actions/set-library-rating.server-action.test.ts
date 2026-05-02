import { getServerUserId } from "@/auth";
import { LibraryService, ProfileService } from "@/data-access-layer/services";
import { revalidatePath } from "next/cache";

import { setLibraryRatingAction } from "./set-library-rating";

vi.mock("@/auth", () => ({
  getServerUserId: vi.fn(),
}));

vi.mock("@/data-access-layer/services", () => ({
  LibraryService: vi.fn(),
  ProfileService: vi.fn(),
}));

vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
  revalidateTag: vi.fn(),
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
const MockProfileService = vi.mocked(ProfileService);

describe("setLibraryRatingAction server action", () => {
  let mockSetRating: ReturnType<typeof vi.fn>;
  let mockGetProfile: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    vi.resetAllMocks();

    mockSetRating = vi.fn();
    MockLibraryService.mockImplementation(function () {
      return {
        setRating: mockSetRating,
      } as any;
    });

    mockGetProfile = vi.fn().mockResolvedValue({
      username: "testuser",
      image: null,
      email: null,
      name: null,
      createdAt: new Date(),
      isPublicProfile: true,
    });
    MockProfileService.mockImplementation(function () {
      return {
        getProfile: mockGetProfile,
      } as any;
    });

    mockGetServerUserId.mockResolvedValue("user-123");
  });

  describe("Happy path", () => {
    it("calls service with userId from session, revalidates both paths, and returns success", async () => {
      mockSetRating.mockResolvedValue(undefined);

      const result = await setLibraryRatingAction({
        libraryItemId: 42,
        rating: 8,
      });

      expect(result).toEqual({ success: true, data: undefined });

      expect(mockSetRating).toHaveBeenCalledWith({
        libraryItemId: 42,
        userId: "user-123",
        rating: 8,
      });

      expect(mockRevalidatePath).toHaveBeenCalledWith("/library");
      expect(mockRevalidatePath).toHaveBeenCalledWith("/u/testuser");
      expect(mockRevalidatePath).toHaveBeenCalledTimes(2);
    });

    it("accepts rating = null (clear rating) and still revalidates", async () => {
      mockSetRating.mockResolvedValue(undefined);

      const result = await setLibraryRatingAction({
        libraryItemId: 42,
        rating: null,
      });

      expect(result.success).toBe(true);
      expect(mockSetRating).toHaveBeenCalledWith({
        libraryItemId: 42,
        userId: "user-123",
        rating: null,
      });
      expect(mockRevalidatePath).toHaveBeenCalledWith("/library");
      expect(mockRevalidatePath).toHaveBeenCalledWith("/u/testuser");
    });
  });

  describe("Validation rejection", () => {
    it("rejects rating > 10 without calling service", async () => {
      const result = await setLibraryRatingAction({
        libraryItemId: 42,
        rating: 11,
      });

      expect(result).toEqual({
        success: false,
        error: "Invalid input data",
      });
      expect(mockSetRating).not.toHaveBeenCalled();
      expect(mockRevalidatePath).not.toHaveBeenCalled();
    });

    it("rejects non-integer libraryItemId without calling service", async () => {
      const result = await setLibraryRatingAction({
        libraryItemId: 42.5,
        rating: 5,
      });

      expect(result).toEqual({
        success: false,
        error: "Invalid input data",
      });
      expect(mockSetRating).not.toHaveBeenCalled();
      expect(mockRevalidatePath).not.toHaveBeenCalled();
    });

    it("rejects rating < 1 without calling service", async () => {
      const result = await setLibraryRatingAction({
        libraryItemId: 42,
        rating: 0,
      });

      expect(result).toEqual({
        success: false,
        error: "Invalid input data",
      });
      expect(mockSetRating).not.toHaveBeenCalled();
    });
  });

  describe("Unauthenticated rejection", () => {
    it("rejects when no session user is found", async () => {
      mockGetServerUserId.mockResolvedValue(undefined);

      const result = await setLibraryRatingAction({
        libraryItemId: 42,
        rating: 8,
      });

      expect(result).toEqual({
        success: false,
        error: "You must be logged in to perform this action",
      });
      expect(mockSetRating).not.toHaveBeenCalled();
      expect(mockRevalidatePath).not.toHaveBeenCalled();
    });
  });
});

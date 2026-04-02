import {
  countFollowers,
  countFollowing,
  createFollow,
  deleteFollow,
  DuplicateError,
  findFollowers,
  findFollowing,
  findUserById,
  isFollowing,
} from "@/data-access-layer/repository";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { ServiceErrorCode } from "../types";
import { SocialService } from "./social-service";

vi.mock("@/data-access-layer/repository", async (importOriginal) => {
  const actual =
    await importOriginal<typeof import("@/data-access-layer/repository")>();
  return {
    ...actual,
    findUserById: vi.fn(),
    createFollow: vi.fn(),
    deleteFollow: vi.fn(),
    isFollowing: vi.fn(),
    countFollowers: vi.fn(),
    countFollowing: vi.fn(),
    findFollowers: vi.fn(),
    findFollowing: vi.fn(),
  };
});

describe("SocialService", () => {
  let service: SocialService;
  let mockFindUserById: ReturnType<typeof vi.fn>;
  let mockCreateFollow: ReturnType<typeof vi.fn>;
  let mockDeleteFollow: ReturnType<typeof vi.fn>;
  let mockIsFollowing: ReturnType<typeof vi.fn>;
  let mockCountFollowers: ReturnType<typeof vi.fn>;
  let mockCountFollowing: ReturnType<typeof vi.fn>;
  let mockFindFollowers: ReturnType<typeof vi.fn>;
  let mockFindFollowing: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    vi.clearAllMocks();
    service = new SocialService();
    mockFindUserById = vi.mocked(findUserById);
    mockCreateFollow = vi.mocked(createFollow);
    mockDeleteFollow = vi.mocked(deleteFollow);
    mockIsFollowing = vi.mocked(isFollowing);
    mockCountFollowers = vi.mocked(countFollowers);
    mockCountFollowing = vi.mocked(countFollowing);
    mockFindFollowers = vi.mocked(findFollowers);
    mockFindFollowing = vi.mocked(findFollowing);
  });

  describe("followUser", () => {
    const followerId = "clxfollower123ab";
    const followingId = "clxfollowing456c";

    describe("self-follow prevention", () => {
      it("should return validation error when follower and following are the same user", async () => {
        const result = await service.followUser(followerId, followerId);

        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.code).toBe(ServiceErrorCode.VALIDATION_ERROR);
          expect(result.error).toBe("You cannot follow yourself");
        }

        expect(mockFindUserById).not.toHaveBeenCalled();
        expect(mockCreateFollow).not.toHaveBeenCalled();
      });
    });

    describe("target user not found", () => {
      it("should return not found error when target user does not exist", async () => {
        mockFindUserById.mockResolvedValue(null);

        const result = await service.followUser(followerId, followingId);

        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.code).toBe(ServiceErrorCode.NOT_FOUND);
          expect(result.error).toBe("User not found");
        }

        expect(mockFindUserById).toHaveBeenCalledWith(followingId, {
          select: { id: true, isPublicProfile: true },
        });
        expect(mockCreateFollow).not.toHaveBeenCalled();
      });
    });

    describe("target not public", () => {
      it("should return validation error when target user has a private profile", async () => {
        mockFindUserById.mockResolvedValue({
          id: followingId,
          isPublicProfile: false,
        });

        const result = await service.followUser(followerId, followingId);

        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.code).toBe(ServiceErrorCode.VALIDATION_ERROR);
          expect(result.error).toBe("Cannot follow a private profile");
        }

        expect(mockCreateFollow).not.toHaveBeenCalled();
      });
    });

    describe("duplicate follow", () => {
      it("should return conflict error when repository throws DuplicateError", async () => {
        mockFindUserById.mockResolvedValue({
          id: followingId,
          isPublicProfile: true,
        });
        mockCreateFollow.mockRejectedValue(
          new DuplicateError("Follow already exists")
        );

        const result = await service.followUser(followerId, followingId);

        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.code).toBe(ServiceErrorCode.CONFLICT);
          expect(result.error).toBe("Already following this user");
        }
      });
    });

    describe("happy path", () => {
      it("should return success when a valid follow is created", async () => {
        mockFindUserById.mockResolvedValue({
          id: followingId,
          isPublicProfile: true,
        });
        mockCreateFollow.mockResolvedValue(undefined);

        const result = await service.followUser(followerId, followingId);

        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.data).toBeUndefined();
        }

        expect(mockCreateFollow).toHaveBeenCalledWith(followerId, followingId);
      });
    });
  });

  describe("unfollowUser", () => {
    const followerId = "clxfollower123ab";
    const followingId = "clxfollowing456c";

    describe("happy path", () => {
      it("should call deleteFollow and return success", async () => {
        mockDeleteFollow.mockResolvedValue(undefined);

        const result = await service.unfollowUser(followerId, followingId);

        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.data).toBeUndefined();
        }

        expect(mockDeleteFollow).toHaveBeenCalledWith(followerId, followingId);
      });
    });
  });

  describe("isFollowing", () => {
    const followerId = "clxfollower123ab";
    const followingId = "clxfollowing456c";

    it("should return true when follower is following the target user", async () => {
      mockIsFollowing.mockResolvedValue(true);

      const result = await service.isFollowing(followerId, followingId);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toBe(true);
      }

      expect(mockIsFollowing).toHaveBeenCalledWith(followerId, followingId);
    });

    it("should return false when follower is not following the target user", async () => {
      mockIsFollowing.mockResolvedValue(false);

      const result = await service.isFollowing(followerId, followingId);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toBe(false);
      }

      expect(mockIsFollowing).toHaveBeenCalledWith(followerId, followingId);
    });
  });

  describe("getFollowCounts", () => {
    const userId = "clxuser1234567ab";

    it("should return combined follower and following counts", async () => {
      mockCountFollowers.mockResolvedValue(42);
      mockCountFollowing.mockResolvedValue(17);

      const result = await service.getFollowCounts(userId);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.followers).toBe(42);
        expect(result.data.following).toBe(17);
      }

      expect(mockCountFollowers).toHaveBeenCalledWith(userId);
      expect(mockCountFollowing).toHaveBeenCalledWith(userId);
    });
  });

  describe("getFollowers", () => {
    const userId = "clxuser1234567ab";
    const mockPaginatedResult = {
      followers: [],
      total: 0,
    };

    it("should return NOT_FOUND when user does not exist", async () => {
      mockFindUserById.mockResolvedValue(null);

      const result = await service.getFollowers(userId, 1);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.code).toBe(ServiceErrorCode.NOT_FOUND);
      }

      expect(mockFindFollowers).not.toHaveBeenCalled();
    });

    it("should return NOT_FOUND when user has a private profile", async () => {
      mockFindUserById.mockResolvedValue({
        id: userId,
        isPublicProfile: false,
      });

      const result = await service.getFollowers(userId, 1);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.code).toBe(ServiceErrorCode.NOT_FOUND);
      }

      expect(mockFindFollowers).not.toHaveBeenCalled();
    });

    it("should call findFollowers with skip=0 and take=20 for the first page", async () => {
      mockFindUserById.mockResolvedValue({
        id: userId,
        isPublicProfile: true,
      });
      mockFindFollowers.mockResolvedValue(mockPaginatedResult);

      const result = await service.getFollowers(userId, 1);

      expect(result.success).toBe(true);

      expect(mockFindFollowers).toHaveBeenCalledWith(userId, {
        skip: 0,
        take: 20,
      });
    });

    it("should calculate the correct skip offset for subsequent pages", async () => {
      mockFindUserById.mockResolvedValue({
        id: userId,
        isPublicProfile: true,
      });
      mockFindFollowers.mockResolvedValue(mockPaginatedResult);

      await service.getFollowers(userId, 3);

      expect(mockFindFollowers).toHaveBeenCalledWith(userId, {
        skip: 40,
        take: 20,
      });
    });

    it("should default to page 1 when page is not provided", async () => {
      mockFindUserById.mockResolvedValue({
        id: userId,
        isPublicProfile: true,
      });
      mockFindFollowers.mockResolvedValue(mockPaginatedResult);

      await service.getFollowers(userId);

      expect(mockFindFollowers).toHaveBeenCalledWith(userId, {
        skip: 0,
        take: 20,
      });
    });

    it("should return the paginated result from the repository", async () => {
      mockFindUserById.mockResolvedValue({
        id: userId,
        isPublicProfile: true,
      });
      mockFindFollowers.mockResolvedValue(mockPaginatedResult);

      const result = await service.getFollowers(userId, 1);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toEqual(mockPaginatedResult);
      }
    });
  });

  describe("getFollowing", () => {
    const userId = "clxuser1234567ab";
    const mockPaginatedResult = {
      following: [],
      total: 0,
    };

    it("should return NOT_FOUND when user does not exist", async () => {
      mockFindUserById.mockResolvedValue(null);

      const result = await service.getFollowing(userId, 1);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.code).toBe(ServiceErrorCode.NOT_FOUND);
      }

      expect(mockFindFollowing).not.toHaveBeenCalled();
    });

    it("should return NOT_FOUND when user has a private profile", async () => {
      mockFindUserById.mockResolvedValue({
        id: userId,
        isPublicProfile: false,
      });

      const result = await service.getFollowing(userId, 1);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.code).toBe(ServiceErrorCode.NOT_FOUND);
      }

      expect(mockFindFollowing).not.toHaveBeenCalled();
    });

    it("should call findFollowing with skip=0 and take=20 for the first page", async () => {
      mockFindUserById.mockResolvedValue({
        id: userId,
        isPublicProfile: true,
      });
      mockFindFollowing.mockResolvedValue(mockPaginatedResult);

      const result = await service.getFollowing(userId, 1);

      expect(result.success).toBe(true);

      expect(mockFindFollowing).toHaveBeenCalledWith(userId, {
        skip: 0,
        take: 20,
      });
    });

    it("should calculate the correct skip offset for subsequent pages", async () => {
      mockFindUserById.mockResolvedValue({
        id: userId,
        isPublicProfile: true,
      });
      mockFindFollowing.mockResolvedValue(mockPaginatedResult);

      await service.getFollowing(userId, 2);

      expect(mockFindFollowing).toHaveBeenCalledWith(userId, {
        skip: 20,
        take: 20,
      });
    });

    it("should default to page 1 when page is not provided", async () => {
      mockFindUserById.mockResolvedValue({
        id: userId,
        isPublicProfile: true,
      });
      mockFindFollowing.mockResolvedValue(mockPaginatedResult);

      await service.getFollowing(userId);

      expect(mockFindFollowing).toHaveBeenCalledWith(userId, {
        skip: 0,
        take: 20,
      });
    });

    it("should return the paginated result from the repository", async () => {
      mockFindUserById.mockResolvedValue({
        id: userId,
        isPublicProfile: true,
      });
      mockFindFollowing.mockResolvedValue(mockPaginatedResult);

      const result = await service.getFollowing(userId, 1);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toEqual(mockPaginatedResult);
      }
    });
  });
});

import {
  countFollowers,
  countFollowing,
  createFollow,
  deleteFollow,
  findFollowers,
  findFollowing,
  findUserById,
  isFollowing,
} from "@/data-access-layer/repository";
import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  ConflictError,
  NotFoundError,
  UnauthorizedError,
} from "@/shared/lib/errors";

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
    vi.resetAllMocks();
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
      it("should throw ConflictError when follower and following are the same user", async () => {
        await expect(
          service.followUser(followerId, followerId)
        ).rejects.toThrow(ConflictError);

        expect(mockFindUserById).not.toHaveBeenCalled();
        expect(mockCreateFollow).not.toHaveBeenCalled();
      });

      it("should include the correct message when self-following", async () => {
        await expect(
          service.followUser(followerId, followerId)
        ).rejects.toThrow("You cannot follow yourself");
      });
    });

    describe("target user not found", () => {
      it("should throw NotFoundError when target user does not exist", async () => {
        mockFindUserById.mockResolvedValue(null);

        await expect(
          service.followUser(followerId, followingId)
        ).rejects.toThrow(NotFoundError);

        expect(mockFindUserById).toHaveBeenCalledWith(followingId, {
          select: { id: true, isPublicProfile: true },
        });
        expect(mockCreateFollow).not.toHaveBeenCalled();
      });

      it("should include 'User not found' in the error message", async () => {
        mockFindUserById.mockResolvedValue(null);

        await expect(
          service.followUser(followerId, followingId)
        ).rejects.toThrow("User not found");
      });
    });

    describe("target not public", () => {
      it("should throw UnauthorizedError when target user has a private profile", async () => {
        mockFindUserById.mockResolvedValue({
          id: followingId,
          isPublicProfile: false,
        });

        await expect(
          service.followUser(followerId, followingId)
        ).rejects.toThrow(UnauthorizedError);

        expect(mockCreateFollow).not.toHaveBeenCalled();
      });

      it("should include 'Cannot follow a private profile' in the error message", async () => {
        mockFindUserById.mockResolvedValue({
          id: followingId,
          isPublicProfile: false,
        });

        await expect(
          service.followUser(followerId, followingId)
        ).rejects.toThrow("Cannot follow a private profile");
      });
    });

    describe("duplicate follow", () => {
      it("should propagate ConflictError from repository when already following", async () => {
        mockFindUserById.mockResolvedValue({
          id: followingId,
          isPublicProfile: true,
        });
        mockCreateFollow.mockRejectedValue(
          new ConflictError("Already following this user")
        );

        await expect(
          service.followUser(followerId, followingId)
        ).rejects.toThrow(ConflictError);
      });
    });

    describe("happy path", () => {
      it("should resolve when a valid follow is created", async () => {
        mockFindUserById.mockResolvedValue({
          id: followingId,
          isPublicProfile: true,
        });
        mockCreateFollow.mockResolvedValue(undefined);

        await expect(
          service.followUser(followerId, followingId)
        ).resolves.toBeUndefined();

        expect(mockCreateFollow).toHaveBeenCalledWith(followerId, followingId);
      });
    });
  });

  describe("unfollowUser", () => {
    const followerId = "clxfollower123ab";
    const followingId = "clxfollowing456c";

    describe("happy path", () => {
      it("should call deleteFollow and resolve", async () => {
        mockDeleteFollow.mockResolvedValue(undefined);

        await expect(
          service.unfollowUser(followerId, followingId)
        ).resolves.toBeUndefined();

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

      expect(result).toBe(true);
      expect(mockIsFollowing).toHaveBeenCalledWith(followerId, followingId);
    });

    it("should return false when follower is not following the target user", async () => {
      mockIsFollowing.mockResolvedValue(false);

      const result = await service.isFollowing(followerId, followingId);

      expect(result).toBe(false);
      expect(mockIsFollowing).toHaveBeenCalledWith(followerId, followingId);
    });
  });

  describe("getFollowCounts", () => {
    const userId = "clxuser1234567ab";

    it("should return combined follower and following counts", async () => {
      mockCountFollowers.mockResolvedValue(42);
      mockCountFollowing.mockResolvedValue(17);

      const result = await service.getFollowCounts(userId);

      expect(result.followers).toBe(42);
      expect(result.following).toBe(17);

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

    it("should throw NotFoundError when user does not exist", async () => {
      mockFindUserById.mockResolvedValue(null);

      await expect(service.getFollowers(userId, 1)).rejects.toThrow(
        NotFoundError
      );

      expect(mockFindFollowers).not.toHaveBeenCalled();
    });

    it("should throw NotFoundError when user has a private profile", async () => {
      mockFindUserById.mockResolvedValue({
        id: userId,
        isPublicProfile: false,
      });

      await expect(service.getFollowers(userId, 1)).rejects.toThrow(
        NotFoundError
      );

      expect(mockFindFollowers).not.toHaveBeenCalled();
    });

    it("should call findFollowers with skip=0 and take=20 for the first page", async () => {
      mockFindUserById.mockResolvedValue({
        id: userId,
        isPublicProfile: true,
      });
      mockFindFollowers.mockResolvedValue(mockPaginatedResult);

      await service.getFollowers(userId, 1);

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

      expect(result).toEqual(mockPaginatedResult);
    });
  });

  describe("getFollowing", () => {
    const userId = "clxuser1234567ab";
    const mockPaginatedResult = {
      following: [],
      total: 0,
    };

    it("should throw NotFoundError when user does not exist", async () => {
      mockFindUserById.mockResolvedValue(null);

      await expect(service.getFollowing(userId, 1)).rejects.toThrow(
        NotFoundError
      );

      expect(mockFindFollowing).not.toHaveBeenCalled();
    });

    it("should throw NotFoundError when user has a private profile", async () => {
      mockFindUserById.mockResolvedValue({
        id: userId,
        isPublicProfile: false,
      });

      await expect(service.getFollowing(userId, 1)).rejects.toThrow(
        NotFoundError
      );

      expect(mockFindFollowing).not.toHaveBeenCalled();
    });

    it("should call findFollowing with skip=0 and take=20 for the first page", async () => {
      mockFindUserById.mockResolvedValue({
        id: userId,
        isPublicProfile: true,
      });
      mockFindFollowing.mockResolvedValue(mockPaginatedResult);

      await service.getFollowing(userId, 1);

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

      expect(result).toEqual(mockPaginatedResult);
    });
  });
});

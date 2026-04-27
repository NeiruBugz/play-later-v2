import { ProfileService } from "@/data-access-layer/services/profile/profile-service";
import { SocialService } from "@/data-access-layer/services/social/social-service";

import { getProfilePageData } from "./get-profile-page-data";

vi.mock("@/data-access-layer/services/profile/profile-service", () => ({
  ProfileService: vi.fn(),
}));

vi.mock("@/data-access-layer/services/social/social-service", () => ({
  SocialService: vi.fn(),
}));

const PROFILE_USER_ID = "profile-user-id";
const VIEWER_USER_ID = "viewer-user-id";
const USERNAME = "gameruser";

const ratingHistogramFixture = [
  { rating: 1, count: 0 },
  { rating: 2, count: 1 },
  { rating: 3, count: 0 },
  { rating: 4, count: 2 },
  { rating: 5, count: 1 },
  { rating: 6, count: 0 },
  { rating: 7, count: 3 },
  { rating: 8, count: 4 },
  { rating: 9, count: 2 },
  { rating: 10, count: 1 },
];

const baseProfileWithStats = {
  username: USERNAME,
  name: "Gamer User",
  email: "gamer@example.com",
  image: "https://example.com/avatar.jpg",
  createdAt: new Date("2024-01-15T00:00:00.000Z"),
  isPublicProfile: true,
  id: PROFILE_USER_ID,
  stats: {
    statusCounts: { PLAYING: 3, PLAYED: 10, WISHLIST: 5 },
    recentGames: [
      {
        gameId: "game-1",
        title: "Elden Ring",
        coverImage: "https://example.com/cover.jpg",
        lastPlayed: new Date("2025-01-10T00:00:00.000Z"),
      },
    ],
    journalCount: 7,
  },
  libraryPreview: [
    {
      title: "Elden Ring",
      coverImage: "https://example.com/cover.jpg",
      slug: "elden-ring",
    },
  ],
  ratingHistogram: ratingHistogramFixture,
  ratedCount: 14,
};

const followCounts = { followers: 42, following: 13 };

describe("getProfilePageData", () => {
  let mockProfileService: {
    getProfileWithStats: ReturnType<typeof vi.fn>;
    getPublicProfile: ReturnType<typeof vi.fn>;
  };
  let mockSocialService: {
    getFollowCounts: ReturnType<typeof vi.fn>;
    isFollowing: ReturnType<typeof vi.fn>;
  };

  beforeEach(() => {
    vi.clearAllMocks();

    mockProfileService = {
      getProfileWithStats: vi.fn(),
      getPublicProfile: vi.fn(),
    };

    mockSocialService = {
      getFollowCounts: vi.fn(),
      isFollowing: vi.fn(),
    };

    vi.mocked(ProfileService).mockImplementation(function () {
      return mockProfileService as unknown as ProfileService;
    });

    vi.mocked(SocialService).mockImplementation(function () {
      return mockSocialService as unknown as SocialService;
    });

    mockSocialService.getFollowCounts.mockResolvedValue({
      success: true,
      data: followCounts,
    });
  });

  describe("path 1: owner viewing own profile (public)", () => {
    beforeEach(() => {
      mockProfileService.getProfileWithStats.mockResolvedValue({
        success: true,
        data: { profile: baseProfileWithStats },
      });
    });

    it("should NOT include email in the returned profile — email never serialized to public DTO", async () => {
      const result = await getProfilePageData(USERNAME, PROFILE_USER_ID);

      expect(result.success).toBe(true);
      if (result.success) {
        expect("email" in result.data.profile).toBe(false);
      }
    });

    it("should return stats and libraryPreview", async () => {
      const result = await getProfilePageData(USERNAME, PROFILE_USER_ID);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.stats).toBeDefined();
        expect(result.data.libraryPreview).toBeDefined();
      }
    });

    it("should include ratingHistogram and ratedCount in stats", async () => {
      const result = await getProfilePageData(USERNAME, PROFILE_USER_ID);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.stats?.ratingHistogram).toEqual(
          ratingHistogramFixture
        );
        expect(result.data.stats?.ratedCount).toBe(14);
      }
    });

    it("should return viewer.isOwner=true and isPrivate=false", async () => {
      const result = await getProfilePageData(USERNAME, PROFILE_USER_ID);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.viewer.isOwner).toBe(true);
        expect(result.data.viewer.isAuthenticated).toBe(true);
        expect(result.data.isPrivate).toBe(false);
      }
    });

    it("should return socialCounts from SocialService", async () => {
      const result = await getProfilePageData(USERNAME, PROFILE_USER_ID);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.socialCounts).toEqual(followCounts);
      }
    });

    it("should NOT call isFollowing — owner does not follow themselves", async () => {
      await getProfilePageData(USERNAME, PROFILE_USER_ID);

      expect(mockSocialService.isFollowing).not.toHaveBeenCalled();
    });

    it("should NOT include isFollowing in viewer", async () => {
      const result = await getProfilePageData(USERNAME, PROFILE_USER_ID);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.viewer.isFollowing).toBeUndefined();
      }
    });

    it("should call getProfileWithStats for the owner (to load full stats)", async () => {
      await getProfilePageData(USERNAME, PROFILE_USER_ID);

      expect(mockProfileService.getProfileWithStats).toHaveBeenCalled();
    });
  });

  describe("path 2: authenticated visitor on public profile", () => {
    beforeEach(() => {
      mockProfileService.getPublicProfile.mockResolvedValue({
        success: true,
        data: {
          profile: {
            id: PROFILE_USER_ID,
            username: USERNAME,
            name: "Gamer User",
            image: "https://example.com/avatar.jpg",
            gameCount: 18,
            libraryPreview: baseProfileWithStats.libraryPreview,
            isPublicProfile: true,
            createdAt: baseProfileWithStats.createdAt,
          },
        },
      });

      mockProfileService.getProfileWithStats.mockImplementation(
        async ({ userId }: { userId: string }) => {
          if (userId === PROFILE_USER_ID) {
            return {
              success: true,
              data: { profile: baseProfileWithStats },
            };
          }
          return {
            success: true,
            data: {
              profile: {
                ...baseProfileWithStats,
                id: userId,
                username: "different-viewer",
                email: "viewer@example.com",
              },
            },
          };
        }
      );

      mockSocialService.isFollowing.mockResolvedValue({
        success: true,
        data: false,
      });
    });

    it("should NOT include email in the returned profile", async () => {
      const result = await getProfilePageData(USERNAME, VIEWER_USER_ID);

      expect(result.success).toBe(true);
      if (result.success) {
        expect("email" in result.data.profile).toBe(false);
      }
    });

    it("should include stats and libraryPreview", async () => {
      const result = await getProfilePageData(USERNAME, VIEWER_USER_ID);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.stats).toBeDefined();
        expect(result.data.libraryPreview).toBeDefined();
      }
    });

    it("should include ratingHistogram and ratedCount in stats", async () => {
      const result = await getProfilePageData(USERNAME, VIEWER_USER_ID);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.stats?.ratingHistogram).toEqual(
          ratingHistogramFixture
        );
        expect(result.data.stats?.ratedCount).toBe(14);
      }
    });

    it("should return viewer.isOwner=false and isPrivate=false", async () => {
      const result = await getProfilePageData(USERNAME, VIEWER_USER_ID);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.viewer.isOwner).toBe(false);
        expect(result.data.viewer.isAuthenticated).toBe(true);
        expect(result.data.isPrivate).toBe(false);
      }
    });

    it("should call isFollowing and return result in viewer", async () => {
      mockSocialService.isFollowing.mockResolvedValue({
        success: true,
        data: true,
      });

      const result = await getProfilePageData(USERNAME, VIEWER_USER_ID);

      expect(mockSocialService.isFollowing).toHaveBeenCalledWith(
        VIEWER_USER_ID,
        PROFILE_USER_ID
      );
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.viewer.isFollowing).toBe(true);
      }
    });

    it("should call getPublicProfile for a visitor", async () => {
      await getProfilePageData(USERNAME, VIEWER_USER_ID);

      expect(mockProfileService.getPublicProfile).toHaveBeenCalled();
    });
  });

  describe("path 3: unauthenticated visitor on public profile", () => {
    beforeEach(() => {
      mockProfileService.getPublicProfile.mockResolvedValue({
        success: true,
        data: {
          profile: {
            id: PROFILE_USER_ID,
            username: USERNAME,
            name: "Gamer User",
            image: "https://example.com/avatar.jpg",
            gameCount: 18,
            libraryPreview: baseProfileWithStats.libraryPreview,
            isPublicProfile: true,
            createdAt: baseProfileWithStats.createdAt,
          },
        },
      });

      mockProfileService.getProfileWithStats.mockResolvedValue({
        success: true,
        data: { profile: baseProfileWithStats },
      });
    });

    it("should NOT include email in the returned profile", async () => {
      const result = await getProfilePageData(USERNAME);

      expect(result.success).toBe(true);
      if (result.success) {
        expect("email" in result.data.profile).toBe(false);
      }
    });

    it("should include stats and libraryPreview for a public profile", async () => {
      const result = await getProfilePageData(USERNAME);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.stats).toBeDefined();
        expect(result.data.libraryPreview).toBeDefined();
      }
    });

    it("should return viewer.isAuthenticated=false and isPrivate=false", async () => {
      const result = await getProfilePageData(USERNAME);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.viewer.isAuthenticated).toBe(false);
        expect(result.data.viewer.isOwner).toBe(false);
        expect(result.data.isPrivate).toBe(false);
      }
    });

    it("should NOT call isFollowing for an unauthenticated visitor", async () => {
      await getProfilePageData(USERNAME);

      expect(mockSocialService.isFollowing).not.toHaveBeenCalled();
    });

    it("should NOT include isFollowing in viewer", async () => {
      const result = await getProfilePageData(USERNAME);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.viewer.isFollowing).toBeUndefined();
      }
    });

    it("should still return socialCounts", async () => {
      const result = await getProfilePageData(USERNAME);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.socialCounts).toEqual(followCounts);
      }
    });
  });

  describe("path 4: any visitor on private profile (non-owner)", () => {
    beforeEach(() => {
      mockProfileService.getPublicProfile.mockResolvedValue({
        success: true,
        data: {
          profile: {
            id: PROFILE_USER_ID,
            username: USERNAME,
            name: "Gamer User",
            image: "https://example.com/avatar.jpg",
            gameCount: 0,
            libraryPreview: [],
            isPublicProfile: false,
            createdAt: baseProfileWithStats.createdAt,
          },
        },
      });
    });

    it("should return isPrivate=true for non-owner on a private profile", async () => {
      const result = await getProfilePageData(USERNAME, VIEWER_USER_ID);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.isPrivate).toBe(true);
      }
    });

    it("should omit stats when profile is private and viewer is not owner", async () => {
      const result = await getProfilePageData(USERNAME, VIEWER_USER_ID);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.stats).toBeUndefined();
      }
    });

    it("should omit ratingHistogram and ratedCount when profile is private and viewer is not owner", async () => {
      const result = await getProfilePageData(USERNAME, VIEWER_USER_ID);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.stats?.ratingHistogram).toBeUndefined();
        expect(result.data.stats?.ratedCount).toBeUndefined();
      }
    });

    it("should omit libraryPreview when profile is private and viewer is not owner", async () => {
      const result = await getProfilePageData(USERNAME, VIEWER_USER_ID);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.libraryPreview).toBeUndefined();
      }
    });

    it("should NOT include email in the returned profile", async () => {
      const result = await getProfilePageData(USERNAME, VIEWER_USER_ID);

      expect(result.success).toBe(true);
      if (result.success) {
        expect("email" in result.data.profile).toBe(false);
      }
    });

    it("should still return socialCounts even for private profiles", async () => {
      const result = await getProfilePageData(USERNAME, VIEWER_USER_ID);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.socialCounts).toEqual(followCounts);
      }
    });

    it("should NOT call isFollowing for a private profile visitor", async () => {
      await getProfilePageData(USERNAME, VIEWER_USER_ID);

      expect(mockSocialService.isFollowing).not.toHaveBeenCalled();
    });

    it("should also be isPrivate=true for an unauthenticated visitor on a private profile", async () => {
      const result = await getProfilePageData(USERNAME);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.isPrivate).toBe(true);
        expect(result.data.stats).toBeUndefined();
        expect(result.data.libraryPreview).toBeUndefined();
      }
    });

    it("should return viewer.isOwner=false and viewer.isAuthenticated=true for authenticated non-owner on private profile", async () => {
      const result = await getProfilePageData(USERNAME, VIEWER_USER_ID);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.viewer.isOwner).toBe(false);
        expect(result.data.viewer.isAuthenticated).toBe(true);
      }
    });

    it("should return gameCount=0 for a private profile regardless of actual game count", async () => {
      const result = await getProfilePageData(USERNAME, VIEWER_USER_ID);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.gameCount).toBe(0);
      }
    });

    it("should NOT include isFollowing in viewer for authenticated non-owner on private profile", async () => {
      const result = await getProfilePageData(USERNAME, VIEWER_USER_ID);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.viewer.isFollowing).toBeUndefined();
      }
    });
  });

  describe("path 5: owner viewing their own private profile", () => {
    beforeEach(() => {
      mockProfileService.getProfileWithStats.mockResolvedValue({
        success: true,
        data: {
          profile: {
            ...baseProfileWithStats,
            isPublicProfile: false,
          },
        },
      });
    });

    it("should return isPrivate=false — owner bypasses privacy gate", async () => {
      const result = await getProfilePageData(USERNAME, PROFILE_USER_ID);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.isPrivate).toBe(false);
      }
    });

    it("should return full stats for owner on their own private profile", async () => {
      const result = await getProfilePageData(USERNAME, PROFILE_USER_ID);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.stats).toBeDefined();
        expect(result.data.libraryPreview).toBeDefined();
      }
    });

    it("should NOT include email even for owner — email never serialized to profile DTO", async () => {
      const result = await getProfilePageData(USERNAME, PROFILE_USER_ID);

      expect(result.success).toBe(true);
      if (result.success) {
        expect("email" in result.data.profile).toBe(false);
      }
    });

    it("should mark viewer.isOwner=true", async () => {
      const result = await getProfilePageData(USERNAME, PROFILE_USER_ID);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.viewer.isOwner).toBe(true);
      }
    });

    it("should NOT call isFollowing", async () => {
      await getProfilePageData(USERNAME, PROFILE_USER_ID);

      expect(mockSocialService.isFollowing).not.toHaveBeenCalled();
    });
  });

  describe("email exclusion invariant — all code paths", () => {
    it("should never include email in profile for owner (public profile)", async () => {
      mockProfileService.getProfileWithStats.mockResolvedValue({
        success: true,
        data: { profile: baseProfileWithStats },
      });

      const result = await getProfilePageData(USERNAME, PROFILE_USER_ID);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(Object.keys(result.data.profile)).not.toContain("email");
      }
    });

    it("should never include email in profile for visitor (public profile)", async () => {
      mockProfileService.getPublicProfile.mockResolvedValue({
        success: true,
        data: {
          profile: {
            id: PROFILE_USER_ID,
            username: USERNAME,
            name: "Gamer User",
            image: null,
            gameCount: 5,
            libraryPreview: [],
            isPublicProfile: true,
            createdAt: baseProfileWithStats.createdAt,
          },
        },
      });
      mockProfileService.getProfileWithStats.mockResolvedValue({
        success: true,
        data: { profile: baseProfileWithStats },
      });
      mockSocialService.isFollowing.mockResolvedValue({
        success: true,
        data: false,
      });

      const result = await getProfilePageData(USERNAME, VIEWER_USER_ID);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(Object.keys(result.data.profile)).not.toContain("email");
      }
    });

    it("should never include email in profile for unauthenticated visitor", async () => {
      mockProfileService.getPublicProfile.mockResolvedValue({
        success: true,
        data: {
          profile: {
            id: PROFILE_USER_ID,
            username: USERNAME,
            name: "Gamer User",
            image: null,
            gameCount: 5,
            libraryPreview: [],
            isPublicProfile: true,
            createdAt: baseProfileWithStats.createdAt,
          },
        },
      });
      mockProfileService.getProfileWithStats.mockResolvedValue({
        success: true,
        data: { profile: baseProfileWithStats },
      });

      const result = await getProfilePageData(USERNAME);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(Object.keys(result.data.profile)).not.toContain("email");
      }
    });
  });

  describe("error propagation", () => {
    it("should propagate failure when ProfileService.getPublicProfile returns an error", async () => {
      mockProfileService.getPublicProfile.mockResolvedValue({
        success: false,
        error: { code: "NOT_FOUND", message: "User not found" },
      });

      const result = await getProfilePageData(USERNAME, VIEWER_USER_ID);

      expect(result.success).toBe(false);
      expect(mockSocialService.getFollowCounts).not.toHaveBeenCalled();
      expect(mockSocialService.isFollowing).not.toHaveBeenCalled();
    });

    it("should propagate failure when ProfileService.getProfileWithStats returns an error", async () => {
      mockProfileService.getProfileWithStats.mockResolvedValue({
        success: false,
        error: { code: "NOT_FOUND", message: "User not found" },
      });

      const result = await getProfilePageData(USERNAME, PROFILE_USER_ID);

      expect(result.success).toBe(false);
      expect(mockSocialService.getFollowCounts).not.toHaveBeenCalled();
    });

    it("should propagate failure when SocialService.getFollowCounts returns an error", async () => {
      mockProfileService.getPublicProfile.mockResolvedValue({
        success: true,
        data: {
          profile: {
            id: PROFILE_USER_ID,
            username: USERNAME,
            name: "Gamer User",
            image: null,
            gameCount: 5,
            libraryPreview: [],
            isPublicProfile: true,
            createdAt: baseProfileWithStats.createdAt,
          },
        },
      });

      mockSocialService.getFollowCounts.mockResolvedValue({
        success: false,
        error: { code: "INTERNAL_ERROR", message: "Database error" },
      });

      const result = await getProfilePageData(USERNAME, VIEWER_USER_ID);

      expect(result.success).toBe(false);
    });

    it("should propagate failure when visitor-branch getProfileWithStats returns an error", async () => {
      mockProfileService.getPublicProfile.mockResolvedValue({
        success: true,
        data: {
          profile: {
            id: PROFILE_USER_ID,
            username: USERNAME,
            name: "Gamer User",
            image: null,
            gameCount: 5,
            libraryPreview: [],
            isPublicProfile: true,
            createdAt: baseProfileWithStats.createdAt,
          },
        },
      });

      mockProfileService.getProfileWithStats.mockImplementation(
        async ({ userId }: { userId: string }) => {
          if (userId === PROFILE_USER_ID) {
            return {
              success: false,
              error: { code: "NOT_FOUND", message: "User not found" },
            };
          }
          return {
            success: true,
            data: {
              profile: {
                ...baseProfileWithStats,
                id: userId,
                username: "different-viewer",
              },
            },
          };
        }
      );

      const result = await getProfilePageData(USERNAME, VIEWER_USER_ID);

      expect(result.success).toBe(false);
    });

    it("should return failure when getPublicProfile returns profile: null (user not found)", async () => {
      mockProfileService.getPublicProfile.mockResolvedValue({
        success: true,
        data: { profile: null },
      });

      const result = await getProfilePageData(USERNAME, VIEWER_USER_ID);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBe("Profile not found");
      }
    });
  });
});

import type { ProfileWithStats } from "@/shared/types/profile";

export function createProfileFixture(
  overrides?: Partial<ProfileWithStats>
): ProfileWithStats {
  return {
    username: "testuser",
    name: "Test User",
    email: "test@example.com",
    image: "https://example.com/avatar.jpg",
    createdAt: new Date("2024-01-15T00:00:00.000Z"),
    stats: {
      statusCounts: {
        WANT_TO_PLAY: 5,
        PLAYING: 3,
        PLAYED: 10,
      },
      recentGames: [
        {
          gameId: "1",
          title: "The Legend of Zelda",
          coverImage: "zelda-cover",
          lastPlayed: new Date("2025-01-15T12:00:00.000Z"),
        },
        {
          gameId: "2",
          title: "Super Mario Bros",
          coverImage: "mario-cover",
          lastPlayed: new Date("2025-01-10T12:00:00.000Z"),
        },
      ],
    },
    ...overrides,
  };
}

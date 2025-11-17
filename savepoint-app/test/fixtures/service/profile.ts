export const basicUserProfileFixture = {
  username: "testuser",
  image: "https://example.com/avatar.jpg",
  email: "test@example.com",
  name: "Test User",
  createdAt: new Date("2024-01-15"),
};
export const userProfileWithNullFieldsFixture = {
  username: null,
  image: null,
  email: "test@example.com",
  name: "Test User",
  createdAt: new Date("2024-01-15"),
};
export const newUserProfileFixture = {
  username: "newuser",
  image: null,
  email: "new@example.com",
  name: "New User",
  createdAt: new Date("2024-03-01"),
};
export const libraryStatsSuccessFixture = {
  ok: true as const,
  data: {
    statusCounts: {
      CURIOUS_ABOUT: 5,
      CURRENTLY_EXPLORING: 2,
      EXPERIENCED: 10,
    },
    recentGames: [
      {
        gameId: "game-1",
        title: "Test Game 1",
        coverImage: "https://example.com/cover1.jpg",
        lastPlayed: new Date("2024-03-01"),
      },
      {
        gameId: "game-2",
        title: "Test Game 2",
        coverImage: null,
        lastPlayed: new Date("2024-02-28"),
      },
    ],
  },
};
export const libraryStatsEmptyFixture = {
  ok: true as const,
  data: {
    statusCounts: {},
    recentGames: [],
  },
};
export const libraryStatsErrorFixture = {
  ok: false as const,
  error: {
    code: "STATS_FETCH_FAILED",
    message: "Failed to fetch library stats",
  },
};
export const userForUnchangedUsernameFixture = {
  id: "user-123",
  username: "existinguser",
  usernameNormalized: "existinguser",
  image: null,
};
export const userForNewUsernameFixture = {
  id: "user-123",
  username: "newuser123",
  usernameNormalized: "newuser123",
  image: null,
};
export const userWithAvatarUpdateFixture = {
  id: "user-123",
  username: "testuser",
  usernameNormalized: "testuser",
  image: "https://example.com/avatar.jpg",
};
export const existingUserWithTakenUsernameFixture = {
  id: "user-456",
};
export const userWithNoUsernameFixture = {
  username: null,
  name: "John Doe",
  createdAt: new Date("2025-01-20T11:50:00Z"),
};
export const userWithUsernameAndRecentCreationFixture = {
  username: "existinguser",
  name: "John Doe",
  createdAt: new Date("2025-01-20T11:58:00Z"),
};
export const userWithoutUsernameRecentCreationFixture = {
  username: null,
  name: "Jane Smith",
  createdAt: new Date("2025-01-20T11:57:00Z"),
};
export const userWithUsernameNotRecentFixture = {
  username: "existinguser",
  name: "John Doe",
  createdAt: new Date("2025-01-20T11:50:00Z"),
};
export const userAtExactBoundaryFixture = {
  username: "boundaryuser",
  name: "Boundary Test",
  createdAt: new Date("2025-01-20T11:55:00Z"),
};
export const userJustUnderBoundaryFixture = {
  username: "recentuser",
  name: "Recent User",
  createdAt: new Date("2025-01-20T11:55:01Z"),
};
export const userWithSpecialCharactersNameFixture = {
  username: null,
  name: "John-Paul O'Brien",
  createdAt: new Date("2025-01-20T11:50:00Z"),
};
export const userWithLongNameFixture = {
  username: null,
  name: "Christopher Alexander Montgomery",
  createdAt: new Date("2025-01-20T11:50:00Z"),
};
export const userWithNullNameFixture = {
  username: null,
  name: null,
  createdAt: new Date("2025-01-20T11:50:00Z"),
};
export const newUserForRedirectFixture = {
  username: null,
  name: "New User",
  profileSetupCompletedAt: null,
  createdAt: new Date("2025-01-20T11:58:00Z"),
};
export const existingUserForRedirectFixture = {
  username: "existing",
  name: "Existing User",
  profileSetupCompletedAt: new Date("2025-01-10T00:00:00Z"),
  createdAt: new Date("2025-01-01T00:00:00Z"),
};
